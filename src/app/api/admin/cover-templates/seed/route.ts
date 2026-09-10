import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin";
import { resetCoverTemplates } from "@/lib/coverTemplates";

export async function POST() {
    try {
        await verifyAdmin();
        const templates = await resetCoverTemplates();
        return NextResponse.json({
            success: true,
            message: `Successfully seeded ${templates.length} default cover templates!`,
            count: templates.length,
        });
    } catch {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
}
