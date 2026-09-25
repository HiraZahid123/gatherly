
import nodemailer from "nodemailer";

interface SendEmailParams {
    to: string;
    subject: string;
    html: string;
    replyTo?: string;
    from?: string;
}

export async function sendEmail({ to, subject, html, replyTo, from }: SendEmailParams) {
    if (!process.env.MAIL_USERNAME) {
        console.log("================ MOCK EMAIL ================");
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        if (replyTo) console.log(`Reply-To: ${replyTo}`);
        console.log(`[Email body omitted - Configure SMTP in .env to send real emails]`);
        console.log("============================================");
        return { success: true, messageId: "mock-id-" + Date.now() };
    }

    const port = parseInt(process.env.MAIL_PORT || "465");
    const isSecure = port === 465 || process.env.MAIL_ENCRYPTION === "ssl" || process.env.MAIL_ENCRYPTION === "tls_ssl";

    const transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST || "smtp.hostinger.com",
        port,
        secure: isSecure,
        auth: {
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASSWORD,
        },
    });

    try {
        const info = await transporter.sendMail({
            from: from || `"${process.env.MAIL_FROM_NAME || 'JollyWitMe'}" <${process.env.MAIL_FROM_ADDRESS || 'support@jollywitme.com'}>`,
            to,
            replyTo,
            subject,
            html,
        });

        console.log("Message sent: %s", info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Error sending email:", error);
        return { success: false, error };
    }
}

interface TicketConfirmationEmailParams {
    to: string;
    guestName?: string;
    eventTitle: string;
    eventSlug: string;
    qrToken: string;
    startDate?: string | Date;
    location?: string | null;
    ticketTierName?: string | null;
    isWaitlist?: boolean;
    waitlistPosition?: number;
}

