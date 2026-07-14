import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ eventId: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();
        const { eventId } = params;

        // 1. Fetch event first
        const event = await (prisma as any).event.findUnique({
            where: { id: eventId },
            select: { hostId: true, guestListHidden: true }
        });

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        const isHost = session?.user?.id === event.hostId;

        // 2. If guest list is hidden and requester is not host, block access
        if (event.guestListHidden && !isHost) {
            return NextResponse.json({ success: true, guests: [], hidden: true });
        }

        // 3. Fetch RSVPs (capped at 500 — socket re-syncs full list client-side)
        const rsvps = await (prisma as any).rSVP.findMany({
            where: {
                eventId,
                // If not host, only show Accepted/Waitlisted
                ...(isHost ? {} : { status: { in: ["ACCEPTED", "WAITLISTED"] } })
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true
                    }
                }
            },
            orderBy: { createdAt: "desc" },
            take: 500,
        });

        // 4. Format and Sanitize guests list
        const guests = rsvps.map((rsvp: any) => {
            const userEmail = rsvp.user?.email;
            const guestEmail = rsvp.guestEmail;
            const email = isHost ? (userEmail || guestEmail) : undefined;

            return {
                id: rsvp.userId || rsvp.guestEmail || rsvp.id,
                rsvpId: rsvp.id,
                userId: rsvp.userId,
                name: rsvp.user?.name || rsvp.guestName || "Guest",
                email: email || (isHost ? "No Email" : undefined),
                image: rsvp.user?.image || undefined,
                status: rsvp.status,
                updatedAt: rsvp.updatedAt
            };
        });

        return NextResponse.json({ success: true, guests, isHost });
    } catch (error) {
        console.error("Guests Fetch error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
