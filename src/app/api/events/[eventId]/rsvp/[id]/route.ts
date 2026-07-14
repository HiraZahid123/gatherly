import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET: Lookup RSVP by ID or Email
 */
export async function GET(
    request: NextRequest,
    props: { params: Promise<{ eventId: string; id: string }> }
) {
    const params = await props.params;
    try {
        const { eventId, id } = params;
        const decodedId = decodeURIComponent(id);

        let rsvp;

        // 1. Try lookup by ID (UUID/CUID)
        rsvp = await (prisma as any).rSVP.findUnique({
            where: { id: decodedId }
        });

        // 2. If not found and looks like an email, try lookup by email
        if (!rsvp && decodedId.includes("@")) {
            rsvp = await (prisma as any).rSVP.findFirst({
                where: {
                    eventId,
                    guestEmail: decodedId
                }
            });
        }

        if (!rsvp) {
            return NextResponse.json({ error: "RSVP not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, rsvp });
    } catch (error) {
        console.error("RSVP Lookup error:", error);
        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}
