import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendEmail, sendTicketConfirmationEmail } from "@/lib/mail";
import { generateGoogleCalendarUrl, generateOutlookUrl } from "@/lib/calendar";

/**
 * Generates a secure random 32-character hex token for QR codes
 */
export function generateQRToken(): string {
    return crypto.randomBytes(16).toString("hex");
}

/**
 * Promotes the next guest from the waitlist for a specific event
 * should be called whenever an ACCEPTED RSVP is declined or cancelled.
 */
export async function promoteNextFromWaitlist(eventId: string) {
    // 1. Get the event to check capacity
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: {
            capacity: true,
            title: true,
            slug: true,
            description: true,
            location: true,
            startDate: true,
            endDate: true
        }
    });

    if (!event || !event.capacity) return;

    // 2. Count current accepted RSVPs
    const acceptedCount = await (prisma as any).rSVP.count({
        where: {
            eventId,
            status: "ACCEPTED"
        }
    });

    // 3. If we have space, grab the first person from the waitlist
    if (acceptedCount < (event.capacity || 0)) {
        const nextInLine = await (prisma as any).rSVP.findFirst({
            where: {
                eventId,
                status: "WAITLISTED"
            },
            orderBy: {
                waitlistPosition: "asc"
            }
        });

        if (nextInLine) {
            const qrToken = generateQRToken();

            // 4. Promote them
            await (prisma as any).rSVP.update({
                where: { id: (nextInLine as any).id },
                data: {
                    status: "ACCEPTED",
                    qrToken,
                    waitlistPosition: null // No longer on waitlist
                }
            });

            if (nextInLine.guestEmail) {
                sendTicketConfirmationEmail({
                    to: nextInLine.guestEmail,
                    guestName: nextInLine.guestName || undefined,
                    eventTitle: event.title,
                    eventSlug: event.slug,
                    qrToken,
                    startDate: event.startDate,
                    location: event.location,
                    isWaitlist: false,
                }).catch(err => console.error("Failed to send waitlist promotion email", err));
            }

            // 6. Recursively check if we can promote more (if capacity allows)
            await promoteNextFromWaitlist(eventId);
        }
    }
}