export async function sendTicketConfirmationEmail(params: TicketConfirmationEmailParams) {
    const {
        to,
        guestName = "Guest",
        eventTitle,
        eventSlug,
        qrToken,
        startDate,
        location,
        ticketTierName,
        isWaitlist = false,
        waitlistPosition
    } = params;

    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "https://jollywitme.com";
    const ticketUrl = `${baseUrl}/e/${eventSlug}?ticket=${encodeURIComponent(qrToken)}`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrToken)}&margin=10`;

    const formattedDate = startDate
        ? new Date(startDate).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
        })
        : "Date announced soon";

    const subject = isWaitlist
        ? `Waitlist Confirmed for ${eventTitle} · JollyWitMe`
        : `Your Ticket for ${eventTitle} 🎟️ · JollyWitMe`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #0b0c10; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 580px; margin: 0 auto; background-color: #14151b; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
        <!-- JollyWitMe Permanent Brand Header -->
        <tr>
            <td style="padding: 28px 32px 20px; background: linear-gradient(180deg, #1a1c24 0%, #14151b 100%); border-bottom: 1px solid rgba(255, 255, 255, 0.06); text-align: center;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                        <td align="center">
                            <div style="display: inline-block; vertical-align: middle;">
                                <a href="https://jollywitme.com" target="_blank" style="text-decoration: none; display: inline-flex; align-items: center; gap: 8px;">
                                    <img src="https://jollywitme.com/logo/logo-full.webp" alt="JollyWitMe" height="34" style="height: 34px; width: auto; max-width: 160px; vertical-align: middle; border: 0;" onerror="this.style.display='none'" />
                                    <span style="font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: #22c55e; vertical-align: middle; margin-left: 8px;">JollyWitMe</span>
                                </a>
                            </div>
                            <div style="margin-top: 8px;">
                                <span style="display: inline-block; font-size: 10px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; color: #10b981; background: rgba(16, 185, 129, 0.12); padding: 4px 12px; border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.25);">
                                    ✓ Verified JollyWitMe Pass
                                </span>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>

        <!-- Ticket Card Content -->
        <tr>
            <td style="padding: 32px;">
                <p style="margin: 0 0 12px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.2em; color: #10b981;">
                    ${isWaitlist ? "Waitlist Status" : "Official E-Ticket · Admit One"}
                </p>
                <h1 style="margin: 0 0 20px; font-size: 26px; font-weight: 900; line-height: 1.25; color: #ffffff; letter-spacing: -0.5px;">
                    ${eventTitle}
                </h1>

                <!-- Event Details Box -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; margin: 20px 0; padding: 18px 20px;">
                    <tr>
                        <td style="padding: 6px 0;">
                            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255, 255, 255, 0.4); display: block; margin-bottom: 2px;">Guest</span>
                            <span style="font-size: 15px; font-weight: 700; color: #ffffff;">${guestName}</span>
                        </td>
                    </tr>
                    ${ticketTierName ? `
                    <tr>
                        <td style="padding: 6px 0; border-top: 1px solid rgba(255, 255, 255, 0.05);">
                            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255, 255, 255, 0.4); display: block; margin-bottom: 2px;">Ticket Tier</span>
                            <span style="font-size: 14px; font-weight: 800; color: #10b981; background: rgba(16,185,129,0.12); padding: 2px 8px; border-radius: 6px; display: inline-block;">${ticketTierName}</span>
                        </td>
                    </tr>` : ''}
                    <tr>
                        <td style="padding: 6px 0; border-top: 1px solid rgba(255, 255, 255, 0.05);">
                            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255, 255, 255, 0.4); display: block; margin-bottom: 2px;">Date & Time</span>
                            <span style="font-size: 14px; font-weight: 600; color: #ffffff;">${formattedDate}</span>
                        </td>
                    </tr>
                    ${location ? `
                    <tr>
                        <td style="padding: 6px 0; border-top: 1px solid rgba(255, 255, 255, 0.05);">
                            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255, 255, 255, 0.4); display: block; margin-bottom: 2px;">Location</span>
                            <span style="font-size: 14px; font-weight: 600; color: #ffffff;">${location}</span>
                        </td>
                    </tr>` : ''}
                </table>

                ${!isWaitlist ? `
                <!-- QR Code Block -->
                <div style="text-align: center; margin: 28px 0 20px;">
                    <div style="display: inline-block; background: #ffffff; padding: 12px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                        <img src="${qrImageUrl}" alt="Entry QR Code" width="180" height="180" style="display: block; width: 180px; height: 180px; border: 0;" />
                    </div>
                    <p style="margin: 12px 0 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: rgba(255, 255, 255, 0.4);">
                        Show this QR code at the door for entry
                    </p>
                    <p style="margin: 0; font-size: 12px; font-family: monospace; color: rgba(255, 255, 255, 0.6);">
                        Code: ${qrToken}
                    </p>
                </div>
                ` : `
                <div style="text-align: center; margin: 24px 0; padding: 18px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 12px;">
                    <p style="margin: 0; font-size: 14px; font-weight: bold; color: #fbbf24;">
                        You are at position #${waitlistPosition || 1} on the waitlist.
                    </p>
                    <p style="margin: 6px 0 0; font-size: 12px; color: rgba(255,255,255,0.7);">
                        We'll notify you automatically as soon as a spot becomes available!
                    </p>
                </div>
                `}

                <!-- View Ticket CTA -->
                <div style="text-align: center; margin: 28px 0 12px;">
                    <a href="${ticketUrl}" target="_blank" style="display: inline-block; background: #10b981; color: #000000; font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; text-decoration: none; padding: 14px 32px; border-radius: 14px; box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);">
                        View Your Ticket Online →
                    </a>
                </div>
            </td>
        </tr>

        <!-- Jolly Team Footer -->
        <tr>
            <td style="padding: 24px 32px 28px; background-color: #0e0f14; border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center;">
                <p style="margin: 0 0 6px; font-size: 13px; font-weight: 600; color: rgba(255, 255, 255, 0.75);">
                    from the <strong style="color: #ffffff;">Jolly Team</strong> ✨
                </p>
                <p style="margin: 0; font-size: 11px; color: rgba(255, 255, 255, 0.35);">
                    Powered by <a href="https://jollywitme.com" target="_blank" style="color: #10b981; text-decoration: none; font-weight: 700;">JollyWitMe</a> · Moments that matter
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
    `;

    return sendEmail({
        to,
        subject,
        html
    });
}

