
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { generateOTP, formatPhone } from "@/lib/otp";
import { getWhatsAppService } from "@/services/whatsapp";
import { sendEmail } from "@/lib/mail"; // Assuming this exists from previous steps

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { type, value } = await req.json(); // type: 'phone' | 'email'

        if (!value) return NextResponse.json({ error: "Value is required" }, { status: 400 });

        if (type === "phone") {
            const formattedPhone = formatPhone(value);

            // Generate OTP
            const otp = generateOTP();
            const tokenString = `PHONE_UPDATE:${formattedPhone}:${otp}`;

            // Store in VerificationToken
            // identifier = user.id
            await prisma.verificationToken.create({
                data: {
                    identifier: session.user.id,
                    token: tokenString,
                    expires: new Date(Date.now() + 10 * 60 * 1000), // 10 mins
                },
            });

            // Send via WhatsApp
            await getWhatsAppService().sendOTP(formattedPhone, otp);

            return NextResponse.json({ success: true, message: "OTP sent" });
        }
        else if (type === "email") {
            // Check if email already exists
            const existing = await prisma.user.findUnique({ where: { email: value } });
            if (existing) {
                return NextResponse.json({ error: "Email already in use" }, { status: 400 });
            }

            const crypto = require('crypto');
            const token = crypto.randomBytes(32).toString('hex');
            const tokenString = `EMAIL_UPDATE:${value}:${token}`;

            await prisma.verificationToken.create({
                data: {
                    identifier: session.user.id,
                    token: tokenString,
                    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                },
            });

            // Send Email
            const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "https://jollywitme.com";
            const verifyUrl = `${baseUrl}/api/user/verify-update?token=${tokenString}&userId=${session.user.id}`;
            await sendEmail({
                to: value,
                subject: "Verify your email address — JollyWitMe",
                html: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px;">
                        <div style="text-align: center; margin-bottom: 24px;">
                            <h1 style="color: #059669; font-size: 26px; font-weight: 800; margin: 0 0 8px 0; letter-spacing: -0.5px;">JollyWitMe</h1>
                            <p style="color: #6b7280; font-size: 14px; margin: 0;">Email Verification</p>
                        </div>
                        <div style="padding: 24px 0; border-top: 1px solid #f3f4f6; border-bottom: 1px solid #f3f4f6;">
                            <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
                                Please confirm your new email address by clicking the button below:
                            </p>
                            <div style="text-align: center; margin: 28px 0;">
                                <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);">
                                    Confirm Email Address →
                                </a>
                            </div>
                            <p style="color: #9ca3af; font-size: 12px; margin: 0;">This link will expire in 24 hours.</p>
                        </div>
                        <div style="text-align: center; margin-top: 24px; color: #9ca3af; font-size: 12px;">
                            <p style="margin: 0;">© ${new Date().getFullYear()} JollyWitMe. All rights reserved.</p>
                        </div>
                    </div>
                `,
            });

            return NextResponse.json({ success: true, message: "Verification email sent" });
        }

        return NextResponse.json({ error: "Invalid type" }, { status: 400 });

    } catch (error) {
        console.error("Request Verification Error:", error);
        return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
    }
}
