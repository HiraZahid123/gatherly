import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { eventCreateSchema } from "@/lib/validation";
import { generateUniqueSlug } from "@/lib/slugify";

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
                status: status || "PUBLISHED", // Default to PUBLISHED for immediate visibility
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

        // If isPaid is true and cost is provided, create a default ticket tier
        if (isPaid && cost) {
            // Extract numbers from cost string (e.g., "$10.50" -> 10.5)
            const priceMatch = cost.match(/(\d+(?:\.\d+)?)/);
            if (priceMatch) {
                const priceInDollars = parseFloat(priceMatch[1]);
                const priceInCents = Math.round(priceInDollars * 100);

                if (priceInCents > 0) {
                    await prisma.ticketTier.create({
                        data: {
                            eventId: event.id,
                            name: "General Admission",
                            price: priceInCents,
                            quantity: capacity || 100, // Default to capacity or 100
                            currency: "usd",
                        },
                    });
                }
            }
        }

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
