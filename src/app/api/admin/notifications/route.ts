import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    if (!body.title?.trim() || !body.message?.trim()) {
        return NextResponse.json({ error: "title and message are required" }, { status: 400 });
    }

    const users = body.userId
        ? [{ id: body.userId }]
        : await prisma.user.findMany({ select: { id: true } });

    await (prisma as any).notification.createMany({
        data: users.map((user: { id: string }) => ({
            userId: user.id,
            title: body.title.trim(),
            message: body.message.trim(),
            type: "PLATFORM",
            link: body.link || "/dashboard",
        })),
    });

    return NextResponse.json({ success: true, recipientCount: users.length });
}