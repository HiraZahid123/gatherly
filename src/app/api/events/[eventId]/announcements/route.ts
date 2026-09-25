import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { sendBulkSms } from "@/lib/sms";
import { sendAnnouncementBroadcastEmail } from "@/lib/mail";

// GET — Fetch all announcements for an event (public)
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    const { eventId } = await params;
    try {
        const announcements = await prisma.announcement.findMany({
            where: { eventId },
            orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
            include: {
                host: { select: { id: true, name: true, image: true } },
            },
        });
        return NextResponse.json({ success: true, announcements });
    } catch (error) {
        console.error("GET /announcements error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch announcements" }, { status: 500 });
    }
}

// POST — Create an announcement (host / co-host only)
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    const { eventId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { hostId: true, theme: true },
        });
        if (!event) return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });

        const cohosts: any[] = (event.theme as any)?.settings?.hosts?.cohosts || [];
        const isAuthorized =
            event.hostId === session.user.id ||
            cohosts.some(
                (c: any) => c.id === session.user!.id || c.email === session.user!.email
            );
        if (!isAuthorized) {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { content, isPinned = false, notifyGuests = true } = body;
        if (!content?.trim()) {
            return NextResponse.json({ success: false, error: "Content is required" }, { status: 400 });
        }

        const announcement = await prisma.announcement.create({
            data: { eventId, hostId: session.user.id, content: content.trim(), isPinned },
            include: { host: { select: { id: true, name: true, image: true } } },
        });

        const eventWithGuests = await prisma.event.findUnique({
            where: { id: eventId },
            select: {
                title: true,
                slug: true,
                hostId: true,
                host: { select: { name: true } },
                rsvps: {
                    where: { status: { not: "DECLINED" } },
                    select: {
                        userId: true,
                        guestEmail: true,
                        guestName: true,
                        guestPhone: true,
                        user: { select: { email: true, name: true, phone: true } },
                    },
                },
            },
        });

        let inAppCount = 0;
        let smsCount = 0;
        let emailCount = 0;

        if (notifyGuests && eventWithGuests) {
            // 1. In-App Notifications
            const guestIds = [...new Set((eventWithGuests.rsvps || []).map((rsvp) => rsvp.userId).filter((id): id is string => Boolean(id)))];
            const inAppPromises = guestIds
                .filter((userId) => userId !== session.user!.id)
                .map((userId) =>
                    createNotification({
                        userId,
                        title: `Update from ${eventWithGuests.title || "your event"}`,
                        message: content.trim(),
                        type: "ANNOUNCEMENT",
                        link: `/e/${eventWithGuests.slug || eventId}`,
                    }).catch((err) => console.error("In-app notification error:", err))
                );
            await Promise.all(inAppPromises);
            inAppCount = guestIds.length;

            // 2. Text Blast (SMS)
            const phoneNumbers = [...new Set(
                (eventWithGuests.rsvps || [])
                    .map((r) => r.guestPhone || r.user?.phone)
                    .filter((p): p is string => Boolean(p && p.trim()))
            )];

            if (phoneNumbers.length > 0) {
                const smsMessage = `[JollyWitMe] Update for ${eventWithGuests.title}: ${content.trim()}`;
                try {
                    smsCount = await sendBulkSms(phoneNumbers, smsMessage);
                } catch (smsErr) {
                    console.error("Text Blast SMS error:", smsErr);
                }
            }

            // 3. Email Blast
            const emailMap = new Map<string, string>();
            for (const r of eventWithGuests.rsvps || []) {
                const email = r.guestEmail || r.user?.email;
                const name = r.guestName || r.user?.name || "Guest";
                if (email && email.includes("@")) {
                    emailMap.set(email.toLowerCase(), name);
                }
            }

            const emailPromises = Array.from(emailMap.entries()).map(([toEmail, guestName]) =>
                sendAnnouncementBroadcastEmail({
                    to: toEmail,
                    guestName,
                    eventTitle: eventWithGuests.title || "Event",
                    eventSlug: eventWithGuests.slug || eventId,
                    announcementContent: content.trim(),
                    hostName: eventWithGuests.host?.name || session.user.name || "The Host",
                }).catch((err) => console.error(`Email blast error for ${toEmail}:`, err))
            );
            await Promise.all(emailPromises);
            emailCount = emailMap.size;
        }

        return NextResponse.json({
            success: true,
            announcement,
            notificationsSent: {
                inApp: inAppCount,
                sms: smsCount,
                email: emailCount,
            },
        });
    } catch (error) {
        console.error("POST /announcements error:", error);
        return NextResponse.json({ success: false, error: "Failed to create announcement" }, { status: 500 });
    }
}

// DELETE — Delete an announcement (host / co-host only)
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    const { eventId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ success: false, error: "id required" }, { status: 400 });

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { hostId: true, theme: true },
        });
        if (!event) return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });

        const cohosts: any[] = (event.theme as any)?.settings?.hosts?.cohosts || [];
        const isAuthorized =
            event.hostId === session.user.id ||
            cohosts.some(
                (c: any) => c.id === session.user!.id || c.email === session.user!.email
            );
        if (!isAuthorized) {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }

        await prisma.announcement.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /announcements error:", error);
        return NextResponse.json({ success: false, error: "Failed to delete announcement" }, { status: 500 });
    }
}
