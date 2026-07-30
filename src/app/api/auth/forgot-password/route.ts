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
        const resetLink = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;

        const emailResult = await sendEmail({
            to: email,
            subject: "Reset Your Password - JollyWitMe",
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #6d28d9;">Reset Your Password</h1>
                    <p>You requested to reset your password. Click the link below to proceed:</p>
                    <a href="${resetLink}" style="display: inline-block; background-color: #6d28d9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Reset Password</a>
                    <p>If you didn't request this, you can safely ignore this email.</p>
                    <p style="font-size: 12px; color: #666;">This link expires in 1 hour.</p>
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
