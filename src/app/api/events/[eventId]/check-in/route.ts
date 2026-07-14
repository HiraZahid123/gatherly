import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkInSchema } from "@/lib/validation";

/**
 * POST: Scan a QR token and check in a guest
 */
export async function POST(
    request: NextRequest,
    props: { params: Promise<{ eventId: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();
        const { eventId } = params;

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Verify scanning permissions: fetch event + staff record in parallel (1 round trip)
        const [eventData, staffRecord] = await Promise.all([
            prisma.event.findUnique({
                where: { id: eventId },
                select: { id: true, hostId: true, startDate: true, checkInWindowStart: true, maxCheckIns: true }
            }),
            (prisma as any).eventStaff.findUnique({
                where: { eventId_userId: { eventId, userId: session.user.id } }
            })
        ]);

        if (!eventData) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        const isHost = eventData.hostId === session.user.id;
        if (!isHost && !staffRecord) {
            return NextResponse.json(
                { error: "Access denied. Only hosts or staff can check in guests." },
                { status: 403 }
            );
        }

        const body = await request.json();
        const validation = checkInSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: "Invalid data", details: validation.error.format() },
                { status: 400 }
            );
        }

        const { qrToken } = validation.data;

        // 2. Find the RSVP by token
        const rsvp = await (prisma as any).rSVP.findUnique({
            where: { qrToken, eventId },
            include: {
                checkIns: {
                    orderBy: { scannedAt: "asc" }
                }
            }
        });

        if (!rsvp) {
            return NextResponse.json(
                { error: "Invalid QR Token" },
                { status: 404 }
            );
        }

        if (rsvp.status !== "ACCEPTED") {
            return NextResponse.json(
                { error: `Guest status is ${rsvp.status}. Only ACCEPTED guests can check in.` },
                { status: 400 }
            );
        }

        const previousScans = rsvp.checkIns.length;
        const maxCheckIns = eventData.maxCheckIns || 2;

        // 🛡️ SECURITY: Check if check-in window is open
        const now = new Date();
        const eventStart = new Date(eventData.startDate);
        const windowStart = new Date(eventStart.getTime() - (eventData.checkInWindowStart || 60) * 60 * 1000);

        if (now < windowStart) {
            return NextResponse.json(
                {
                    error: "Check-in window is not open yet.",
                    opensAt: windowStart.toISOString()
                },
                { status: 403 }
            );
        }

        if (previousScans >= maxCheckIns) {
            return NextResponse.json(
                {
                    error: "Electronic ticket expired. Maximum entries reached.",
                    guestName: rsvp.guestName,
                    scanCount: previousScans
                },
                { status: 400 }
            );
        }

        // 3. Perform Check-in (Transaction)
        const result = await prisma.$transaction(async (tx) => {
            // Update RSVP if it's the first scan
            if (previousScans === 0) {
                await (tx as any).rSVP.update({
                    where: { id: rsvp.id },
                    data: { checkedIn: true }
                });
            }

            // Create CheckIn record
            return await (tx as any).checkIn.create({
                data: {
                    rsvpId: rsvp.id,
                    staffId: session.user.id,
                    scanCount: previousScans + 1
                }
            });
        });

        const isReEntry = previousScans > 0;

        return NextResponse.json({
            success: true,
            message: isReEntry ? "Re-entry successful" : "Check-in successful",
            guestName: rsvp.guestName,
            isReEntry,
            scanCount: previousScans + 1,
            checkIn: result
        });
    } catch (error) {
        console.error("Check-in error:", error);
        return NextResponse.json(
            { error: "Something went wrong during check-in" },
            { status: 500 }
        );
    }
}
