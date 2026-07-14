
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
        return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const verificationToken = await prisma.verificationToken.findUnique({
        where: { token },
    });

    if (!verificationToken) {
        return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    if (new Date() > verificationToken.expires) {
        return NextResponse.json({ error: "Token expired" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
        where: { email: verificationToken.identifier },
    });

    if (!existingUser) {
        return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    await prisma.user.update({
        where: { id: existingUser.id },
        data: { emailVerified: new Date() },
    });

    await prisma.verificationToken.delete({
        where: { token },
    });

    return NextResponse.json({ success: true, message: "Email verified successfully" });
}
