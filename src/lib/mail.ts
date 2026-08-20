
import nodemailer from "nodemailer";

interface SendEmailParams {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
    if (!process.env.MAIL_USERNAME) {
        console.log("================ MOCK EMAIL ================");
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
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
            from: `"${process.env.MAIL_FROM_NAME || 'Event Platform'}" <${process.env.MAIL_FROM_ADDRESS}>`,
            to,
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