interface AnnouncementBroadcastEmailParams {
    to: string;
    guestName?: string;
    eventTitle: string;
    eventSlug: string;
    announcementContent: string;
    hostName?: string;
}

export async function sendAnnouncementBroadcastEmail(params: AnnouncementBroadcastEmailParams) {
    const {
        to,
        guestName = "Guest",
        eventTitle,
        eventSlug,
        announcementContent,
        hostName = "The Host"
    } = params;

    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "https://jollywitme.com";
    const eventUrl = `${baseUrl}/e/${eventSlug}`;

    const subject = `📢 Update for ${eventTitle} · JollyWitMe`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #0b0c10; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 580px; margin: 0 auto; background-color: #14151b; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
        <!-- JollyWitMe Permanent Brand Header -->
        <tr>
            <td style="padding: 28px 32px 20px; background: linear-gradient(180deg, #1a1c24 0%, #14151b 100%); border-bottom: 1px solid rgba(255, 255, 255, 0.06); text-align: center;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                        <td align="center">
                            <div style="display: inline-block; vertical-align: middle;">
                                <a href="https://jollywitme.com" target="_blank" style="text-decoration: none; display: inline-flex; align-items: center; gap: 8px;">
                                    <img src="https://jollywitme.com/logo/logo-full.webp" alt="JollyWitMe" height="34" style="height: 34px; width: auto; max-width: 160px; vertical-align: middle; border: 0;" onerror="this.style.display='none'" />
                                    <span style="font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: #22c55e; vertical-align: middle; margin-left: 8px;">JollyWitMe</span>
                                </a>
                            </div>
                            <div style="margin-top: 8px;">
                                <span style="display: inline-block; font-size: 10px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; color: #3b82f6; background: rgba(59, 130, 246, 0.12); padding: 4px 12px; border-radius: 12px; border: 1px solid rgba(59, 130, 246, 0.25);">
                                    📢 Host Announcement
                                </span>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>

        <!-- Content -->
        <tr>
            <td style="padding: 32px;">
                <p style="margin: 0 0 8px; font-size: 14px; color: rgba(255,255,255,0.7);">
                    Hi <strong style="color: #ffffff;">${guestName}</strong>,
                </p>
                <p style="margin: 0 0 20px; font-size: 14px; color: rgba(255,255,255,0.7); line-height: 1.5;">
                    <strong style="color: #ffffff;">${hostName}</strong> just posted an important update for <strong style="color: #10b981;">${eventTitle}</strong>:
                </p>

                <div style="background: rgba(255,255,255,0.04); border-left: 4px solid #10b981; border-radius: 12px; padding: 20px 24px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #ffffff; white-space: pre-wrap;">
                        ${announcementContent}
                    </p>
                </div>

                <div style="text-align: center; margin: 28px 0 12px;">
                    <a href="${eventUrl}" target="_blank" style="display: inline-block; background: #10b981; color: #000000; font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; text-decoration: none; padding: 14px 32px; border-radius: 14px; box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);">
                        View Event Details →
                    </a>
                </div>
            </td>
        </tr>

        <!-- Jolly Team Footer -->
        <tr>
            <td style="padding: 24px 32px 28px; background-color: #0e0f14; border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center;">
                <p style="margin: 0 0 6px; font-size: 13px; font-weight: 600; color: rgba(255, 255, 255, 0.75);">
                    from the <strong style="color: #ffffff;">Jolly Team</strong> ✨
                </p>
                <p style="margin: 0; font-size: 11px; color: rgba(255, 255, 255, 0.35);">
                    Powered by <a href="https://jollywitme.com" target="_blank" style="color: #10b981; text-decoration: none; font-weight: 700;">JollyWitMe</a> · Moments that matter
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
    `;

    return sendEmail({
        to,
        subject,
        html
    });
}

