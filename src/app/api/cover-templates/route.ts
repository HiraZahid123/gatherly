import { NextRequest, NextResponse } from "next/server";
import { getAllCoverTemplates } from "@/lib/coverTemplates";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const category = searchParams.get("category") || undefined;
        const search = searchParams.get("search") || undefined;

        const templates = await getAllCoverTemplates({ category, search });
        return NextResponse.json({ success: true, templates });
    } catch (error) {
        console.error("GET /api/cover-templates error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch cover templates" },
            { status: 500 }
        );
    }
}
