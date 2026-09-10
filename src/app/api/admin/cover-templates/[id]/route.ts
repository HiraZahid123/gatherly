import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin";
import { deleteCoverTemplate } from "@/lib/coverTemplates";

export async function DELETE(
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await verifyAdmin();
        const { id } = await context.params;

        if (!id) {
            return NextResponse.json(
                { success: false, error: "Template ID is required" },
                { status: 400 }
            );
        }

        const success = await deleteCoverTemplate(id);
        if (!success) {
            return NextResponse.json(
                { success: false, error: "Template not found or already deleted" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Cover template deleted successfully",
        });
    } catch {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
}
