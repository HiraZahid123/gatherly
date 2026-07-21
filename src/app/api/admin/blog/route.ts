import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

// GET /api/admin/blog — list all posts (including drafts)
export async function GET() {
    try {
        await verifyAdmin();
        const posts = await prisma.blog.findMany({
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json({ success: true, posts });
    } catch {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
}

// POST /api/admin/blog — create a new post
export async function POST(req: NextRequest) {
    try {
        await verifyAdmin();
        const body = await req.json();
        const {
            slug, title, excerpt, category,
            authorName, authorRole, authorAvatar,
            publishedAt, readingTime, coverGradient,
            coverEmoji, content, published,
        } = body;

        if (!slug || !title || !content) {
            return NextResponse.json({ success: false, error: "slug, title and content are required" }, { status: 400 });
        }

        const post = await prisma.blog.create({
            data: {
                slug,
                title,
                excerpt: excerpt || "",
                category: category || "General",
                authorName: authorName || "Gatherly Team",
                authorRole: authorRole || "Editor",
                authorAvatar: authorAvatar || "GT",
                publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
                readingTime: readingTime ? Number(readingTime) : 5,
                coverGradient: coverGradient || "from-green-600 via-teal-700 to-emerald-800",
                coverEmoji: coverEmoji || "✨",
                content,
                published: published ?? false,
            },
        });

        return NextResponse.json({ success: true, post }, { status: 201 });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        if (msg.includes("Unique constraint")) {
            return NextResponse.json({ success: false, error: "A post with that slug already exists." }, { status: 409 });
        }
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}
