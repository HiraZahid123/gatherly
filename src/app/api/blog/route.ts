import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/blog — public published posts only
export async function GET() {
    try {
        const posts = await prisma.blog.findMany({
            where: { published: true },
            orderBy: { publishedAt: "desc" },
        });

        // Shape into BlogPost-compatible format
        const shaped = posts.map((p) => ({
            slug: p.slug,
            title: p.title,
            excerpt: p.excerpt,
            category: p.category,
            author: {
                name: p.authorName,
                role: p.authorRole,
                avatar: p.authorAvatar,
            },
            publishedAt: p.publishedAt.toISOString(),
            readingTime: p.readingTime,
            coverGradient: p.coverGradient,
            coverEmoji: p.coverEmoji,
            content: p.content,
        }));

        return NextResponse.json({ success: true, posts: shaped });
    } catch {
        return NextResponse.json({ success: false, posts: [] });
    }
}
