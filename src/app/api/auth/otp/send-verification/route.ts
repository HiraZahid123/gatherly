import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateOTP, formatPhone } from '@/lib/otp';
import { getWhatsAppService } from '@/services/whatsapp';
import { auth } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { phone } = await req.json();
        if (!phone) {
            return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
        }

        const formattedPhone = formatPhone(phone);

        // Robust user lookup by id or email
        const dbUser = await prisma.user.findFirst({
            where: {
                OR: [
                    ...(session.user.id ? [{ id: session.user.id }] : []),
                    ...(session.user.email ? [{ email: session.user.email }] : [])
                ]
            }
        });

        if (!dbUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if phone number is already taken by ANOTHER user
        const existingUserWithPhone = await prisma.user.findUnique({
            where: { phone: formattedPhone },
        });

        if (existingUserWithPhone && existingUserWithPhone.id !== dbUser.id) {
            return NextResponse.json({
                error: 'This phone number is already linked to another account.'
            }, { status: 400 });
        }

        const otpCode = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Store OTP in the current user's record
        await prisma.user.update({
            where: { id: dbUser.id },
            data: {
                otpCode,
                otpExpires,
            },
        });

        // Send OTP via Email to the user's email
        if (dbUser.email) {
            const { sendEmail } = await import("@/lib/mail");
            await sendEmail({
                to: dbUser.email,
                subject: `${otpCode} is your JollyWitMe verification code`,
                html: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px;">
                        <div style="text-align: center; margin-bottom: 24px;">
                            <h1 style="color: #059669; font-size: 26px; font-weight: 800; margin: 0 0 8px 0; letter-spacing: -0.5px;">JollyWitMe</h1>
                            <p style="color: #6b7280; font-size: 14px; margin: 0;">Account Verification Code</p>
                        </div>
                        <div style="padding: 24px 0; border-top: 1px solid #f3f4f6; border-bottom: 1px solid #f3f4f6; text-align: center;">
                            <p style="color: #4b5563; font-size: 15px; margin: 0 0 16px 0;">Your 6-digit verification code is:</p>
                            <div style="display: inline-block; background-color: #f0fdf4; border: 2px solid #10b981; border-radius: 12px; padding: 16px 32px; letter-spacing: 8px; font-size: 32px; font-weight: 800; color: #065f46; font-family: monospace; margin: 12px 0;">
                                ${otpCode}
                            </div>
                            <p style="color: #6b7280; font-size: 13px; margin: 16px 0 0 0;">This code will expire in 10 minutes.</p>
                        </div>
                        <div style="text-align: center; margin-top: 24px; color: #9ca3af; font-size: 12px;">
                            <p style="margin: 0;">© ${new Date().getFullYear()} JollyWitMe. All rights reserved.</p>
                        </div>
                    </div>
                `,
            }).catch((err) => {
                console.error("[send-verification] Non-fatal email error:", err);
            });
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Verification code sent to your email successfully'
        });

    } catch (error) {
        console.error('Verification OTP Send Error:', error);
        return NextResponse.json({ error: 'Failed to send verification code' }, { status: 500 });
    }
}
