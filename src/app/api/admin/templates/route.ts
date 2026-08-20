import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

// GET /api/admin/templates — list all templates (including drafts and unpublished)
export async function GET() {
    try {
        await verifyAdmin();
        const templates = await prisma.eventTemplate.findMany({
            orderBy: [
                { order: "asc" },
                { createdAt: "desc" },
            ],
        });
        return NextResponse.json({ success: true, templates });
    } catch {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
}

// POST /api/admin/templates — create a new template
export async function POST(req: NextRequest) {
    try {
        await verifyAdmin();
        const body = await req.json();
        const {
            title,
            category,
            previewImage,
            bgClass,
            theme,
            effect,
            poster,
            vibeId,
            isTrending,
            order,
            published,
        } = body;

        if (!title || !previewImage) {
            return NextResponse.json({
                success: false,
                error: "Title and preview image are required."
            }, { status: 400 });
        }

        const template = await prisma.eventTemplate.create({
            data: {
                title,
                category: category || "General",
                previewImage,
                bgClass: bgClass || "bg-emerald-950",
                theme: theme || "meadow",
                effect: effect || "particles",
                poster: poster || previewImage,
                vibeId: vibeId || "fancy",
                isTrending: isTrending ?? true,
                order: order !== undefined ? Number(order) : 0,
                published: published ?? true,
            },
        });

        return NextResponse.json({ success: true, template }, { status: 201 });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Internal Server Error";
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}
