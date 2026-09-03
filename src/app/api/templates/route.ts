import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveTemplateCategory } from "@/lib/templates";

// GET /api/templates — public route to fetch published templates from admin-managed data only
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
            const categoryAliases = resolveTemplateCategory(category);
            whereClause.OR = categoryAliases.map((alias) => ({
                category: {
                    equals: alias,
                    mode: "insensitive",
                },
            }));
        }

        const templates = await prisma.eventTemplate.findMany({
            where: whereClause,
            orderBy: [
                { order: "asc" },
                { createdAt: "desc" },
            ],
            take: limit,
        });

        return NextResponse.json({ success: true, templates });
    } catch (error) {
        console.error("GET /api/templates error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch templates" }, { status: 500 });
    }
}
