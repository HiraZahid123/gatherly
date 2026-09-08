import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notifications = await (prisma as any).notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 30,
    });

    return NextResponse.json({
        notifications,
        unreadCount: notifications.filter((notification: any) => !notification.isRead).length,
    });
}

export async function PATCH(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const where = body.id
        ? { id: body.id, userId: session.user.id }
        : { userId: session.user.id, isRead: false };

    await (prisma as any).notification.updateMany({
        where,
        data: { isRead: true },
    });

    return NextResponse.json({ success: true });
}