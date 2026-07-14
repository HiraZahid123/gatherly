import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mail";

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

        if (invitation.event.hostId !== session.user.id) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        if (!invitation.email) {
            return NextResponse.json({ error: "Invitation has no email address" }, { status: 400 });
        }

        const email = invitation.email;

        // Resend Email
        const inviteLink = `${process.env.NEXTAUTH_URL}/e/${invitation.event.slug}?invite=${invitation.token}`;
        const emailResult = await sendEmail({
            to: email,
            subject: `Reminder: You're invited to ${invitation.event.title}!`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Join us!</h2>
                    <p>This is a reminder that you have been invited to <strong>${invitation.event.title}</strong>.</p>
                    <p>Click the button below to view the event and RSVP:</p>
                    <div style="margin: 30px 0;">
                        <a href="${inviteLink}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Invitation</a>
                    </div>
                </div>
            `
        });

        if (emailResult.success) {
            await prisma.invitation.update({
                where: { id: invitationId },
                data: { sentAt: new Date() }
            });
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
        }
    } catch (error) {
        console.error("Error resending invitation:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
