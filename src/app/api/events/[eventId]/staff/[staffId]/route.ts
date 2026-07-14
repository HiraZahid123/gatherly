import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * DELETE: Remove a staff member from an event
 */
export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ eventId: string; staffId: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();
        const { eventId, staffId } = params;

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only host can remove staff
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { hostId: true }
        });

        if (!event || event.hostId !== session.user.id) {
            return NextResponse.json({ error: "Only the host can remove staff" }, { status: 403 });
        }

        await (prisma as any).eventStaff.delete({
            where: {
                id: staffId,
                eventId // Extra safety
            }
        });

        return NextResponse.json({ success: true, message: "Staff member removed" });
    } catch (error) {
        console.error("Staff Delete error:", error);
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}
