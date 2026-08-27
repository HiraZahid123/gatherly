import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/mail";

const SUPPORT_EMAIL = "support@jollywitme.com";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, subject, category, phone, message } = body;

        // Basic validation
        if (!name || typeof name !== "string" || name.trim().length < 2) {
            return NextResponse.json(
                { error: "Please enter your full name (at least 2 characters)." },
                { status: 400 }
            );
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
            return NextResponse.json(
                { error: "Please provide a valid email address." },
                { status: 400 }
            );
        }

        if (!message || typeof message !== "string" || message.trim().length < 10) {
            return NextResponse.json(
                { error: "Please write a message of at least 10 characters." },
                { status: 400 }
            );
        }

        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();
        const cleanSubject = (subject && subject.trim()) || (category && category.trim()) || "General Inquiry";
        const cleanCategory = category ? category.trim() : "General";
        const cleanPhone = phone ? phone.trim() : "Not provided";
        const cleanMessage = message.trim();
        const timestamp = new Date().toUTCString();

        // 1. Send email to support@jollywitme.com
        const adminEmailHtml = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c0c0e; color: #ffffff; margin: 0; padding: 20px; }
  .container { max-width: 600px; margin: 0 auto; background-color: #141416; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; }
  .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 24px 32px; text-align: left; }
  .header h1 { margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
  .header p { margin: 4px 0 0; font-size: 13px; color: rgba(255,255,255,0.85); }
  .content { padding: 32px; }
  .badge { display: inline-block; background-color: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #34d399; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 4px 10px; rounded: 8px; border-radius: 6px; margin-bottom: 16px; }
  .info-grid { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  .info-grid td { padding: 10px 12px; border-bottom: 1px solid #27272a; font-size: 14px; }
  .info-label { color: #a1a1aa; font-weight: 600; width: 35%; }
  .info-value { color: #f4f4f5; font-weight: 500; }
  .message-box { background-color: #1c1c1f; border-left: 4px solid #10b981; padding: 18px 20px; border-radius: 8px; color: #e4e4e7; font-size: 14px; line-height: 1.6; white-space: pre-wrap; margin-top: 12px; }
  .footer { padding: 20px 32px; background-color: #0e0e10; border-top: 1px solid #27272a; text-align: center; font-size: 12px; color: #71717a; }
  .btn { display: inline-block; background-color: #10b981; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 24px; border-radius: 10px; margin-top: 24px; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Contact Inquiry</h1>
      <p>Received via JollyWitMe Contact Form</p>
    </div>
    <div class="content">
      <div class="badge">${cleanCategory}</div>
      <table class="info-grid">
        <tr>
          <td class="info-label">Sender Name:</td>
          <td class="info-value"><strong>${cleanName}</strong></td>
        </tr>
        <tr>
          <td class="info-label">Sender Email:</td>
          <td class="info-value"><a href="mailto:${cleanEmail}" style="color: #34d399; text-decoration: none;">${cleanEmail}</a></td>
        </tr>
        <tr>
          <td class="info-label">Phone / WhatsApp:</td>
          <td class="info-value">${cleanPhone}</td>
        </tr>
        <tr>
          <td class="info-label">Category:</td>
          <td class="info-value">${cleanCategory}</td>
        </tr>
        <tr>
          <td class="info-label">Subject:</td>
          <td class="info-value">${cleanSubject}</td>
        </tr>
        <tr>
          <td class="info-label">Submitted At:</td>
          <td class="info-value">${timestamp}</td>
        </tr>
      </table>

      <h3 style="margin: 24px 0 8px; font-size: 14px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.5px;">Message Content:</h3>
      <div class="message-box">${cleanMessage}</div>

      <div style="text-align: center;">
        <a href="mailto:${cleanEmail}?subject=Re: [JollyWitMe Support] ${encodeURIComponent(cleanSubject)}" class="btn">
          Reply Directly to ${cleanName}
        </a>
      </div>
    </div>
    <div class="footer">
      This notification was automatically sent from the JollyWitMe Contact System.
    </div>
  </div>
</body>
</html>
        `;

        const supportEmailResult = await sendEmail({
            to: SUPPORT_EMAIL,
            replyTo: cleanEmail,
            subject: `[JollyWitMe Contact] ${cleanCategory}: ${cleanSubject} - ${cleanName}`,
            html: adminEmailHtml,
        });

        // 2. Send automated confirmation receipt to the customer
        const userReceiptHtml = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0a0a0b; color: #ffffff; margin: 0; padding: 20px; }
  .container { max-width: 560px; margin: 0 auto; background-color: #141416; border: 1px solid #27272a; border-radius: 20px; overflow: hidden; }
  .header { padding: 32px 32px 20px; text-align: center; border-bottom: 1px solid #1f1f23; }
  .header h1 { margin: 12px 0 0; font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; }
  .content { padding: 32px; }
  .highlight-card { background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 12px; padding: 18px; margin: 20px 0; }
  .message-copy { background-color: #1e1e22; border-radius: 10px; padding: 16px; color: #a1a1aa; font-size: 13px; font-style: italic; line-height: 1.5; margin-top: 12px; }
  .footer { padding: 24px 32px; background-color: #0e0e10; text-align: center; font-size: 12px; color: #71717a; border-top: 1px solid #1f1f23; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="font-size: 32px;">💌</div>
      <h1>We Received Your Message!</h1>
    </div>
    <div class="content">
      <p style="font-size: 15px; color: #e4e4e7; line-height: 1.6;">
        Hi <strong>${cleanName}</strong>,
      </p>
      <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6;">
        Thank you for contacting <strong>JollyWitMe</strong>. Our team has received your message regarding <strong>"${cleanSubject}"</strong> and we are reviewing it.
      </p>

      <div class="highlight-card">
        <p style="margin: 0; font-size: 13px; color: #34d399; font-weight: 700;">
          ⚡ Expected Response Time: Within 24 hours
        </p>
        <p style="margin: 4px 0 0; font-size: 12px; color: #a1a1aa;">
          A customer specialist will reply directly to this email (<a href="mailto:${cleanEmail}" style="color: #34d399;">${cleanEmail}</a>).
        </p>
      </div>

      <p style="font-size: 12px; color: #71717a; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; margin-top: 24px; margin-bottom: 4px;">
        A copy of your inquiry:
      </p>
      <div class="message-copy">"${cleanMessage}"</div>

      <p style="font-size: 13px; color: #a1a1aa; line-height: 1.6; margin-top: 24px;">
        Best regards,<br/>
        <strong>The JollyWitMe Support Team</strong><br/>
        <a href="https://jollywitme.com" style="color: #10b981; text-decoration: none;">jollywitme.com</a>
      </p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} JollyWitMe. All rights reserved.
    </div>
  </div>
</body>
</html>
        `;

        // Send confirmation in background
        sendEmail({
            to: cleanEmail,
            subject: `We've received your message - JollyWitMe Support`,
            html: userReceiptHtml,
        }).catch((err) => console.error("[Contact API] Failed to send receipt email to user:", err));

        return NextResponse.json({
            success: true,
            message: "Your message has been sent successfully! Our support team will get back to you shortly.",
        });
    } catch (error: any) {
        console.error("[Contact API] Error processing contact submission:", error);
        return NextResponse.json(
            { error: "An unexpected error occurred while sending your message. Please try again or email us directly at support@jollywitme.com." },
            { status: 500 }
        );
    }
}
