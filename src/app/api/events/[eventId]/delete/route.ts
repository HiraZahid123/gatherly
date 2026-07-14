import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ eventId: string }> }
) {
    const params = await props.params;
    try {
        // Check authentication
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized. Please sign in." },
                { status: 401 }
            );
        }

        const { eventId } = params;

        // Check if event exists and user is the owner
        const existingEvent = await prisma.event.findUnique({
            where: { id: eventId },
            select: {
                hostId: true,
                _count: {
                    select: {
                        rsvps: true,
                    },
                },
            },
        });

        if (!existingEvent) {
            return NextResponse.json(
                { error: "Event not found." },
                { status: 404 }
            );
        }

        if (existingEvent.hostId !== session.user.id) {
            return NextResponse.json(
                { error: "You don't have permission to delete this event." },
                { status: 403 }
            );
        }

        // Delete event (cascade will delete RSVPs)
        await prisma.event.delete({
            where: { id: eventId },
        });

        return NextResponse.json({
            success: true,
            message: "Event deleted successfully.",
            rsvpCount: existingEvent._count.rsvps,
        });
    } catch (error) {
        console.error("Event deletion error:", error);
        return NextResponse.json(
            { error: "An error occurred. Please try again." },
            { status: 500 }
        );
    }
}
