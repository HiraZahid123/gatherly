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
                const inviteLink = `${process.env.NEXTAUTH_URL}/e/${event.slug}?invite=${token}`;
                const emailResult = await sendEmail({
                    to: email,
                    subject: `You're invited to ${event.title}!`,
                    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto"><h2>You're invited!</h2><p>You have been invited to attend <strong>${event.title}</strong>.</p><p>Click the button below to view the event and RSVP:</p><div style="margin:30px 0"><a href="${inviteLink}" style="background-color:#7c3aed;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold">View Invitation</a></div><p style="color:#666;font-size:12px">This invitation was sent to ${email}.</p></div>`
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
