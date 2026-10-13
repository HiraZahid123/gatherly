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

        const { guestEmail, guestPhone } = validation.data;
        const verifyByPhone = !guestEmail && Boolean(guestPhone);
        const phone = guestPhone ? formatPhone(guestPhone) : "";

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { title: true, isPrivate: true }
        });

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        // 🛡️ SECURITY: Only allow OTP if invited to private event
        if (event.isPrivate) {
            const invitation = await prisma.invitation.findFirst({
                where: {
                    eventId,
                    OR: [
                        ...(guestEmail ? [{ email: guestEmail }] : []),
                        ...(phone ? [{ phone }] : []),
                    ]
                }
            });

            if (!invitation) {
                return NextResponse.json(
                    { error: "This is a private event. An invitation is required for this contact." },
                    { status: 403 }
                );
            }
        }

        const otpCode = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        const contactWhere = verifyByPhone ? { guestPhone: phone } : { guestEmail };
        const existingRSVP = await prisma.rSVP.findFirst({ where: { eventId, ...contactWhere } });

        if (existingRSVP) {
            await prisma.rSVP.update({
                where: { id: existingRSVP.id },
                data: {
                    otpCode,
                    otpExpires,
                    guestPhone: phone || undefined,
                }
            });
        } else {
            await prisma.rSVP.create({
                data: {
                    eventId,
                    guestEmail: guestEmail || null,
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
                to: guestEmail!,
                subject: `Verify your RSVP for ${event.title}`,
                html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #ffffff; background: #000000; padding: 40px; border-radius: 16px;">
                    <h2 style="font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.05em; margin-bottom: 24px;">Verify your RSVP</h2>
                    <p style="font-size: 16px; color: rgba(255,255,255,0.6); margin-bottom: 32px;">You're almost there! Use the code below to verify your email for <strong>${event.title}</strong>:</p>
                    <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 32px; text-align: center; font-size: 40px; font-weight: 900; letter-spacing: 12px; border-radius: 12px; color: #ffffff;">
                        ${otpCode}
                    </div>
                    <p style="font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 32px; text-transform: uppercase; letter-spacing: 0.1em;">This code expires in 10 minutes.</p>
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
