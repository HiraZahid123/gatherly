import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { formatPhone } from '@/lib/otp';

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { phone, otp } = await req.json();
        if (!phone || !otp) {
            return NextResponse.json({ error: 'Phone and OTP are required' }, { status: 400 });
        }

        const formattedPhone = formatPhone(phone);

        const trimmedOtp = otp.toString().trim();

        // Robust user lookup by id or email
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    ...(session.user.id ? [{ id: session.user.id }] : []),
                    ...(session.user.email ? [{ email: session.user.email }] : [])
                ]
            },
        });

        if (!user || !user.otpCode || !user.otpExpires) {
            return NextResponse.json({ error: 'No verification code found. Please request a new one.' }, { status: 400 });
        }

        // Check expiry
        if (new Date() > user.otpExpires) {
            return NextResponse.json({ error: 'Verification code expired. Please request a new one.' }, { status: 400 });
        }

        // Verify OTP
        if (user.otpCode.trim() !== trimmedOtp) {
            return NextResponse.json({ error: 'Incorrect verification code' }, { status: 400 });
        }

        // Update user
        await prisma.user.update({
            where: { id: user.id },
            data: {
                phone: formattedPhone,
                otpCode: null,
                otpExpires: null,
                role: user.role === 'GUEST' ? 'HOST' : user.role // Upgrade to host if they were just a guest
            },
        });

        return NextResponse.json({ success: true, message: 'Profile updated successfully' });

    } catch (error) {
        console.error('Profile Completion Error:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}
