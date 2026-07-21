import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

interface Params { params: Promise<{ id: string }> }

// GET /api/admin/blog/[id]
export async function GET(_req: NextRequest, { params }: Params) {
    try {
        await verifyAdmin();
        const { id } = await params;
        const post = await prisma.blog.findUnique({ where: { id } });
        if (!post) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
        return NextResponse.json({ success: true, post });
    } catch {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
}

// PUT /api/admin/blog/[id]
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        await verifyAdmin();
        const { id } = await params;
        const body = await req.json();

        const post = await prisma.blog.update({
            where: { id },
            data: {
                ...(body.slug !== undefined && { slug: body.slug }),
                ...(body.title !== undefined && { title: body.title }),
                ...(body.excerpt !== undefined && { excerpt: body.excerpt }),
                ...(body.category !== undefined && { category: body.category }),
                ...(body.authorName !== undefined && { authorName: body.authorName }),
                ...(body.authorRole !== undefined && { authorRole: body.authorRole }),
                ...(body.authorAvatar !== undefined && { authorAvatar: body.authorAvatar }),
                ...(body.publishedAt !== undefined && { publishedAt: new Date(body.publishedAt) }),
                ...(body.readingTime !== undefined && { readingTime: Number(body.readingTime) }),
                ...(body.coverGradient !== undefined && { coverGradient: body.coverGradient }),
                ...(body.coverEmoji !== undefined && { coverEmoji: body.coverEmoji }),
                ...(body.content !== undefined && { content: body.content }),
                ...(body.published !== undefined && { published: body.published }),
            },
        });

        return NextResponse.json({ success: true, post });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}

// DELETE /api/admin/blog/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        await verifyAdmin();
        const { id } = await params;
        await prisma.blog.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}
