import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateOTP, formatPhone } from '@/lib/otp';
import { getWhatsAppService } from '@/services/whatsapp';

export async function POST(req: Request) {
    try {
        const { phone, name } = await req.json();

        if (!phone) {
            return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
        }

        const formattedPhone = formatPhone(phone);
        const otpCode = generateOTP();
        const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        const rawPhone = phone.trim();

        // Enforce existing user only for Login
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { phone: formattedPhone },
                    { phone: rawPhone },
                    { phone: rawPhone.replace(/^\+/, '') },
                    { phone: formattedPhone.replace(/^\+/, '') },
                ],
            },
        });

        if (!existingUser) {
            return NextResponse.json({
                error: 'Phone number not registered. Please sign up first.'
            }, { status: 404 });
        }

        // Update OTP for existing user
        await prisma.user.update({
            where: { id: existingUser.id },
            data: {
                otpCode,
                otpExpires,
            },
        });

        // Send via WhatsApp
        console.log(`[API] Triggering WhatsApp send for ${formattedPhone}...`);
        
        let sent = false;
        try {
            sent = await getWhatsAppService().sendOTP(formattedPhone, otpCode);
        } catch (sendError: any) {
            console.error('[API] WhatsApp Service throw error:', sendError);
            // Don't crash the route, just treat as not sent
        }

        if (!sent) {
            console.warn(`[API] WhatsApp send failed for ${formattedPhone}. Code: ${otpCode}`);
        } else {
            console.log(`[API] WhatsApp send successful for ${formattedPhone}`);
        }

        return NextResponse.json({ 
            success: true, 
            message: 'OTP sent successfully',
            debug: otpCode // Included for Testing Mode
        });

    } catch (error: any) {
        console.error('CRITICAL OTP Send Error:', error);
        return new Response(JSON.stringify({ 
            error: 'Internal service error',
            details: error?.message || 'Unknown'
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
