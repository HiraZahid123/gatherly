import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { broadcastSchema } from "@/lib/validation";
import { sendEmail } from "@/lib/mail";
import { formatPhone } from "@/lib/otp";
import { getWhatsAppService } from "@/services/whatsapp";

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ eventId: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { eventId } = params;
        const body = await request.json();

        // 1. Validate body
        const validation = broadcastSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: "Invalid data", details: validation.error.format() }, { status: 400 });
        }

        const { message, audience } = validation.data;

        // 2. Verify Host permission
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { hostId: true, title: true }
        });

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        if (event.hostId !== session.user.id && (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "Only the host can send broadcasts" }, { status: 403 });
        }

        // 3. Rate Limit Check (Max 2 per 24 hours)
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const broadcastCount = await prisma.broadcast.count({
            where: {
                eventId,
                createdAt: { gte: twentyFourHoursAgo }
            }
        });

        if (broadcastCount >= 2) {
            return NextResponse.json({
                error: "Rate limit exceeded. You can only send 2 broadcasts every 24 hours."
            }, { status: 429 });
        }

        // 4. Fetch targeted guests (email + phone)
        const rsvpWhere: any = { eventId };
        if (audience === "ACCEPTED") {
            rsvpWhere.status = "ACCEPTED";
        } else if (audience === "WAITLISTED") {
            rsvpWhere.status = "WAITLISTED";
        }

        const rsvps = await (prisma as any).rSVP.findMany({
            where: rsvpWhere,
            select: {
                guestEmail: true,
                guestName: true,
                guestPhone: true,
                user: { select: { email: true, phone: true } },
            }
        });

        const emails: string[] = [...new Set<string>(rsvps
            .map((r: any) => r.guestEmail || r.user?.email)
            .filter((email: any): email is string => Boolean(email))
            .map((email: string) => email.toLowerCase()))];
        const phones: string[] = [...new Set<string>(rsvps
            .map((r: any) => r.guestPhone || r.user?.phone)
            .filter((phone: any): phone is string => Boolean(phone?.trim()))
            .map((phone: string) => formatPhone(phone)))]
            .filter((phone) => /^\+[1-9]\d{7,14}$/.test(phone));

        if (emails.length === 0 && phones.length === 0) {
            return NextResponse.json({ error: "No guests found for this audience" }, { status: 400 });
        }

        const whatsapp = getWhatsAppService();
        if (phones.length > 0 && !whatsapp.getLastQR().isConnected) {
            return NextResponse.json({
                error: "WhatsApp is not connected. Open Admin > WhatsApp Bot, connect the gateway, then retry. No broadcast was sent."
            }, { status: 503 });
        }

        let mappedAudience: "ALL" | "CONFIRMED" | "PENDING" = "ALL";
        if (audience === "ACCEPTED") mappedAudience = "CONFIRMED";
        else if (audience === "WAITLISTED") mappedAudience = "PENDING";

        // 5. Create Broadcast record
        const broadcast = await prisma.broadcast.create({
            data: {
                eventId,
                message,
                audience: mappedAudience,
                sentAt: new Date(),
            }
        });

        // 6. Send Emails in chunks
        const emailTemplate = () => `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
                <h2 style="color: #000;">Message from ${event.title}</h2>
                <p style="font-size: 16px; line-height: 1.6; color: #333; white-space: pre-wrap;">${message}</p>
                <hr style="margin: 32px 0; border: 0; border-top: 1px solid #eee;" />
                <p style="font-size: 12px; color: #888;">
                    You are receiving this because you RSVP'd to ${event.title}.
                </p>
            </div>
        `;

        const chunkSize = 50;
        let emailCount = 0;
        for (let i = 0; i < emails.length; i += chunkSize) {
            const chunk = emails.slice(i, i + chunkSize);
            await Promise.all(chunk.map((email: string) =>
                sendEmail({
                    to: email,
                    subject: `Update for ${event.title}`,
                    html: emailTemplate()
                }).then(r => { if (r.success) emailCount++; })
                  .catch(err => console.error(`Broadcast email failed for ${email}:`, err))
            ));
        }

        // 7. Send WhatsApp messages to RSVP phone contacts.
        const whatsappBody = `${event.title}: ${message}`;
        let whatsappCount = 0;
        let whatsappFailedCount = 0;
        for (const phone of phones) {
            if (await whatsapp.sendMessage(phone, whatsappBody)) {
                whatsappCount++;
            } else {
                whatsappFailedCount++;
                break;
            }
        }

        const warning = whatsappFailedCount > 0
            ? `WhatsApp delivery stopped after ${whatsappCount} messages. The failed recipient and remaining recipients may not have received it; check WhatsApp before retrying. Email delivery may already be complete.`
            : undefined;

        return NextResponse.json({
            success: true,
            broadcastId: broadcast.id,
            recipientCount: emailCount + whatsappCount,
            emailCount,
            whatsappCount,
            warning,
        });

    } catch (error) {
        console.error("Broadcast error:", error);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}
