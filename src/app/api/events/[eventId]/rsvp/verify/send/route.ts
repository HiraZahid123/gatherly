import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rsvpResendSchema } from "@/lib/validation";
import { formatPhone, generateOTP } from "@/lib/otp";
import { sendEmail } from "@/lib/mail";
import { getWhatsAppService } from "@/services/whatsapp";

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ eventId: string }> }
) {
    const params = await props.params;
    try {
        const { eventId } = params;
        const body = await request.json();

        const validation = rsvpResendSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: "Invalid email" }, { status: 400 });
        }

        const { guestEmail, guestPhone, inviteToken } = validation.data;
        const normalizedEmail = guestEmail ? guestEmail.trim().toLowerCase() : "";
        const verifyByPhone = !normalizedEmail && Boolean(guestPhone);
        const phone = guestPhone ? formatPhone(guestPhone) : "";

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { title: true, isPrivate: true, visibility: true }
        });

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        const isPrivate = event.isPrivate || event.visibility === "PRIVATE";
        // 🛡️ SECURITY: Only allow OTP if invited to private event
        if (isPrivate) {
            const invitation = await (prisma as any).invitation.findFirst({
                where: {
                    eventId,
                    OR: [
                        ...(inviteToken ? [{ token: inviteToken.trim() }] : []),
                        ...(normalizedEmail ? [
                            { email: normalizedEmail },
                            { email: { equals: normalizedEmail, mode: "insensitive" } }
                        ] : []),
                        ...(phone ? [{ phone }] : []),
                    ]
                }
            });

            if (!invitation) {
                return NextResponse.json(
                    { error: "This is a private event. You must be invited by the host to RSVP." },
                    { status: 403 }
                );
            }
        }

        const otpCode = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        const contactWhere = verifyByPhone
            ? { guestPhone: phone }
            : { guestEmail: normalizedEmail };
        const existingRSVP = await prisma.rSVP.findFirst({
            where: {
                eventId,
                ...(verifyByPhone ? { guestPhone: phone } : {
                    OR: [
                        { guestEmail: normalizedEmail },
                        { guestEmail: { equals: normalizedEmail, mode: "insensitive" } }
                    ]
                })
            }
        });

        if (existingRSVP) {
            await prisma.rSVP.update({
                where: { id: existingRSVP.id },
                data: {
                    otpCode,
                    otpExpires,
                    guestEmail: normalizedEmail || existingRSVP.guestEmail,
                    guestPhone: phone || undefined,
                }
            });
        } else {
            await prisma.rSVP.create({
                data: {
                    eventId,
                    guestEmail: normalizedEmail || null,
                    guestPhone: phone || null,
                    guestName: "Guest", // Placeholder until verified
                    status: "PENDING",
                    otpCode,
                    otpExpires,
                }
            });
        }

        if (verifyByPhone) {
            const sent = await getWhatsAppService().sendOTP(phone, otpCode);
            if (!sent) {
                return NextResponse.json({ error: "Unable to send a WhatsApp code right now" }, { status: 503 });
            }
        } else {
            const emailResult = await sendEmail({
                to: normalizedEmail,
                subject: `${otpCode} is your verification code · JollyWitMe`,
                priority: "high",
                text: `Your JollyWitMe verification code is: ${otpCode}\n\nEnter this code to complete your RSVP for ${event.title}.\nThis code will expire in 10 minutes.\n\nIf you did not request this code, you can safely ignore this email.\n— The JollyWitMe Team`,
                html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <h1 style="color: #059669; font-size: 24px; font-weight: 800; margin: 0 0 6px 0; letter-spacing: -0.02em;">JollyWitMe</h1>
                        <p style="color: #6b7280; font-size: 13px; margin: 0; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;">Verification Code</p>
                    </div>
                    <div style="padding: 24px 0; border-top: 1px solid #f3f4f6; border-bottom: 1px solid #f3f4f6; text-align: center;">
                        <p style="color: #111827; font-size: 15px; line-height: 1.5; margin: 0 0 20px 0;">
                            Use the 6-digit code below to verify your email and complete your RSVP for <strong>${event.title}</strong>:
                        </p>
                        <div style="display: inline-block; background-color: #f0fdf4; border: 2px dashed #059669; padding: 16px 36px; border-radius: 12px; margin: 8px 0 20px 0;">
                            <span style="font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #059669; font-family: monospace;">${otpCode}</span>
                        </div>
                        <p style="color: #6b7280; font-size: 13px; margin: 0;">
                            ⏳ This code expires in <strong>10 minutes</strong>.
                        </p>
                    </div>
                    <div style="margin-top: 24px; text-align: center;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0 0 6px 0;">If you didn't request this verification code, please ignore this email.</p>
                        <p style="color: #111827; font-size: 13px; font-weight: 600; margin: 0;">From the JollyWitMe Team ✨</p>
                    </div>
                </div>
                `,
            });

            if (!emailResult.success) {
                console.error("Failed to send RSVP OTP email:", emailResult.error);
                return NextResponse.json({ error: "Failed to send verification code" }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("RSVP Send OTP error:", error);
        return NextResponse.json({ error: "Failed to send verification code" }, { status: 500 });
    }
}
