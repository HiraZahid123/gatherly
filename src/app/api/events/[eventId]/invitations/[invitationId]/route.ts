import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string; invitationId: string }> }
) {
    try {
        const { eventId, invitationId } = await params;
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check ownership
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { hostId: true }
        });

        if (!event || event.hostId !== session.user.id) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        await prisma.invitation.delete({
            where: { id: invitationId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting invitation:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
