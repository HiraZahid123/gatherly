import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rsvpSubmitSchema } from "@/lib/validation";
import { generateQRToken, promoteNextFromWaitlist } from "@/lib/rsvp";
import { sendEmail, sendTicketConfirmationEmail } from "@/lib/mail";
import { generateGoogleCalendarUrl, generateOutlookUrl } from "@/lib/calendar";
import { createNotification } from "@/lib/notifications";

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ eventId: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();
        const { eventId } = params;
        const body = await request.json();

        // 1. Validate request body
        const validation = rsvpSubmitSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: "Invalid data", details: validation.error.format() },
                { status: 400 }
            );
        }

        const { status, guestName, guestEmail, inviteToken, captchaToken } = validation.data;

        // 1.5 Verify CAPTCHA (only for guests/public)
        if (!session) {
            const { verifyTurnstileToken } = await import("@/lib/turnstile");
            const verification = await verifyTurnstileToken(captchaToken || "");
            if (!verification.success) {
                return NextResponse.json(
                    { error: "Security check failed. Please try again.", details: verification.error },
                    { status: 400 }
                );
            }
        }

        // 2. Fetch event details
        const event = await (prisma as any).event.findUnique({
            where: { id: eventId },
            select: {
                id: true,
                isPrivate: true,
                capacity: true,
                hostId: true,
                status: true,
                title: true,
                slug: true,
                description: true,
                location: true,
                startDate: true,
                endDate: true,
                rsvpDeadline: true
            }
        }) as any;

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        // 🛡️ SECURITY: Check RSVP deadline (with 12hr timezone buffer)
        if (event.rsvpDeadline) {
            const deadlineWithBuffer = new Date(event.rsvpDeadline).getTime() + (12 * 60 * 60 * 1000);
            if (Date.now() > deadlineWithBuffer) {
                return NextResponse.json(
                    { error: "RSVP window has closed for this event." },
                    { status: 403 }
                );
            }
        }

        // 3. Verify Privacy / Invitations
        const isHost = session?.user?.id === event.hostId;
        if (event.isPrivate) { 
            // Check if user is STAFF - staff cannot RSVP
            if (session?.user?.id) {
                const isStaff = await (prisma as any).eventStaff.findUnique({
                    where: {
                        eventId_userId: {
                            eventId,
                            userId: session.user.id
                        }
                    }
                });

                if (isStaff) {
                    return NextResponse.json(
                        { error: "Staff members cannot RSVP to this event. You already have access!" },
                        { status: 403 }
                    );
                }
            }

            // Check if invited by token OR by email
            const invitation = await (prisma as any).invitation.findFirst({
                where: {
                    eventId,
                    OR: [
                        { token: inviteToken },
                        { email: guestEmail }
                    ]
                }
            });

            if (!invitation && !isHost) {
                return NextResponse.json(
                    { error: "This is a private event. An invitation is required." },
                    { status: 403 }
                );
            }
        }

        // 4. Check Capacity and Determine Status
        let finalStatus = status;
        let waitlistPosition = null;
        let qrToken = null;

        if (status === "ACCEPTED") {
            const acceptedCount = await (prisma as any).rSVP.count({
                where: { eventId, status: "ACCEPTED" }
            });

            if (event.capacity && acceptedCount >= event.capacity) {
                finalStatus = "WAITLISTED";
                const lastWaitlisted = await (prisma as any).rSVP.findFirst({
                    where: { eventId, status: "WAITLISTED" },
                    orderBy: { waitlistPosition: "desc" }
                });
                waitlistPosition = (Number(lastWaitlisted?.waitlistPosition) || 0) + 1;
            } else {
                qrToken = generateQRToken();
            }
        }

        // 5. Handle authenticated vs Guest RSVP entry
        // 🔑 Merge logic: If user is logged in, check if a guest record exists for this email
        let existingRSVP = null;
        if (session?.user?.id) {
            existingRSVP = await (prisma as any).rSVP.findFirst({
                where: {
                    eventId,
                    OR: [
                        { userId: session.user.id },
                        { guestEmail: guestEmail }
                    ]
                }
            });
        } else {
            existingRSVP = await (prisma as any).rSVP.findFirst({
                where: { eventId, guestEmail }
            });
        }

        const rsvpData = {
            status: finalStatus as any,
            guestName,
            guestEmail,
            waitlistPosition,
            qrToken: qrToken || existingRSVP?.qrToken || undefined,
            userId: session?.user?.id || undefined,
        };

        const rsvp = await (prisma as any).rSVP.upsert({
            where: { id: existingRSVP?.id || 'new-rsvp' },
            update: rsvpData,
            create: {
                ...rsvpData,
                eventId
            }
        });

        const notificationRecipients = [...new Set([
            event.hostId,
            ...(session?.user?.id ? [session.user.id] : []),
        ])];
        await Promise.all(notificationRecipients.map((userId) => createNotification({
            userId,
            title: "RSVP updated",
            message: `${guestName} ${finalStatus === "ACCEPTED" ? "is going to" : "updated their RSVP for"} ${event.title}.`,
            type: "RSVP",
            link: `/e/${event.slug}`,
        })));

        if ((global as any).io) {
            (global as any).io.to(`event-${eventId}`).emit('rsvp-update', { rsvpId: rsvp.id });
        }

        // 7. Send confirmation emails (async) with permanent JollyWitMe identity
        const emailRecipient = guestEmail || session?.user?.email;
        if ((finalStatus === "ACCEPTED" || finalStatus === "WAITLISTED") && emailRecipient) {
            const isAccepted = finalStatus === "ACCEPTED";
            sendTicketConfirmationEmail({
                to: emailRecipient,
                guestName: guestName || session?.user?.name || undefined,
                eventTitle: event.title,
                eventSlug: event.slug,
                qrToken: (rsvp.qrToken || qrToken || "") as string,
                startDate: event.startDate,
                location: event.location,
                isWaitlist: !isAccepted,
                waitlistPosition: waitlistPosition || undefined
            }).catch(error => console.error("RSVP Confirmation Email Error:", error));
        }

        // 8. Auto-Promote logic
        // If they were previously ACCEPTED and now are NOT (DECLINED/MAYBE/WAITLISTED), free up a spot
        if (existingRSVP?.status === "ACCEPTED" && status !== "ACCEPTED") {
            await promoteNextFromWaitlist(eventId);
        }

        return NextResponse.json({ success: true, rsvp });
    } catch (error) {
        console.error("RSVP error:", error);
        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ eventId: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();
        const { eventId } = params;

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        await prisma.rSVP.deleteMany({
            where: {
                eventId,
                userId: session.user.id
            }
        });

        if ((global as any).io) {
            (global as any).io.to(`event-${eventId}`).emit('rsvp-update', { status: 'DELETED' });
        }

        return NextResponse.json({ success: true, message: "RSVP removed" });
    } catch (error) {
        console.error("RSVP Delete error:", error);
        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ eventId: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();
        const { eventId } = params;

        if (!session?.user?.id) {
            return NextResponse.json({ rsvp: null });
        }

        const rsvp = await prisma.rSVP.findFirst({
            where: {
                eventId,
                userId: session.user.id
            }
        });

        return NextResponse.json({ success: true, rsvp });
    } catch (error) {
        console.error("RSVP Fetch error:", error);
        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}
