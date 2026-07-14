import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { content, eventId, type = "TEXT", mediaUrl, parentId } = body;

        if (!content || !eventId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Validate parentId belongs to same event
        if (parentId) {
            const parent = await prisma.comment.findUnique({
                where: { id: parentId },
                select: { eventId: true, parentId: true },
            });
            if (!parent || parent.eventId !== eventId || parent.parentId) {
                // Only one level of nesting allowed
                return NextResponse.json({ error: "Invalid parent comment" }, { status: 400 });
            }
        }

        const comment = await prisma.comment.create({
            data: {
                content,
                eventId,
                userId: session.user.id,
                type,
                mediaUrl,
                ...(parentId ? { parentId } : {}),
            },
            include: {
                user: {
                    select: { id: true, name: true, image: true },
                },
            },
        });

        if ((global as any).io) {
            (global as any).io.to(`event-${eventId}`).emit("new-comment", comment);
        }

        return NextResponse.json(comment, { status: 201 });
    } catch (error) {
        console.error("Error creating comment:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const eventId = searchParams.get("eventId");
        const cursor = searchParams.get("cursor") ?? undefined;

        if (!eventId) {
            return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
        }

        const PAGE_SIZE = 50;

        const comments = await prisma.comment.findMany({
            where: {
                eventId,
                parentId: null,
                ...(cursor ? { id: { lt: cursor } } : {}),
            },
            include: {
                user: { select: { id: true, name: true, image: true } },
                replies: {
                    include: {
                        user: { select: { id: true, name: true, image: true } },
                    },
                    orderBy: { createdAt: "asc" },
                    take: 20,
                },
            },
            orderBy: { createdAt: "desc" },
            take: PAGE_SIZE,
        });

        const nextCursor = comments.length === PAGE_SIZE ? comments[PAGE_SIZE - 1].id : null;

        return NextResponse.json(comments, {
            headers: nextCursor ? { "X-Next-Cursor": nextCursor } : {},
        });
    } catch (error) {
        console.error("Error fetching comments:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
