import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPasswordResetToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/mail";
import { forgotPasswordSchema } from "@/lib/validation";
import { formatPhone } from "@/lib/otp";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate input
        const validation = forgotPasswordSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { identifier } = validation.data;

        // Check if user exists (by email or phone)
        const formattedPhone = identifier.includes('@') ? null : formatPhone(identifier);

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier.toLowerCase() },
                    { phone: identifier },
                    ...(formattedPhone ? [{ phone: formattedPhone }] : [])
                ]
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "No account found with this email or phone number" },
                { status: 404 }
            );
        }

        if (!user.email) {
            return NextResponse.json(
                { error: "This account doesn't have an email address associated with it. Please sign in with WhatsApp." },
                { status: 400 }
            );
        }

        if (!user.password) {
            return NextResponse.json(
                { error: "This account was created using Google or WhatsApp and doesn't have a password set." },
                { status: 400 }
            );
        }

        const email = user.email;

        // Generate and store reset token
        const token = await createPasswordResetToken(email);

        // Send reset email
        const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "https://jollywitme.com";
        const resetLink = `${baseUrl}/auth/reset-password?token=${token}`;

        const emailResult = await sendEmail({
            to: email,
            subject: "Reset Your Password — JollyWitMe",
            html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <h1 style="color: #059669; font-size: 26px; font-weight: 800; margin: 0 0 8px 0; letter-spacing: -0.5px;">JollyWitMe</h1>
                        <p style="color: #6b7280; font-size: 14px; margin: 0;">Password Reset Request</p>
                    </div>
                    <div style="padding: 24px 0; border-top: 1px solid #f3f4f6; border-bottom: 1px solid #f3f4f6;">
                        <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
                            We received a request to reset your password. Click the button below to choose a new password:
                        </p>
                        <div style="text-align: center; margin: 28px 0;">
                            <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);">
                                Reset Password →
                            </a>
                        </div>
                        <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px 0;">If you didn't request a password reset, you can safely ignore this email.</p>
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">This reset link will expire in 1 hour.</p>
                    </div>
                    <div style="text-align: center; margin-top: 24px; color: #9ca3af; font-size: 12px;">
                        <p style="margin: 0;">© ${new Date().getFullYear()} JollyWitMe. All rights reserved.</p>
                    </div>
                </div>
            `,
        });

        if (!emailResult.success) {
            console.error("Failed to send password reset email:", emailResult.error);
            return NextResponse.json(
                { error: "Failed to send reset email. Please try again." },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            token, // returned for on-screen display during development
            message: `A password reset link has been sent to ${email}`,
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        return NextResponse.json(
            { error: "An error occurred. Please try again." },
            { status: 500 }
        );
    }
}
