import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/admin/templates/[id] — get a single template
export async function GET(_req: NextRequest, { params }: RouteParams) {
    try {
        await verifyAdmin();
        const { id } = await params;
        const template = await prisma.eventTemplate.findUnique({
            where: { id },
        });

        if (!template) {
            return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, template });
    } catch {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
}

// PUT /api/admin/templates/[id] — update a template
export async function PUT(req: NextRequest, { params }: RouteParams) {
    try {
        await verifyAdmin();
        const { id } = await params;
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

        const updated = await prisma.eventTemplate.update({
            where: { id },
            data: {
                ...(title !== undefined && { title }),
                ...(category !== undefined && { category }),
                ...(previewImage !== undefined && { previewImage }),
                ...(bgClass !== undefined && { bgClass }),
                ...(theme !== undefined && { theme }),
                ...(effect !== undefined && { effect }),
                ...(poster !== undefined && { poster }),
                ...(vibeId !== undefined && { vibeId }),
                ...(isTrending !== undefined && { isTrending }),
                ...(order !== undefined && { order: Number(order) }),
                ...(published !== undefined && { published }),
            },
        });

        return NextResponse.json({ success: true, template: updated });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Internal Server Error";
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}

// DELETE /api/admin/templates/[id] — delete a template
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
    try {
        await verifyAdmin();
        const { id } = await params;
        await prisma.eventTemplate.delete({
            where: { id },
        });

        return NextResponse.json({ success: true, message: "Template deleted" });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Internal Server Error";
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}
