import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invitationCreateSchema } from "@/lib/validation";
import { sendEmail } from "@/lib/mail";
import { sendSms, normalizePhone } from "@/lib/sms";
import crypto from "crypto";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        const { eventId } = await params;
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user is host or staff
        const event = await prisma.event.findFirst({
            where: {
                id: eventId,
                OR: [
                    { hostId: session.user.id },
                    { staff: { some: { userId: session.user.id } } }
                ]
            }
        });

        if (!event) {
            return NextResponse.json({ error: "Event not found or access denied" }, { status: 404 });
        }

        const invitations = await prisma.invitation.findMany({
            where: { eventId },
            orderBy: { createdAt: "desc" }
        });

        // Check if host has connected Stripe Connect
        const stripeAccount = await prisma.stripeAccount.findUnique({
            where: { userId: event.hostId }
        });
        const stripeConnected = !!(stripeAccount && stripeAccount.chargesEnabled);

        return NextResponse.json({ 
            invitations,
            event: {
                isPaid: event.isPaid,
                stripeConnected
            }
        });
    } catch (error) {
        console.error("Error fetching invitations:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        const { eventId } = await params;
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only host can send invites
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { id: true, title: true, hostId: true, slug: true, isPaid: true }
        });

        if (!event || event.hostId !== session.user.id) {
            return NextResponse.json({ error: "Only the host can send invitations" }, { status: 403 });
        }

        // If the event is paid, verify the host has connected Stripe Connect
        if (event.isPaid) {
            const stripeAccount = await prisma.stripeAccount.findUnique({
                where: { userId: session.user.id }
            });
            if (!stripeAccount || !stripeAccount.chargesEnabled) {
                return NextResponse.json({ 
                    error: "Stripe connection required. Since this is a paid event, you must connect your Stripe account in Settings to enable ticketing and payouts before you can invite guests." 
                }, { status: 400 });
            }
        }

        const body = await request.json();
        const validation = invitationCreateSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
        }

        const { emails, phones } = validation.data;

        const sendOneEmail = async (email: string) => {
            const token = crypto.randomBytes(32).toString("hex");
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);
            try {
                const existing = await (prisma as any).invitation.findFirst({ where: { eventId, email } });
                if (existing) return { contact: email, type: "email", status: "error", message: "Already invited" };

                const invitation = await (prisma as any).invitation.create({
                    data: { eventId, email, token, expiresAt, status: "PENDING" }
                });
                const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "https://jollywitme.com";
                const inviteLink = `${baseUrl}/e/${event.slug}?invite=${token}`;
                const emailResult = await sendEmail({
                    to: email,
                    subject: `You're invited to ${event.title}! 🎉`,
                    html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px;"><div style="text-align: center; margin-bottom: 24px;"><h1 style="color: #059669; font-size: 24px; font-weight: 800; margin: 0 0 8px 0;">JollyWitMe</h1><p style="color: #6b7280; font-size: 14px; margin: 0;">You're Invited!</p></div><div style="padding: 20px 0; border-top: 1px solid #f3f4f6; border-bottom: 1px solid #f3f4f6;"><p style="color: #111827; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">You have been invited to attend <strong>${event.title}</strong>.</p><div style="text-align: center; margin: 28px 0;"><a href="${inviteLink}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);">View Invitation & RSVP →</a></div></div><p style="color: #9ca3af; font-size: 12px; margin-top: 20px; text-align: center;">This invitation was sent to ${email}.</p></div>`
                });
                if (emailResult.success) {
                    await prisma.invitation.update({ where: { id: invitation.id }, data: { sentAt: new Date() } });
                    return { contact: email, type: "email", status: "success" };
                }
                return { contact: email, type: "email", status: "partial", message: "Invite recorded but email failed to send" };
            } catch (err) {
                console.error(`Error inviting ${email}:`, err);
                return { contact: email, type: "email", status: "error", message: "Database error" };
            }
        };

        const sendOneSms = async (rawPhone: string) => {
            const phone = normalizePhone(rawPhone);
            const token = crypto.randomBytes(32).toString("hex");
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);
            try {
                const existing = await (prisma as any).invitation.findFirst({ where: { eventId, phone } });
                if (existing) return { contact: phone, type: "sms", status: "error", message: "Already invited" };

                const invitation = await (prisma as any).invitation.create({
                    data: { eventId, phone, token, expiresAt, status: "PENDING" }
                });
                const inviteLink = `${process.env.NEXTAUTH_URL}/e/${event.slug}?invite=${token}`;
                const smsResult = await sendSms({ to: phone, body: `You're invited to ${event.title}! RSVP here: ${inviteLink}` });
                if (smsResult.success) {
                    await prisma.invitation.update({ where: { id: invitation.id }, data: { sentAt: new Date() } });
                    return { contact: phone, type: "sms", status: "success" };
                }
                return { contact: phone, type: "sms", status: "partial", message: "Invite recorded but SMS not configured" };
            } catch (err) {
                console.error(`Error inviting phone ${rawPhone}:`, err);
                return { contact: rawPhone, type: "sms", status: "error", message: "Database error" };
            }
        };

        // All email + SMS invites fire in parallel
        const settled = await Promise.allSettled([
            ...emails.map(sendOneEmail),
            ...phones.map(sendOneSms),
        ]);

        const invitationResults = settled.map(r =>
            r.status === "fulfilled" ? r.value : { contact: "unknown", type: "unknown", status: "error", message: "Unexpected error" }
        );

        return NextResponse.json({ results: invitationResults });
    } catch (error) {
        console.error("Error creating invitations:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
