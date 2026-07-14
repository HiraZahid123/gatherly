import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";

// GET /api/admin/moderation — suspended users + recent comments queue
export async function GET(request: Request) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";
        const tab = searchParams.get("tab") || "comments"; // "comments" | "suspended"
        const page = parseInt(searchParams.get("page") || "1");
        const limit = 15;
        const skip = (page - 1) * limit;

        if (tab === "suspended") {
            const where: any = {
                suspendedAt: { not: null },
                OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                ],
            };
            const [users, total] = await Promise.all([
                prisma.user.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { suspendedAt: "desc" },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                        role: true,
                        suspendedAt: true,
                        suspendedReason: true,
                        _count: { select: { events: true, rsvps: true } },
                    },
                }),
                prisma.user.count({ where }),
            ]);
            return NextResponse.json({ success: true, users, total, pages: Math.ceil(total / limit) });
        }

        // Comments queue
        const where: any = search
            ? {
                OR: [
                    { content: { contains: search, mode: "insensitive" } },
                    { user: { name: { contains: search, mode: "insensitive" } } },
                    { event: { title: { contains: search, mode: "insensitive" } } },
                ],
            }
            : {};

        const [comments, total] = await Promise.all([
            prisma.comment.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    content: true,
                    type: true,
                    mediaUrl: true,
                    createdAt: true,
                    user: { select: { id: true, name: true, email: true, image: true } },
                    event: { select: { id: true, title: true, slug: true } },
                },
            }),
            prisma.comment.count({ where }),
        ]);

        return NextResponse.json({ success: true, comments, total, pages: Math.ceil(total / limit) });
    } catch (error) {
        console.error("Admin moderation GET error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/admin/moderation?commentId=xxx — hard-delete a comment
export async function DELETE(request: Request) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const commentId = searchParams.get("commentId");

        if (!commentId) {
            return NextResponse.json({ success: false, message: "Missing commentId" }, { status: 400 });
        }

        await prisma.comment.delete({ where: { id: commentId } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Admin moderation DELETE error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
