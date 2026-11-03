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

        const { status, guestName, guestEmail, guestPhone, inviteToken, captchaToken } = validation.data;
        const contactEmail = guestEmail || session?.user?.email || "";
        const contactPhone = guestPhone || (session?.user as any)?.phone || "";

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
        let matchedInvitation: any = null;
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
            matchedInvitation = await (prisma as any).invitation.findFirst({
                where: {
                    eventId,
                    OR: [
                        ...(inviteToken ? [{ token: inviteToken }] : []),
                        ...(contactEmail ? [{ email: contactEmail }] : []),
                        ...(contactPhone ? [{ phone: contactPhone }] : [])
                    ]
                }
            });

            if (!matchedInvitation && !isHost) {
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
        let resolvedUserId = session?.user?.id;
        if (!resolvedUserId && (contactEmail || contactPhone)) {
            try {
                const userOrConditions = [
                    ...(contactEmail ? [{ email: contactEmail }] : []),
                    ...(contactPhone ? [{ phone: contactPhone }] : []),
                ];
                let matchedUser = await (prisma as any).user.findFirst({
                    where: { OR: userOrConditions }
                });

                if (!matchedUser) {
                    matchedUser = await (prisma as any).user.create({
                        data: {
                            name: guestName || "Guest",
                            email: contactEmail || null,
                            phone: contactPhone || null,
                            role: "GUEST",
                        }
                    });
                }
                resolvedUserId = matchedUser.id;
            } catch (userErr) {
                console.warn("Could not auto-create/link user for RSVP:", userErr);
            }
        }

        // 🔑 Merge logic: Check if a guest record exists for this user/email/phone
        const existingConditions = [
            ...(resolvedUserId ? [{ userId: resolvedUserId }] : []),
            ...(contactEmail ? [{ guestEmail: contactEmail }] : []),
            ...(contactPhone ? [{ guestPhone: contactPhone }] : []),
        ];
        const existingRSVP = await (prisma as any).rSVP.findFirst({
            where: { eventId, OR: existingConditions }
        });

        const rsvpData = {
            status: finalStatus as any,
            guestName,
            guestEmail: contactEmail || null,
            guestPhone: contactPhone || null,
            waitlistPosition,
            qrToken: qrToken || existingRSVP?.qrToken || undefined,
            userId: resolvedUserId || undefined,
        };

        const rsvp = await (prisma as any).rSVP.upsert({
            where: { id: existingRSVP?.id || 'new-rsvp' },
            update: rsvpData,
            create: {
                ...rsvpData,
                eventId
            }
        });

        // 6.5 If this RSVP was linked to an invitation, mark invitation as ACCEPTED
        if (matchedInvitation?.id) {
            await (prisma as any).invitation.update({
                where: { id: matchedInvitation.id },
                data: { status: "ACCEPTED" }
            }).catch((e: any) => console.warn("Failed to mark invitation as ACCEPTED:", e));
        }

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
        const emailRecipient = contactEmail;
        if ((finalStatus === "ACCEPTED" || finalStatus === "WAITLISTED") && emailRecipient) {
            const isAccepted = finalStatus === "ACCEPTED";
            
            (async () => {
                let setPasswordUrl: string | undefined;
                try {
                    const userRecord = resolvedUserId
                        ? await (prisma as any).user.findUnique({ where: { id: resolvedUserId }, select: { password: true } })
                        : null;
                    if (!userRecord?.password) {
                        const { createPasswordResetToken } = await import("@/lib/tokens");
                        const resetToken = await createPasswordResetToken(emailRecipient);
                        const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "https://jollywitme.com";
                        setPasswordUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;
                    }
                } catch (tokenErr) {
                    console.warn("Could not generate password link for RSVP email:", tokenErr);
                }

                await sendTicketConfirmationEmail({
                    to: emailRecipient,
                    guestName: guestName || session?.user?.name || undefined,
                    eventTitle: event.title,
                    eventSlug: event.slug,
                    qrToken: (rsvp.qrToken || qrToken || "") as string,
                    startDate: event.startDate,
                    location: event.location,
                    isWaitlist: !isAccepted,
                    waitlistPosition: waitlistPosition || undefined,
                    setPasswordUrl
                });

                if (setPasswordUrl) {
                    const { sendEmail } = await import("@/lib/mail");
                    await sendEmail({
                        to: emailRecipient,
                        subject: `Set your password for JollyWitMe 🔑`,
                        html: `
                            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; color: #111827;">
                                <div style="text-align: center; margin-bottom: 24px;">
                                    <h1 style="color: #059669; font-size: 26px; font-weight: 800; margin: 0 0 8px 0;">JollyWitMe</h1>
                                    <p style="color: #6b7280; font-size: 14px; margin: 0;">Welcome to JollyWitMe!</p>
                                </div>
                                <div style="padding: 24px 0; border-top: 1px solid #f3f4f6; border-bottom: 1px solid #f3f4f6;">
                                    <p style="color: #111827; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                                        Hi <strong>${guestName || "there"}</strong>,
                                    </p>
                                    <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                                        We automatically created your JollyWitMe profile so you can manage your RSVPs, view your tickets, and chat with other guests. Please click below to create your password:
                                    </p>
                                    <div style="text-align: center; margin: 28px 0;">
                                        <a href="${setPasswordUrl}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);">
                                            Set Your Password →
                                        </a>
                                    </div>
                                    <p style="color: #9ca3af; font-size: 13px; line-height: 1.5; margin: 20px 0 0 0; text-align: center;">
                                        This link is secure and will expire in 1 hour.
                                    </p>
                                </div>
                                <p style="color: #111827; font-size: 13px; margin-top: 24px; text-align: center; font-weight: 600;">
                                    From the JollyWitMe Team ✨
                                </p>
                            </div>
                        `
                    }).catch(err => console.error("Welcome password email error:", err));
                }
            })().catch(error => console.error("RSVP Confirmation Email Error:", error));
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
