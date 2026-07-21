import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { eventUpdateSchema } from "@/lib/validation";
import { generateUniqueSlug } from "@/lib/slugify";
import { revalidatePath, revalidateTag } from "next/cache";

export async function PATCH(
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
            select: { hostId: true, title: true },
        });

        if (!existingEvent) {
            return NextResponse.json(
                { error: "Event not found." },
                { status: 404 }
            );
        }

        if (existingEvent.hostId !== session.user.id) {
            return NextResponse.json(
                { error: "You don't have permission to edit this event." },
                { status: 403 }
            );
        }

        const body = await request.json();

        // Validate input
        const validation = eventUpdateSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const {
            title, description, location, startDate, endDate, capacity,
            visibility, isPrivate, guestListHidden, status, theme,
            coverImage, rsvpDeadline, checkInWindowStart, maxCheckIns, cost
        } = validation.data;

        const updateData: any = {};

        if (title !== undefined) {
            updateData.title = title;
            // Regenerate slug if title changed
            if (title !== existingEvent.title) {
                updateData.slug = await generateUniqueSlug(title, eventId);
            }
        }
        if (description !== undefined) updateData.description = description || null;
        if (location !== undefined) updateData.location = location || null;
        if (startDate !== undefined) updateData.startDate = new Date(startDate);
        if (endDate !== undefined) updateData.endDate = endDate && endDate !== "" ? new Date(endDate) : null;
        if (capacity !== undefined) updateData.capacity = capacity;
        if (rsvpDeadline !== undefined) updateData.rsvpDeadline = rsvpDeadline ? new Date(rsvpDeadline) : null;
        if (checkInWindowStart !== undefined) updateData.checkInWindowStart = checkInWindowStart;
        if (maxCheckIns !== undefined) updateData.maxCheckIns = maxCheckIns;
        if (visibility !== undefined) updateData.visibility = visibility;
        if (isPrivate !== undefined) updateData.isPrivate = isPrivate;
        if (guestListHidden !== undefined) updateData.guestListHidden = guestListHidden;
        if (status !== undefined) updateData.status = status;
        if (coverImage !== undefined) updateData.coverImage = coverImage || null;

        if (theme !== undefined || cost !== undefined) {
            const processedTheme = theme ? JSON.parse(JSON.stringify(theme)) : {};
            if (cost !== undefined) {
                processedTheme.settings = processedTheme.settings || {};
                processedTheme.settings.cost = cost;
            }
            updateData.theme = Object.keys(processedTheme).length > 0 ? processedTheme : null;
        }

        // Update event
        const updatedEvent = await prisma.event.update({
            where: { id: eventId },
            data: updateData,
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

        // Sync reminders if they were provided in the theme settings
        if (theme?.settings?.reminders !== undefined) {
            const reminders = theme.settings.reminders;
            // Delete all unsent reminders to replace them with the current configuration
            await (prisma as any).eventReminder.deleteMany({
                where: { eventId, isSent: false }
            });
            
            if (Array.isArray(reminders) && reminders.length > 0) {
                await (prisma as any).eventReminder.createMany({
                    data: reminders.map((r: any) => ({
                        eventId,
                        hoursBefore: r.hoursBefore,
                        message: r.message || null,
                        isSent: false
                    }))
                });
            }
        }

        // Bust the Next.js cache so the event page shows updated data immediately
        revalidatePath(`/e/${updatedEvent.slug}`);
        try { revalidateTag(`event-by-slug-${updatedEvent.slug}`); } catch {/* non-critical */}

        return NextResponse.json({
            success: true,
            message: "Event updated successfully.",
            event: {
                ...updatedEvent,
                rsvpCount: updatedEvent._count.rsvps,
            },
        });
    } catch (error) {
        console.error("Event update error:", error);
        return NextResponse.json(
            { error: "An error occurred. Please try again." },
            { status: 500 }
        );
    }
}
