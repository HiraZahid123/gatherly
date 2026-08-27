
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
