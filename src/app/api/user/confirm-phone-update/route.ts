
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { otp } = await req.json();

        // Find token for this user
        // We need to find a token that STARTS with PHONE_UPDATE and ends with :otp? 
        // Prisma doesn't support "contains" on finding a unique, but we can findMany by identifier (userId)

        const tokens = await prisma.verificationToken.findMany({
            where: {
                identifier: session.user.id,
                expires: { gt: new Date() }
            }
        });

        // Filter in memory for the OTP
        const validToken = tokens.find(t => t.token.startsWith("PHONE_UPDATE:") && t.token.endsWith(`:${otp}`));

        if (!validToken) {
            return NextResponse.json({ error: "The verification code is invalid or has expired. Please request a new code if necessary." }, { status: 400 });
        }

        // Parse phone from token: PHONE_UPDATE:+123456:123456
        const parts = validToken.token.split(":");
        const phone = parts[1]; // Center part is phone

        // Check if phone taken
        const existing = await prisma.user.findUnique({ where: { phone } });
        if (existing && existing.id !== session.user.id) {
            return NextResponse.json({ error: "Phone already in use" }, { status: 400 });
        }

        // Update User
        await prisma.user.update({
            where: { id: session.user.id },
            data: { phone: phone }
        });

        // Delete used token
        await prisma.verificationToken.delete({ where: { token: validToken.token } });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Confirm Verification Error:", error);
        return NextResponse.json({ error: "Failed to verify" }, { status: 500 });
    }
}
