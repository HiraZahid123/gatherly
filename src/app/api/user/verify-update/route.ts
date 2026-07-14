
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const tokenString = searchParams.get("token");
    const userId = searchParams.get("userId");

    if (!tokenString || !userId) {
        return NextResponse.json({ error: "Invalid link" }, { status: 400 });
    }

    const token = await prisma.verificationToken.findUnique({
        where: { token: tokenString },
    });

    if (!token || token.identifier !== userId || token.expires < new Date()) {
        return NextResponse.json({ error: "Invalid or expired link" }, { status: 400 });
    }

    // Parse email: EMAIL_UPDATE:email:random
    // Need to handle potential colons in email? Unlikely but possible.
    // Better split by limit?
    // EMAIL_UPDATE is index 0. Last part is random token. Middle is email.

    const parts = tokenString.split(":");
    // parts[0] = EMAIL_UPDATE
    // parts[last] = random
    // middle = email

    if (parts.length < 3) return NextResponse.json({ error: "Invalid token format" }, { status: 400 });

    const email = parts.slice(1, -1).join(":"); // Rejoin middle parts just in case

    // Update User
    await prisma.user.update({
        where: { id: userId },
        data: { email: email, emailVerified: new Date() }
    });

    await prisma.verificationToken.delete({ where: { token: tokenString } });

    // Redirect to dashboard
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?profileUpdated=true`);
}
