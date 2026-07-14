
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
            const verifyUrl = `${process.env.NEXTAUTH_URL}/api/user/verify-update?token=${tokenString}&userId=${session.user.id}`;
            await sendEmail({
                to: value,
                subject: "Verify your new email",
                html: `<p>Click <a href="${verifyUrl}">here</a> to verify your new email address.</p>`,
            });

            return NextResponse.json({ success: true, message: "Verification email sent" });
        }

        return NextResponse.json({ error: "Invalid type" }, { status: 400 });

    } catch (error) {
        console.error("Request Verification Error:", error);
        return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
    }
}
