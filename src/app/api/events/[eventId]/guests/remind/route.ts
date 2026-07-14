import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mail";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ eventId: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await params;
    const { rsvpIds } = await request.json();

    if (!Array.isArray(rsvpIds) || rsvpIds.length === 0) {
        return NextResponse.json({ error: "No guests selected" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true, title: true, slug: true, startDate: true, hostId: true },
    });

    if (!event || event.hostId !== session.user.id) {
        return NextResponse.json({ error: "Not found or unauthorized" }, { status: 403 });
    }

    const rsvps = await (prisma as any).rSVP.findMany({
        where: { id: { in: rsvpIds }, eventId },
        include: { user: { select: { name: true, email: true } } },
    });

    const eventUrl = `${process.env.NEXTAUTH_URL}/e/${event.slug}`;
    const dateStr = event.startDate
        ? new Date(event.startDate).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
          })
        : "soon";

    let sent = 0;
    for (const rsvp of rsvps) {
        const email = rsvp.user?.email || rsvp.guestEmail;
        const name = rsvp.user?.name || rsvp.guestName || "Guest";
        if (!email) continue;

        await sendEmail({
            to: email,
            subject: `Reminder: ${event.title} is coming up!`,
            html: `
                <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0b;color:#ffffff;padding:32px;border-radius:16px">
                    <h2 style="margin:0 0 8px;font-size:24px">Hey ${name}! 👋</h2>
                    <p style="color:rgba(255,255,255,0.6);margin:0 0 24px">Just a friendly reminder that you're on the guest list for:</p>
                    <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:20px;margin-bottom:24px">
                        <h3 style="margin:0 0 4px;font-size:20px">${event.title}</h3>
                        <p style="color:rgba(255,255,255,0.5);margin:0;font-size:14px">${dateStr}</p>
                    </div>
                    <a href="${eventUrl}" style="display:inline-block;background:#ffffff;color:#000000;font-weight:700;padding:12px 28px;border-radius:999px;text-decoration:none;font-size:14px">
                        View Event →
                    </a>
                    <p style="color:rgba(255,255,255,0.3);font-size:12px;margin-top:32px">
                        You're receiving this because you're on the guest list for this event on Gatherly.
                    </p>
                </div>
            `,
        });
        sent++;
    }

    return NextResponse.json({ success: true, sent });
}
