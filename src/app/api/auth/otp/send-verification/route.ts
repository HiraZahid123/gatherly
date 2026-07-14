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

        // Check if phone number is already taken by ANOTHER user
        const existingUserWithPhone = await prisma.user.findUnique({
            where: { phone: formattedPhone },
        });

        if (existingUserWithPhone && existingUserWithPhone.id !== session.user.id) {
            return NextResponse.json({
                error: 'This phone number is already linked to another account.'
            }, { status: 400 });
        }

        const otpCode = generateOTP();
        const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Store OTP in the current user's record
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                otpCode,
                otpExpires,
            },
        });

        // Send via WhatsApp
        console.log(`[API] Triggering WhatsApp verification for ${formattedPhone}...`);
        const sent = await getWhatsAppService().sendOTP(formattedPhone, otpCode);

        if (!sent) {
            console.warn(`[API] WhatsApp send failed for ${formattedPhone}. Code: ${otpCode}`);
            return NextResponse.json({ error: 'Failed to send WhatsApp message. Please try again.' }, { status: 500 });
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Verification code sent successfully',
            debug: otpCode // Included for Testing Mode
        });

    } catch (error) {
        console.error('Verification OTP Send Error:', error);
        return NextResponse.json({ error: 'Failed to send verification code' }, { status: 500 });
    }
}
