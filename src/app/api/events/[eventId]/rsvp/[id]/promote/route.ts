import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateQRToken } from "@/lib/rsvp";
import { sendEmail } from "@/lib/mail";

/**
 * POST: Manually promote a guest from waitlist (Host only)
 */
export async function POST(
    request: NextRequest,
    props: { params: Promise<{ eventId: string; id: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();
        const { eventId, id: rsvpId } = params;

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Verify Host permission
        const event = await prisma.event.findFirst({
            where: { id: eventId, hostId: session.user.id },
            select: { title: true, slug: true }
        });

        if (!event) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // 2. Fetch the RSVP
        const rsvp = await (prisma as any).rSVP.findUnique({
            where: { id: rsvpId, eventId }
        });

        if (!rsvp) {
            return NextResponse.json({ error: "RSVP not found" }, { status: 404 });
        }

        if (rsvp.status !== "WAITLISTED") {
            return NextResponse.json({ error: "Guest is not on the waitlist" }, { status: 400 });
        }

        // 3. Promote (Bypass capacity because it's a manual override)
        const qrToken = generateQRToken();
        const updatedRSVP = await (prisma as any).rSVP.update({
            where: { id: rsvpId },
            data: {
                status: "ACCEPTED",
                qrToken,
                waitlistPosition: null
            }
        });

        // 4. Notify guest
        if (rsvp.guestEmail) {
            const qrUrl = `${process.env.NEXTAUTH_URL}/e/${event.slug}?ticket=${qrToken}`;
            sendEmail({
                to: rsvp.guestEmail,
                subject: `You're in! 🎊 ${event.title} (Host Invite)`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #ffffff; background: #000000; padding: 40px; border-radius: 16px;">
                        <h1 style="font-size: 28px; font-weight: 900; text-transform: uppercase;">Good news!</h1>
                        <p style="font-size: 16px; color: rgba(255,255,255,0.6); margin-bottom: 32px;">
                            The host has manually promoted your spot for <strong>${event.title}</strong>. 
                            Your ticket is now confirmed and ready.
                        </p>
                        <div style="text-align: center; margin: 32px 0;">
                             <a href="${qrUrl}" style="display: inline-block; background: #ffffff; color: #000000; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 900; text-transform: uppercase;">View Ticket</a>
                        </div>
                    </div>
                `
            }).catch(e => console.error("Promotion email error", e));
        }

        return NextResponse.json({ success: true, rsvp: updatedRSVP });
    } catch (error) {
        console.error("Manual promotion error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
