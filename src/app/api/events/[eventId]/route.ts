import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { eventCreateSchema } from "@/lib/validation";

export async function PATCH(
    request: NextRequest,
    props: { params: Promise<{ eventId: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();
        const { eventId } = params;

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        // Find existing event
        const event = await prisma.event.findUnique({
            where: { id: eventId }
        });

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        // Only host can update
        if (event.hostId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Update event (for now just settings/theme)
        const updatedEvent = await prisma.event.update({
            where: { id: eventId },
            data: {
                theme: body.theme || event.theme,
                rsvpDeadline: body.rsvpDeadline !== undefined ? (body.rsvpDeadline ? new Date(body.rsvpDeadline) : null) : event.rsvpDeadline,
                checkInWindowStart: body.checkInWindowStart !== undefined ? body.checkInWindowStart : event.checkInWindowStart,
                maxCheckIns: body.maxCheckIns !== undefined ? body.maxCheckIns : event.maxCheckIns,
                // Add more fields as needed
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
                        rsvps: {
                            where: { status: "ACCEPTED" }
                        },
                    },
                },
            }
        });

        // Sync reminders if they were updated via theme settings (from the Live Event Page)
        if (body.theme?.settings?.reminders !== undefined) {
            const reminders = body.theme.settings.reminders;
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

        return NextResponse.json({
            success: true,
            event: {
                ...updatedEvent,
                rsvpCount: updatedEvent._count.rsvps
            }
        });
    } catch (error) {
        console.error("Event update error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
