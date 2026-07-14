import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

export async function POST(
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

        // Fetch original event
        const originalEvent = await prisma.event.findUnique({
            where: { id: eventId },
        });

        if (!originalEvent) {
            return NextResponse.json(
                { error: "Event not found." },
                { status: 404 }
            );
        }

        if (originalEvent.hostId !== session.user.id) {
            return NextResponse.json(
                { error: "You don't have permission to clone this event." },
                { status: 403 }
            );
        }

        // Generate unique slug
        const newSlug = `${originalEvent.slug}-${nanoid(6)}`;

        // Create new event
        // exclude: id, createdAt, updatedAt, slug (generated new), rsvps, comments, photos
        const { id, createdAt, updatedAt, slug, ...eventData } = originalEvent;

        const newEvent = await prisma.event.create({
            data: {
                ...eventData,
                slug: newSlug,
                title: `${originalEvent.title} (Copy)`,
                hostId: session.user.id, // Ensure host is current user
                theme: eventData.theme ?? undefined, // Handle null theme
            },
        });

        return NextResponse.json({
            success: true,
            event: newEvent,
        });

    } catch (error) {
        console.error("Event cloning error:", error);
        return NextResponse.json(
            { error: "An error occurred while cloning the event." },
            { status: 500 }
        );
    }
}
