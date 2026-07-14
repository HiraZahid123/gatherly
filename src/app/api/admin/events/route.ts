import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";

export async function GET(request: Request) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status") || undefined;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = 10;
        const skip = (page - 1) * limit;

        const where: any = {
            OR: [
                { title: { contains: search, mode: "insensitive" } },
                { slug: { contains: search, mode: "insensitive" } },
            ],
        };

        if (status) {
            where.status = status;
        }

        const [events, total] = await Promise.all([
            prisma.event.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    status: true,
                    isFeatured: true,
                    isHidden: true,
                    createdAt: true,
                    startDate: true,
                    host: {
                        select: { name: true, email: true }
                    },
                    _count: {
                        select: { rsvps: true }
                    }
                }
            }),
            prisma.event.count({ where })
        ]);

        return NextResponse.json({
            success: true,
            events,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                currentPage: page
            }
        });
    } catch (error) {
        console.error("Admin events fetch error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const { eventId, isFeatured, isHidden } = body;

        if (!eventId) {
            return NextResponse.json({ success: false, message: "Missing event ID" }, { status: 400 });
        }

        const data: Record<string, boolean> = {};
        if (typeof isFeatured === "boolean") data.isFeatured = isFeatured;
        if (typeof isHidden === "boolean") data.isHidden = isHidden;

        const event = await prisma.event.update({
            where: { id: eventId },
            data,
            select: { id: true, isFeatured: true, isHidden: true }
        });

        return NextResponse.json({ success: true, event });
    } catch (error) {
        console.error("Admin event patch error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get("eventId");

        if (!eventId) {
            return NextResponse.json({ success: false, message: "Missing event ID" }, { status: 400 });
        }

        await prisma.event.delete({
            where: { id: eventId }
        });

        return NextResponse.json({ success: true, message: "Event deleted successfully" });
    } catch (error) {
        console.error("Admin event deletion error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
