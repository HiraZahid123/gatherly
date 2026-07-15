import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        // Check authentication
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized. Please sign in." },
                { status: 401 }
            );
        }

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const filter = searchParams.get("filter"); // 'upcoming', 'past', or null for all

        // Build where clause to include hosted events OR accepted RSVPs
        const where: any = {
            status: { in: ["PUBLISHED", "ACTIVE", "CLOSED"] },
            OR: [
                { hostId: session.user.id },
                {
                    rsvps: {
                        some: {
                            userId: session.user.id,
                            status: "ACCEPTED",
                        },
                    },
                },
            ],
        };

        // Add date filter
        const now = new Date();
        if (filter === "upcoming") {
            where.startDate = { gte: now };
        } else if (filter === "past") {
            where.startDate = { lt: now };
        }

        // Fetch events — select only columns the dashboard actually renders
        const events = await prisma.event.findMany({
            where,
            select: {
                id: true,
                title: true,
                slug: true,
                description: true,
                startDate: true,
                endDate: true,
                location: true,
                locationType: true,
                coverImage: true,
                status: true,
                type: true,
                theme: true,
                hostId: true,
                isPaid: true,
                capacity: true,
                visibility: true,
                rsvpDeadline: true,
                checkInWindowStart: true,
                maxCheckIns: true,
                isPrivate: true,
                guestListHidden: true,
                createdAt: true,
                host: {
                    select: { id: true, name: true, image: true },
                },
                rsvps: {
                    where: { userId: session.user.id },
                    select: { id: true, status: true },
                },
                reminders: {
                    select: { hoursBefore: true, message: true, isSent: true }
                },
                _count: {
                    select: { rsvps: true },
                },
            },
            orderBy: {
                startDate: filter === "past" ? "desc" : "asc",
            },
        });

        // Format response
        const formattedEvents = events.map((event) => {
            const isHosting = event.hostId === session.user.id;
            const rsvp = event.rsvps?.[0];

            // Inject reminders into theme.settings for the edit UI
            const theme = event.theme ? JSON.parse(JSON.stringify(event.theme)) : { settings: {} };
            if (!theme.settings) theme.settings = {};
            theme.settings.reminders = event.reminders;

            return {
                ...event,
                theme,
                rsvpCount: event._count.rsvps,
                isHosting,
                userRsvpStatus: rsvp?.status || null,
            };
        });

        return NextResponse.json({
            success: true,
            events: formattedEvents,
        });
    } catch (error) {
        console.error("Fetch events error:", error);
        return NextResponse.json(
            { error: "An error occurred. Please try again." },
            { status: 500 }
        );
    }
}
