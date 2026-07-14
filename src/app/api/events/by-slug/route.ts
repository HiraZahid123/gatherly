import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        // Get slug from query parameter
        const { searchParams } = new URL(request.url);
        const slug = searchParams.get("slug");

        if (!slug) {
            return NextResponse.json(
                { error: "Slug parameter is required." },
                { status: 400 }
            );
        }

        // Fetch event by slug
        const event = await prisma.event.findUnique({
            where: { slug },
            include: {
                host: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                },
                _count: {
                    select: {
                        rsvps: {
                            where: { status: "ACCEPTED" }
                        },
                    },
                },
            },
        });

        if (!event) {
            return NextResponse.json(
                { error: "Event not found." },
                { status: 404 }
            );
        }

        // Check Permissions for Private Events
        if (event.visibility === "PRIVATE") {
            const { auth } = await import("@/lib/auth");
            const session = await auth();
            const inviteToken = searchParams.get("inviteToken");

            const isHost = session?.user?.id === event.hostId;
            let isInvited = false;

            if (!isHost) {
                const invitation = await (prisma as any).invitation.findFirst({
                    where: {
                        eventId: event.id,
                        OR: [
                            { token: inviteToken || undefined },
                            { email: session?.user?.email || undefined }
                        ]
                    }
                });
                isInvited = !!invitation;
            }

            if (!isHost && !isInvited) {
                return NextResponse.json(
                    { error: "This event is private. An invitation is required." },
                    { status: 403 }
                );
            }
        }

        return NextResponse.json({
            success: true,
            event: {
                ...event,
                rsvpCount: event._count.rsvps,
            },
        });
    } catch (error) {
        console.error("Fetch event error:", error);
        return NextResponse.json(
            { error: "An error occurred. Please try again." },
            { status: 500 }
        );
    }
}
