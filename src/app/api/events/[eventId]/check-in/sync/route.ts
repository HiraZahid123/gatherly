import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST: Sync a batch of offline check-ins
 * Body: { scans: Array<{ qrToken: string, scannedAt: string }> }
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

        // 1. Verify scanning permissions (Host or Staff)
        const event = await prisma.event.findFirst({
            where: { id: eventId, hostId: session.user.id }
        });

        let isStaff = null;
        if (!event) {
            isStaff = await (prisma as any).eventStaff.findUnique({
                where: {
                    eventId_userId: {
                        eventId,
                        userId: session.user.id
                    }
                }
            });
        }

        if (!event && !isStaff) {
            return NextResponse.json(
                { error: "Access denied." },
                { status: 403 }
            );
        }

        const { scans } = await request.json();
        if (!Array.isArray(scans)) {
            return NextResponse.json({ error: "Invalid scans data" }, { status: 400 });
        }

        const results = [];

        // 2. Process each scan in the batch
        for (const scan of scans) {
            const { qrToken, scannedAt } = scan;

            // Find RSVP
            const rsvp = await (prisma as any).rSVP.findUnique({
                where: { qrToken, eventId },
                include: { checkIns: true }
            });

            if (!rsvp || rsvp.status !== "ACCEPTED") {
                results.push({ qrToken, success: false, error: "Invalid or inactive guest" });
                continue;
            }

            // Check if this specific scan (by timestamp) already exists to prevent double sync
            const exists = rsvp.checkIns.some((ci: any) =>
                new Date(ci.scannedAt).getTime() === new Date(scannedAt).getTime()
            );

            if (exists) {
                results.push({ qrToken, success: true, message: "Already synced" });
                continue;
            }

            // If we have room for more scans, record it
            if (rsvp.checkIns.length < 2) {
                await prisma.$transaction(async (tx) => {
                    if (rsvp.checkIns.length === 0) {
                        await (tx as any).rSVP.update({
                            where: { id: rsvp.id },
                            data: { checkedIn: true }
                        });
                    }

                    await (tx as any).checkIn.create({
                        data: {
                            rsvpId: rsvp.id,
                            staffId: session.user.id,
                            scannedAt: new Date(scannedAt),
                            scanCount: rsvp.checkIns.length + 1
                        }
                    });
                });
                results.push({ qrToken, success: true });
            } else {
                results.push({ qrToken, success: false, error: "Max entries reached" });
            }
        }

        return NextResponse.json({
            success: true,
            processed: results.length,
            results
        });
    } catch (error) {
        console.error("Sync error:", error);
        return NextResponse.json(
            { error: "Failed to sync check-ins" },
            { status: 500 }
        );
    }
}
