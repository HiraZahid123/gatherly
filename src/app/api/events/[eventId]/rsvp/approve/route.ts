import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ eventId: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();
        const { eventId } = params;
        const body = await request.json();
        const { rsvpId, userId, guestEmail, status } = body;

        if (!status || !["ACCEPTED", "DECLINED"].includes(status)) {
            return NextResponse.json(
                { error: "Invalid status. Use ACCEPTED or DECLINED" },
                { status: 400 }
            );
        }

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Verify the user is the host of the event
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { hostId: true }
        });

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        if (event.hostId !== session.user.id) {
            return NextResponse.json(
                { error: "Only the host can approve guests" },
                { status: 403 }
            );
        }

        let targetRsvp;

        if (rsvpId) {
            targetRsvp = await prisma.rSVP.findUnique({ where: { id: rsvpId } });
        } else if (userId) {
            targetRsvp = await prisma.rSVP.findFirst({ where: { eventId, userId } });
        } else if (guestEmail) {
            targetRsvp = await prisma.rSVP.findFirst({ where: { eventId, guestEmail } });
        } else {
            return NextResponse.json(
                { error: "Missing rsvpId, userId, or guestEmail" },
                { status: 400 }
            );
        }

        if (!targetRsvp) {
            return NextResponse.json({ error: "RSVP not found" }, { status: 404 });
        }

        const rsvp = await prisma.rSVP.update({
            where: { id: targetRsvp.id },
            data: { status }
        });

        if ((global as any).io) {
            (global as any).io.to(`event-${eventId}`).emit('rsvp-update', { rsvpId: rsvp.id, status: rsvp.status });
        }

        return NextResponse.json({ success: true, rsvp });
    } catch (error) {
        console.error("Guest Approval error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
