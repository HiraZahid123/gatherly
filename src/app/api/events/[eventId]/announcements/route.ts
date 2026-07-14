import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — Fetch all announcements for an event (public)
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    const { eventId } = await params;
    try {
        const announcements = await prisma.announcement.findMany({
            where: { eventId },
            orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
            include: {
                host: { select: { id: true, name: true, image: true } },
            },
        });
        return NextResponse.json({ success: true, announcements });
    } catch (error) {
        console.error("GET /announcements error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch announcements" }, { status: 500 });
    }
}

// POST — Create an announcement (host / co-host only)
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    const { eventId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { hostId: true, theme: true },
        });
        if (!event) return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });

        const cohosts: any[] = (event.theme as any)?.settings?.hosts?.cohosts || [];
        const isAuthorized =
            event.hostId === session.user.id ||
            cohosts.some(
                (c: any) => c.id === session.user!.id || c.email === session.user!.email
            );
        if (!isAuthorized) {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { content, isPinned = false } = body;
        if (!content?.trim()) {
            return NextResponse.json({ success: false, error: "Content is required" }, { status: 400 });
        }

        const announcement = await prisma.announcement.create({
            data: { eventId, hostId: session.user.id, content: content.trim(), isPinned },
            include: { host: { select: { id: true, name: true, image: true } } },
        });
        return NextResponse.json({ success: true, announcement });
    } catch (error) {
        console.error("POST /announcements error:", error);
        return NextResponse.json({ success: false, error: "Failed to create announcement" }, { status: 500 });
    }
}

// DELETE — Delete an announcement (host / co-host only)
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    const { eventId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ success: false, error: "id required" }, { status: 400 });

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { hostId: true, theme: true },
        });
        if (!event) return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });

        const cohosts: any[] = (event.theme as any)?.settings?.hosts?.cohosts || [];
        const isAuthorized =
            event.hostId === session.user.id ||
            cohosts.some(
                (c: any) => c.id === session.user!.id || c.email === session.user!.email
            );
        if (!isAuthorized) {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }

        await prisma.announcement.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /announcements error:", error);
        return NextResponse.json({ success: false, error: "Failed to delete announcement" }, { status: 500 });
    }
}
