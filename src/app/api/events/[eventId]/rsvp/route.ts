import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rsvpSubmitSchema } from "@/lib/validation";
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

        // 1. Validate request body
        const validation = rsvpSubmitSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: "Invalid data", details: validation.error.format() },
                { status: 400 }
            );
        }

        const { status, guestName, guestEmail, inviteToken, captchaToken } = validation.data;

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

        // 2. Fetch event details
        const event = await (prisma as any).event.findUnique({
            where: { id: eventId },
            select: {
                id: true,
                isPrivate: true,
                capacity: true,
                hostId: true,
                status: true,
                title: true,
                slug: true,
                description: true,
                location: true,
                startDate: true,
                endDate: true,
                rsvpDeadline: true
            }
        }) as any;

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        // 🛡️ SECURITY: Check RSVP deadline (with 12hr timezone buffer)
        if (event.rsvpDeadline) {
            const deadlineWithBuffer = new Date(event.rsvpDeadline).getTime() + (12 * 60 * 60 * 1000);
            if (Date.now() > deadlineWithBuffer) {
                return NextResponse.json(
                    { error: "RSVP window has closed for this event." },
                    { status: 403 }
                );
            }
        }

        // 3. Verify Privacy / Invitations
        const isHost = session?.user?.id === event.hostId;
        if (event.isPrivate) { 
            // Check if user is STAFF - staff cannot RSVP
            if (session?.user?.id) {
                const isStaff = await (prisma as any).eventStaff.findUnique({
                    where: {
                        eventId_userId: {
                            eventId,
                            userId: session.user.id
                        }
                    }
                });

                if (isStaff) {
                    return NextResponse.json(
                        { error: "Staff members cannot RSVP to this event. You already have access!" },
                        { status: 403 }
                    );
                }
            }

            // Check if invited by token OR by email
            const invitation = await (prisma as any).invitation.findFirst({
                where: {
                    eventId,
                    OR: [
                        { token: inviteToken },
                        { email: guestEmail }
                    ]
                }
            });

            if (!invitation && !isHost) {
                return NextResponse.json(
                    { error: "This is a private event. An invitation is required." },
                    { status: 403 }
                );
            }
        }

        // 4. Check Capacity and Determine Status
        let finalStatus = status;
        let waitlistPosition = null;
        let qrToken = null;

        if (status === "ACCEPTED") {
            const acceptedCount = await (prisma as any).rSVP.count({
                where: { eventId, status: "ACCEPTED" }
            });

            if (event.capacity && acceptedCount >= event.capacity) {
                finalStatus = "WAITLISTED";
                const lastWaitlisted = await (prisma as any).rSVP.findFirst({
                    where: { eventId, status: "WAITLISTED" },
                    orderBy: { waitlistPosition: "desc" }
                });
                waitlistPosition = (Number(lastWaitlisted?.waitlistPosition) || 0) + 1;
            } else {
                qrToken = generateQRToken();
            }
        }

        // 5. Handle authenticated vs Guest RSVP entry
        // 🔑 Merge logic: If user is logged in, check if a guest record exists for this email
        let existingRSVP = null;
        if (session?.user?.id) {
            existingRSVP = await (prisma as any).rSVP.findFirst({
                where: {
                    eventId,
                    OR: [
                        { userId: session.user.id },
                        { guestEmail: guestEmail }
                    ]
                }
            });
        } else {
            existingRSVP = await (prisma as any).rSVP.findFirst({
                where: { eventId, guestEmail }
            });
        }

        const rsvpData = {
            status: finalStatus as any,
            guestName,
            guestEmail,
            waitlistPosition,
            qrToken: qrToken || existingRSVP?.qrToken || undefined,
            userId: session?.user?.id || undefined,
        };

        const rsvp = await (prisma as any).rSVP.upsert({
            where: { id: existingRSVP?.id || 'new-rsvp' },
            update: rsvpData,
            create: {
                ...rsvpData,
                eventId
            }
        });

        if ((global as any).io) {
            (global as any).io.to(`event-${eventId}`).emit('rsvp-update', { rsvpId: rsvp.id });
        }

        // 7. Send confirmation emails (async)
        if (finalStatus === "ACCEPTED" || finalStatus === "WAITLISTED") {
            const isAccepted = finalStatus === "ACCEPTED";
            const qrUrl = `${process.env.NEXTAUTH_URL}/e/${event.slug}?ticket=${qrToken}`;

            sendEmail({
                to: guestEmail,
                subject: isAccepted
                    ? `You're going to ${event.title}! 🎉`
                    : `You're on the waitlist for ${event.title}`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
                        <h1 style="color: #000; margin-bottom: 24px;">${isAccepted ? "You're in!" : "Waitlist Confirmed"}</h1>
                        <p style="font-size: 16px; line-height: 1.6; color: #444;">
                            ${isAccepted
                        ? `Your RSVP for <strong>${event.title}</strong> has been confirmed. We've attached your entry ticket below.`
                        : `You've been added to the waitlist for <strong>${event.title}</strong> at position #${waitlistPosition}. We'll notify you automatically if a spot opens up!`}
                        </p>
                        
                        ${isAccepted ? `
                        <div style="margin: 32px 0; padding: 24px; background: #f9f9f9; border-radius: 8px; text-align: center;">
                            <p style="margin-bottom: 16px; font-weight: bold; color: #000;">YOUR ENTRY QR CODE</p>
                            <a href="${qrUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-bottom: 20px;">View Ticket</a>
                            
                            <p style="margin: 10px 0; font-size: 14px; font-weight: bold; color: #000;">MANUAL ENTRY CODE: ${qrToken}</p>
                            
                            <p style="margin: 20px 0 10px; font-size: 12px; color: #666; font-weight: bold; text-transform: uppercase;">Add to Calendar</p>
                            <div style="display: flex; justify-content: center; gap: 10px;">
                                <a href="${generateGoogleCalendarUrl({ title: event.title, description: event.description || '', location: event.location || '', startDate: event.startDate, endDate: event.endDate || undefined })}" style="font-size: 13px; color: #4285F4; text-decoration: none; font-weight: bold; margin: 0 10px;">Google</a>
                                <a href="${generateOutlookUrl({ title: event.title, description: event.description || '', location: event.location || '', startDate: event.startDate, endDate: event.endDate || undefined })}" style="font-size: 13px; color: #0078D4; text-decoration: none; font-weight: bold; margin: 0 10px;">Outlook</a>
                            </div>
                        </div>
                        ` : ''}

                        <p style="font-size: 14px; color: #888; margin-top: 32px;">
                            See you soon!<br>
                            The ${event.title} Team
                        </p>
                    </div>
                `
            }).catch(error => console.error("RSVP Email Error:", error));
        }

        // 8. Auto-Promote logic
        // If they were previously ACCEPTED and now are NOT (DECLINED/MAYBE/WAITLISTED), free up a spot
        if (existingRSVP?.status === "ACCEPTED" && status !== "ACCEPTED") {
            await promoteNextFromWaitlist(eventId);
        }

        return NextResponse.json({ success: true, rsvp });
    } catch (error) {
        console.error("RSVP error:", error);
        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ eventId: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();
        const { eventId } = params;

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        await prisma.rSVP.deleteMany({
            where: {
                eventId,
                userId: session.user.id
            }
        });

        if ((global as any).io) {
            (global as any).io.to(`event-${eventId}`).emit('rsvp-update', { status: 'DELETED' });
        }

        return NextResponse.json({ success: true, message: "RSVP removed" });
    } catch (error) {
        console.error("RSVP Delete error:", error);
        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ eventId: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();
        const { eventId } = params;

        if (!session?.user?.id) {
            return NextResponse.json({ rsvp: null });
        }

        const rsvp = await prisma.rSVP.findFirst({
            where: {
                eventId,
                userId: session.user.id
            }
        });

        return NextResponse.json({ success: true, rsvp });
    } catch (error) {
        console.error("RSVP Fetch error:", error);
        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}
