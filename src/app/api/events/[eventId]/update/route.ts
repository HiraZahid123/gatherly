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
            select: { hostId: true, title: true, status: true, startDate: true, endDate: true, location: true },
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

        // Past events cannot be edited (drafts can always be edited)
        if (existingEvent.status !== "DRAFT") {
            const eventEndTime = existingEvent.endDate 
                ? new Date(existingEvent.endDate) 
                : (existingEvent.startDate ? new Date(new Date(existingEvent.startDate).getTime() + 4 * 60 * 60 * 1000) : null);
            if (eventEndTime && eventEndTime < new Date()) {
                return NextResponse.json(
                    { error: "Past events cannot be edited because this event has already taken place." },
                    { status: 400 }
                );
            }
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

        // Validate input
        const validation = eventUpdateSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        // Enforce publishing requirements when publishing a draft or updating a published event
        const willBePublished = body.status === "PUBLISHED" || (existingEvent.status === "PUBLISHED" && body.status !== "DRAFT");
        if (willBePublished) {
            const checkTitle = body.title !== undefined ? body.title : existingEvent.title;
            const checkLocation = body.location !== undefined ? body.location : existingEvent.location;
            const checkStartDate = body.startDate !== undefined ? body.startDate : existingEvent.startDate?.toISOString();

            if (!checkTitle || typeof checkTitle !== "string" || checkTitle.trim().length < 3) {
                return NextResponse.json({ error: "Title must be at least 3 characters to publish." }, { status: 400 });
            }
            if (!checkLocation || typeof checkLocation !== "string" || checkLocation.trim().length < 3) {
                return NextResponse.json({ error: "Location is required to publish an event." }, { status: 400 });
            }
            if (!checkStartDate || isNaN(new Date(checkStartDate).getTime())) {
                return NextResponse.json({ error: "A valid start date is required to publish." }, { status: 400 });
            }
            if (new Date(checkStartDate) <= new Date()) {
                return NextResponse.json({ error: "Event start date and time must be in the future to publish." }, { status: 400 });
            }
            if (body.endDate && new Date(body.endDate) <= new Date(checkStartDate)) {
                return NextResponse.json({ error: "End date must be after the start date." }, { status: 400 });
            }
            if (body.rsvpDeadline && new Date(body.rsvpDeadline) >= new Date(checkStartDate)) {
                return NextResponse.json({ error: "RSVP deadline must be before the event starts." }, { status: 400 });
            }
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
            if (title !== existingEvent.title && existingEvent.status === "DRAFT") {
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

        // Notify confirmed guests if critical event details changed
        const criticalFieldsChanged =
            (title !== undefined && title !== existingEvent.title) ||
            (startDate !== undefined && existingEvent.startDate?.toISOString() !== new Date(startDate).toISOString()) ||
            (endDate !== undefined) ||
            (location !== undefined && location !== existingEvent.location);

        if (criticalFieldsChanged) {
            const acceptedRsvps = await (prisma as any).rSVP.findMany({
                where: { eventId, status: "ACCEPTED" },
                select: {
                    guestEmail: true,
                    guestName: true,
                    guestPhone: true,
                    qrToken: true,
                    user: { select: { email: true, name: true } }
                }
            });

            const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "https://jollywitme.com";
            const eventUrl = `${baseUrl}/e/${updatedEvent.slug}`;

            const changedFields: string[] = [];
            if (title !== undefined && title !== existingEvent.title) changedFields.push("event name");
            if (startDate !== undefined) changedFields.push("date/time");
            if (location !== undefined && location !== existingEvent.location) changedFields.push("location");

            const changedSummary = changedFields.join(", ");

            const { sendEmail } = await import("@/lib/mail");
            for (const rsvp of acceptedRsvps) {
                const email = rsvp.guestEmail || rsvp.user?.email;
                const name = rsvp.guestName || rsvp.user?.name || "Guest";
                if (!email) continue;

                const ticketUrl = rsvp.qrToken ? `${eventUrl}?ticket=${rsvp.qrToken}` : eventUrl;
                sendEmail({
                    to: email,
                    subject: `⚠️ Update: ${updatedEvent.title} details have changed`,
                    html: `
                        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0b;color:#ffffff;padding:32px;border-radius:16px">
                            <h2 style="margin:0 0 8px;font-size:22px">Event Update Notice</h2>
                            <p style="color:rgba(255,255,255,0.6);margin:0 0 24px">Hi ${name}, the host has updated the <strong>${updatedEvent.title}</strong> event. The following detail(s) changed: <strong>${changedSummary}</strong>.</p>
                            <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:20px;margin-bottom:24px">
                                ${updatedEvent.startDate ? `<p style="margin:0 0 8px;font-size:14px;color:rgba(255,255,255,0.7)">📅 <strong>New Date:</strong> ${new Date(updatedEvent.startDate).toLocaleString()}</p>` : ""}
                                ${updatedEvent.location ? `<p style="margin:0 0 8px;font-size:14px;color:rgba(255,255,255,0.7)">📍 <strong>Location:</strong> ${updatedEvent.location}</p>` : ""}
                            </div>
                            <p style="color:rgba(255,255,255,0.5);font-size:14px;margin-bottom:24px">Your ticket is still valid. Click below to view the updated event details and access your entry pass.</p>
                            <a href="${ticketUrl}" style="display:inline-block;background:#ffffff;color:#000000;font-weight:700;padding:12px 28px;border-radius:999px;text-decoration:none;font-size:14px">View Updated Event →</a>
                            <p style="color:rgba(255,255,255,0.7);font-size:13px;font-weight:600;margin-top:28px">From the JollyWitMe Team ✨</p>
                        </div>
                    `
                }).catch(err => console.error(`Event update email error for ${email}:`, err));
            }
        }

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
