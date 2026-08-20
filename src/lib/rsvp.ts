import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendEmail } from "@/lib/mail";
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
                const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "https://jollywitme.com";
                const qrUrl = `${baseUrl}/e/${event.slug}?ticket=${qrToken}`;

                sendEmail({
                    to: nextInLine.guestEmail,
                    subject: `You're in! 🎊 ${event.title}`,
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
                            <h1 style="color: #000; margin-bottom: 24px;">Good news!</h1>
                            <p style="font-size: 16px; line-height: 1.6; color: #444;">
                                You've been promoted from the waitlist for <strong>${event.title}</strong>. 
                                Your spot is now confirmed and your entry ticket is ready.
                            </p>
                            
                            <div style="margin: 32px 0; padding: 24px; background: #f9f9f9; border-radius: 8px; text-align: center;">
                                <p style="margin-bottom: 16px; font-weight: bold; color: #000;">YOUR ENTRY QR CODE</p>
                                <a href="${qrUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-bottom: 20px;">View Ticket</a>

                                <p style="margin: 20px 0 10px; font-size: 12px; color: #666; font-weight: bold; text-transform: uppercase;">Add to Calendar</p>
                                <div style="display: flex; justify-content: center; gap: 10px;">
                                    <a href="${generateGoogleCalendarUrl({ title: event.title, description: (event as any).description || '', location: (event as any).location || '', startDate: (event as any).startDate, endDate: (event as any).endDate || undefined })}" style="font-size: 13px; color: #4285F4; text-decoration: none; font-weight: bold; margin: 0 10px;">Google</a>
                                    <a href="${generateOutlookUrl({ title: event.title, description: (event as any).description || '', location: (event as any).location || '', startDate: (event as any).startDate, endDate: (event as any).endDate || undefined })}" style="font-size: 13px; color: #0078D4; text-decoration: none; font-weight: bold; margin: 0 10px;">Outlook</a>
                                </div>
                            </div>

                            <p style="font-size: 14px; color: #888; margin-top: 32px;">
                                See you there!<br>
                                The ${event.title} Team
                            </p>
                        </div>
                    `
                }).catch(err => console.error("Failed to send waitlist promotion email", err));
            }

            // 6. Recursively check if we can promote more (if capacity allows)
            await promoteNextFromWaitlist(eventId);
        }
    }
}
