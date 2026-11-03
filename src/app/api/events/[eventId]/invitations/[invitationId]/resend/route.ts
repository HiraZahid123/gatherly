import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mail";
import { sendSms } from "@/lib/sms";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string; invitationId: string }> }
) {
    try {
        const { eventId, invitationId } = await params;
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get invite and event details
        const invitation = await prisma.invitation.findUnique({
            where: { id: invitationId },
            include: {
                event: {
                    select: {
                        hostId: true,
                        title: true,
                        slug: true
                    }
                }
            }
        });

        if (!invitation || invitation.eventId !== eventId) {
            return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
        }

        if (invitation.event.hostId !== session.user.id && (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        if (!invitation.email && !invitation.phone) {
            return NextResponse.json({ error: "Invitation has neither email nor phone number" }, { status: 400 });
        }

        // Ensure links sent to external messengers always use a public domain that WhatsApp can turn into a clickable hyperlink
        const envUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://jollywitme.com").replace(/\/$/, "");
        const baseUrl = envUrl.includes("localhost") || envUrl.includes("127.0.0.1") ? "https://jollywitme.com" : envUrl;
        const inviteLink = `${baseUrl}/e/${invitation.event.slug}?invite=${invitation.token}`;

        let sendSuccess = false;
        let errorMessage = "";

        if (invitation.email) {
            const emailResult = await sendEmail({
                to: invitation.email,
                subject: `Reminder: You're invited to ${invitation.event.title}! 🎉`,
                html: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px;">
                        <div style="text-align: center; margin-bottom: 24px;">
                            <h1 style="color: #059669; font-size: 24px; font-weight: 800; margin: 0 0 8px 0;">JollyWitMe</h1>
                            <p style="color: #6b7280; font-size: 14px; margin: 0;">Event Invitation Reminder</p>
                        </div>
                        <div style="padding: 20px 0; border-top: 1px solid #f3f4f6; border-bottom: 1px solid #f3f4f6;">
                            <p style="color: #111827; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                                This is a reminder that you have been invited to <strong>${invitation.event.title}</strong>.
                            </p>
                            <div style="text-align: center; margin: 28px 0;">
                                <a href="${inviteLink}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);">
                                    View Invitation & RSVP →
                                </a>
                            </div>
                        </div>
                        <p style="color: #111827; font-size: 13px; margin-top: 20px; text-align: center; font-weight: 600;">From the JollyWitMe Team ✨</p>
                    </div>
                `
            });
            sendSuccess = emailResult.success;
            if (!sendSuccess) errorMessage = "Failed to deliver email through SMTP";
        } else if (invitation.phone) {
            const whatsappMessage = `🎉 *Reminder: You're invited to ${invitation.event.title}!*

View your private invitation and RSVP here:
${inviteLink}

_(Tip: If the link is not clickable yet, reply to this message or save this number to your contacts)_`;

            const smsResult = await sendSms({
                to: invitation.phone,
                body: whatsappMessage
            });
            sendSuccess = smsResult.success;
            if (!sendSuccess) errorMessage = smsResult.error || "Failed to send WhatsApp message";
        }

        if (sendSuccess) {
            await prisma.invitation.update({
                where: { id: invitationId },
                data: { sentAt: new Date() }
            });
            return NextResponse.json({ success: true, inviteLink });
        } else {
            return NextResponse.json({ error: errorMessage || "Failed to resend invitation" }, { status: 500 });
        }
    } catch (error) {
        console.error("Error resending invitation:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
