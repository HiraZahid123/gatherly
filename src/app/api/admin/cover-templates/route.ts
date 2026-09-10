import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin";
import { getAllCoverTemplates, addCoverTemplate } from "@/lib/coverTemplates";

export async function GET(req: NextRequest) {
    try {
        await verifyAdmin();
        const { searchParams } = new URL(req.url);
        const category = searchParams.get("category") || undefined;
        const search = searchParams.get("search") || undefined;

        const templates = await getAllCoverTemplates({ category, search });
        return NextResponse.json({ success: true, templates });
    } catch {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await verifyAdmin();
        const body = await req.json();
        const { title, url, category } = body;

        if (!title || !url) {
            return NextResponse.json(
                { success: false, error: "Title and Image URL are required" },
                { status: 400 }
            );
        }

        const template = await addCoverTemplate({ title, url, category });
        return NextResponse.json({ success: true, template }, { status: 201 });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Internal Server Error";
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}
