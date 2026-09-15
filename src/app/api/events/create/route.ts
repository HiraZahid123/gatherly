import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { eventCreateSchema } from "@/lib/validation";
import { generateUniqueSlug } from "@/lib/slugify";
import { createNotification } from "@/lib/notifications";

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized. Please sign in." },
                { status: 401 }
            );
        }

        // Check if user is a HOST
        const userRole = (session.user as any).role;
        if (userRole !== "HOST" && userRole !== "ADMIN") {
            return NextResponse.json(
                { error: "Only hosts can create events." },
                { status: 403 }
            );
        }

        // Verify user actually exists in database (handles edge case where user was deleted but session remains)
        const dbUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true },
        });

        if (!dbUser) {
            return NextResponse.json(
                { error: "Your account could not be found. Please sign out and sign in again." },
                { status: 401 }
            );
        }

        const body = await request.json();

        // Normalize date inputs to ISO strings before validation
        if (body.startDate) {
            const d = new Date(body.startDate);
            if (!isNaN(d.getTime())) body.startDate = d.toISOString();
        }
        if (body.endDate) {
            const d = new Date(body.endDate);
            if (!isNaN(d.getTime())) body.endDate = d.toISOString();
            else delete body.endDate;
        } else if (body.endDate === "") {
            delete body.endDate;
        }
        if (body.rsvpDeadline) {
            const d = new Date(body.rsvpDeadline);
            if (!isNaN(d.getTime())) body.rsvpDeadline = d.toISOString();
            else body.rsvpDeadline = null;
        } else if (body.rsvpDeadline === "") {
            body.rsvpDeadline = null;
        }

        // If saving as draft, provide sensible defaults for partial data
        if (body.status === "DRAFT") {
            if (!body.title || typeof body.title !== "string" || body.title.trim().length < 3) {
                body.title = body.title && body.title.trim().length > 0 ? body.title.trim() + " (Draft)" : "Untitled Draft";
            }
            if (!body.startDate) {
                body.startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
            }
            if (body.capacity !== undefined && (body.capacity === null || body.capacity <= 0 || isNaN(Number(body.capacity)))) {
                delete body.capacity;
            }
        } else {
            // Strict validations when publishing an event
            if (!body.title || typeof body.title !== "string" || body.title.trim().length < 3) {
                return NextResponse.json({ error: "Title must be at least 3 characters to publish." }, { status: 400 });
            }
            if (!body.location || typeof body.location !== "string" || body.location.trim().length < 3) {
                return NextResponse.json({ error: "Location is required to publish an event." }, { status: 400 });
            }
            if (!body.startDate || isNaN(new Date(body.startDate).getTime())) {
                return NextResponse.json({ error: "A valid start date and time are required to publish." }, { status: 400 });
            }
            if (new Date(body.startDate) <= new Date()) {
                return NextResponse.json({ error: "Event start date and time must be in the future to publish." }, { status: 400 });
            }
            if (body.endDate && new Date(body.endDate) <= new Date(body.startDate)) {
                return NextResponse.json({ error: "End date must be after the start date." }, { status: 400 });
            }
            if (body.rsvpDeadline && new Date(body.rsvpDeadline) >= new Date(body.startDate)) {
                return NextResponse.json({ error: "RSVP deadline must be before the event starts." }, { status: 400 });
            }
        }

        // Validate input
        const validation = eventCreateSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { 
            title, description, location, startDate, endDate, capacity, 
            visibility, isPrivate, guestListHidden, status, theme, 
            coverImage, type, rsvpDeadline, checkInWindowStart, maxCheckIns, cost, isPaid
        } = validation.data;

        // Generate unique slug from title
        const slug = await generateUniqueSlug(title);

        const processedTheme = theme ? JSON.parse(JSON.stringify(theme)) : {};
        if (cost) {
            processedTheme.settings = processedTheme.settings || {};
            processedTheme.settings.cost = cost;
        }

        // Create event
        const event = await prisma.event.create({
            data: {
                title,
                description: description || null,
                slug,
                type: type || "EVENT",
                location: location || null,
                coverImage: coverImage || null,
                startDate: new Date(startDate),
                endDate: endDate && endDate !== "" ? new Date(endDate) : null,
                capacity: capacity || null,
                rsvpDeadline: rsvpDeadline ? new Date(rsvpDeadline) : null,
                checkInWindowStart: checkInWindowStart ?? 60,
                maxCheckIns: maxCheckIns ?? 2,
                visibility: visibility || "PUBLIC",
                isPrivate: isPrivate || false,
                isPaid: isPaid || false,
                guestListHidden: guestListHidden || false,
                status: body.status === "DRAFT" || status === "DRAFT" ? "DRAFT" : "PUBLISHED",
                theme: Object.keys(processedTheme).length > 0 ? processedTheme : undefined,
                hostId: session.user.id,
            },
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
                        rsvps: true,
                    },
                },
            },
        });

        await createNotification({
            userId: session.user.id,
            title: "Event created",
            message: `${event.title} is ready to share with your guests.`,
            type: "EVENT",
            link: `/e/${event.slug}`,
        });

        // Ticket tiers are created separately via the Event Settings modal after publishing.
        // No auto-tier creation here — the host is prompted to add tiers on the event page.

        // Create reminders if they were provided in the theme settings
        if (processedTheme?.settings?.reminders !== undefined) {
            const reminders = processedTheme.settings.reminders;
            if (Array.isArray(reminders) && reminders.length > 0) {
                await (prisma as any).eventReminder.createMany({
                    data: reminders.map((r: any) => ({
                        eventId: event.id,
                        hoursBefore: r.hoursBefore,
                        message: r.message || null,
                        isSent: false
                    }))
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: "Event created successfully.",
            event: {
                ...event,
                _count: undefined, // Remove _count from response
                rsvpCount: event._count.rsvps,
            },
        });
    } catch (error) {
        console.error("Event creation error details:", error);
        let errorMessage = "Something went wrong. Please try again.";
        
        if (error instanceof Error) {
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
            
            // Expose the actual error details to the frontend temporarily to debug the 500 error
            errorMessage = error.message; 
        }
        
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
