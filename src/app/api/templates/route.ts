import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TEMPLATES as DEFAULT_TEMPLATES } from "@/lib/templates";

// GET /api/templates — public route to fetch published templates
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const trendingOnly = searchParams.get("trending") === "true";
        const category = searchParams.get("category");
        const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;

        const whereClause: any = {
            published: true,
        };

        if (trendingOnly) {
            whereClause.isTrending = true;
        }

        if (category && category !== "All") {
            whereClause.category = {
                equals: category,
                mode: "insensitive"
            };
        }

        const templates = await prisma.eventTemplate.findMany({
            where: whereClause,
            orderBy: [
                { order: "asc" },
                { createdAt: "desc" },
            ],
            take: limit,
        });

        // Fallback to default static templates if no templates exist yet
        if (templates.length === 0 && !category) {
            const mappedDefaults = DEFAULT_TEMPLATES.map((t, idx) => ({
                id: t.id,
                title: t.title,
                category: t.id === "girl-dinner" ? "Dinner" : t.id === "party" ? "Party" : t.id === "graduation" ? "Celebration" : "Night Out",
                previewImage: t.previewImage,
                bgClass: t.bgClass,
                theme: t.config.theme,
                effect: t.config.effect,
                poster: t.config.poster,
                vibeId: t.config.vibeId,
                isTrending: true,
                order: idx,
                published: true,
            }));
            return NextResponse.json({ success: true, templates: mappedDefaults, isDefault: true });
        }

        return NextResponse.json({ success: true, templates });
    } catch (error) {
        console.error("GET /api/templates error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch templates" }, { status: 500 });
    }
}
