import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rsvpVerifySchema } from "@/lib/validation";
import { generateQRToken, promoteNextFromWaitlist } from "@/lib/rsvp";
import { sendEmail } from "@/lib/mail";
import { generateGoogleCalendarUrl, generateOutlookUrl } from "@/lib/calendar";

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ eventId: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();
        const { eventId } = params;
        const body = await request.json();

        const validation = rsvpVerifySchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: "Invalid data", details: validation.error.format() }, { status: 400 });
        }

        const { guestEmail, otp, status, guestName, captchaToken } = validation.data;

        // 1.5 Verify CAPTCHA (only for guests/public)
        if (!session) {
            const { verifyTurnstileToken } = await import("@/lib/turnstile");
            const verification = await verifyTurnstileToken(captchaToken || "");
            if (!verification.success) {
                return NextResponse.json(
                    { error: "Security check failed. Please try again.", details: verification.error },
                    { status: 400 }
                );
            }
        }

        // Find the RSVP with the OTP
        const existingRSVP = await prisma.rSVP.findFirst({
            where: {
                eventId,
                guestEmail
            }
        });

        if (!existingRSVP) {
            return NextResponse.json({ error: "RSVP not found" }, { status: 404 });
        }

        // Verify OTP
        if (existingRSVP.otpCode !== otp) {
            return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
        }

        if (existingRSVP.otpExpires && new Date() > new Date(existingRSVP.otpExpires)) {
            return NextResponse.json({ error: "Verification code expired" }, { status: 400 });
        }

        // OTP Verified! Now process the actual RSVP logic
        // Fetch event for capacity check
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: {
                id: true,
                capacity: true,
                isPrivate: true,
                title: true,
                slug: true,
                description: true,
                location: true,
                startDate: true,
                endDate: true,
                rsvpDeadline: true
            }
        });

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        // 🛡️ SECURITY: Double-check RSVP deadline (with 12hr timezone buffer)
        if (event.rsvpDeadline) {
            const deadlineWithBuffer = new Date(event.rsvpDeadline).getTime() + (12 * 60 * 60 * 1000);
            if (Date.now() > deadlineWithBuffer) {
                return NextResponse.json(
                    { error: "RSVP window has closed for this event." },
                    { status: 403 }
                );
            }
        }

        // 🛡️ SECURITY: Double-check invitation for private events
        if (event.isPrivate) {
            const invitation = await prisma.invitation.findFirst({
                where: {
                    eventId,
                    email: guestEmail
                }
            });

            if (!invitation) {
                return NextResponse.json(
                    { error: "This is a private event. An invitation is required." },
                    { status: 403 }
                );
            }
        }

        let finalStatus = status;
        let waitlistPosition: number | null = null;
        let qrToken: string | null = null;

        if (status === "ACCEPTED") {
            const acceptedCount = await prisma.rSVP.count({
                where: { eventId, status: "ACCEPTED" }
            });

            if (event.capacity && acceptedCount >= event.capacity) {
                finalStatus = "WAITLISTED";
                const lastWaitlisted = await prisma.rSVP.findFirst({
                    where: { eventId, status: "WAITLISTED" },
                    orderBy: { waitlistPosition: "desc" }
                });
                waitlistPosition = (Number(lastWaitlisted?.waitlistPosition) || 0) + 1;
            } else {
                qrToken = generateQRToken();
            }
        }

        // Update the RSVP to verified status
        const rsvp = await prisma.rSVP.update({
            where: { id: existingRSVP.id },
            data: {
                status: finalStatus,
                guestName,
                waitlistPosition,
                qrToken,
                otpCode: null, // Clear OTP after use
                otpExpires: null
            }
        });

        // Send confirmation emails (async)
        if (finalStatus === "ACCEPTED" || finalStatus === "WAITLISTED") {
            const isAccepted = finalStatus === "ACCEPTED";
            const qrUrl = `${process.env.NEXTAUTH_URL}/e/${event.slug}?ticket=${qrToken}`;

            sendEmail({
                to: guestEmail,
                subject: isAccepted
                    ? `You're going to ${event.title}! 🎉`
                    : `You're on the waitlist for ${event.title}`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #ffffff; background: #000000; padding: 40px; border-radius: 16px;">
                        <h1 style="font-size: 28px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.05em; margin-bottom: 24px;">${isAccepted ? "You're in!" : "Waitlist"}</h1>
                        <p style="font-size: 16px; color: rgba(255,255,255,0.6); margin-bottom: 32px;">
                            Hello ${guestName},<br><br>
                            ${isAccepted
                        ? `Your RSVP for <strong>${event.title}</strong> has been confirmed. We've attached your entry ticket below.`
                        : `You've been added to the waitlist for <strong>${event.title}</strong> at position #${waitlistPosition}. We'll notify you automatically if a spot opens up!`}
                        </p>
                        
                        ${isAccepted ? `
                        <div style="margin: 32px 0; padding: 32px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; text-align: center;">
                            <p style="margin-bottom: 20px; font-size: 12px; font-weight: 900; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.2em;">YOUR ENTRY QR CODE</p>
                            <a href="${qrUrl}" style="display: inline-block; background: #ffffff; color: #000000; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 24px;">View Ticket</a>

                            <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 24px 0;">

                            <p style="margin-bottom: 16px; font-size: 10px; color: rgba(255,255,255,0.3); font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em;">Add to Calendar</p>
                            <div style="display: flex; justify-content: center; gap: 16px;">
                                <a href="${generateGoogleCalendarUrl({ title: event.title, description: event.description || '', location: event.location || '', startDate: event.startDate, endDate: event.endDate || undefined })}" style="font-size: 12px; color: #ffffff; text-decoration: underline; font-weight: 700; margin: 0 8px;">Google</a>
                                <a href="${generateOutlookUrl({ title: event.title, description: event.description || '', location: event.location || '', startDate: event.startDate, endDate: event.endDate || undefined })}" style="font-size: 12px; color: #ffffff; text-decoration: underline; font-weight: 700; margin: 0 8px;">Outlook</a>
                            </div>
                        </div>
                        ` : ''}

                        <p style="font-size: 12px; color: rgba(255,255,255,0.3); margin-top: 40px; text-transform: uppercase; letter-spacing: 0.1em;">
                            See you soon!<br>
                            The ${event.title} Team
                        </p>
                    </div>
                `
            }).catch(error => console.error("RSVP Verify Email Error:", error));
        }

        return NextResponse.json({ success: true, rsvp });
    } catch (error) {
        console.error("RSVP Verify error:", error);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}
