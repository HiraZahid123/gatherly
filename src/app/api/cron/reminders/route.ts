import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mail";
import { getReminderEmailHtml } from "@/lib/email-templates";

export async function GET(request: NextRequest) {
    // 1. Verify cron secret to prevent unauthorized access (bypass in development for easy testing)
    const isDevelopment = process.env.NODE_ENV !== "production";
    
    if (!isDevelopment) {
        const authHeader = request.headers.get("authorization");
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            // Fallback to checking url query parameter if bearer token fails
            const url = new URL(request.url);
            if (url.searchParams.get("secret") !== process.env.CRON_SECRET) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
        }
    }

    try {
        const now = new Date();
        
        // Find all pending reminders where the time has come (or passed) to send them.
        // E.g., event startDate is Jan 10 5PM. hoursBefore is 24.
        // reminderTime is Jan 9 5PM. If now >= Jan 9 5PM, send it.
        const pendingReminders = await (prisma as any).eventReminder.findMany({
            where: {
                isSent: false,
                event: {
                    status: "PUBLISHED"
                }
            },
            include: {
                event: {
                    include: {
                        rsvps: {
                            where: {
                                status: "ACCEPTED"
                            },
                            include: {
                                user: true
                            }
                        }
                    }
                }
            }
        });

        let sentCount = 0;
        let errorsCount = 0;

        for (const reminder of pendingReminders) {
            const event = reminder.event;
            const eventStart = new Date(event.startDate);
            const reminderTime = new Date(eventStart.getTime() - (reminder.hoursBefore * 60 * 60 * 1000));
            
            // If the current time is past the calculated reminder time
            if (now >= reminderTime) {
                const eventUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/e/${event.slug}`;
                
                const emailHtml = getReminderEmailHtml(
                    event.title,
                    eventUrl,
                    event.startDate,
                    event.location || "Location TBD",
                    reminder.message
                );

                // Send email to all accepted guests
                const emailPromises = event.rsvps.map(async (rsvp: any) => {
                    const email = rsvp.user?.email || rsvp.guestEmail;
                    if (!email) return;

                    await sendEmail({
                        to: email,
                        subject: `Reminder: ${event.title} is coming up!`,
                        html: emailHtml
                    });
                });

                await Promise.all(emailPromises);

                // Mark reminder as sent
                await (prisma as any).eventReminder.update({
                    where: { id: reminder.id },
                    data: {
                        isSent: true,
                        sentAt: new Date()
                    }
                });

                sentCount++;
            }
        }

        return NextResponse.json({ success: true, processed: pendingReminders.length, sent: sentCount, errors: errorsCount });
    } catch (error) {
        console.error("Cron Reminder Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
