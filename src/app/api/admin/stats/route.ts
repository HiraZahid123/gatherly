import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";

export async function GET() {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
        }

        const [userCount, eventCount, rsvpCount, commentCount, revenueAgg, suspendedCount] = await Promise.all([
            prisma.user.count(),
            prisma.event.count(),
            prisma.rSVP.count({ where: { status: "ACCEPTED" } }),
            prisma.comment.count(),
            prisma.order.aggregate({
                _sum: { totalAmount: true },
                where: { status: "COMPLETED" },
            }),
            prisma.user.count({ where: { suspendedAt: { not: null } } }),
        ]);

        // Recent activity
        const recentEvents = await prisma.event.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            select: { title: true, slug: true, createdAt: true, host: { select: { name: true } } }
        });

        return NextResponse.json({
            success: true,
            stats: {
                users: userCount,
                events: eventCount,
                rsvps: rsvpCount,
                comments: commentCount,
                revenue: revenueAgg._sum.totalAmount ?? 0,
                suspended: suspendedCount,
            },
            recentEvents
        });
    } catch (error: any) {
        console.error("Admin stats error:", error);
        if (error.code) console.error("Prisma Error Code:", error.code);
        if (error.meta) console.error("Prisma Error Meta:", error.meta);
        
        return NextResponse.json({ 
            success: false, 
            message: "Internal server error",
            debug: process.env.NODE_ENV === "development" ? error.message : undefined 
        }, { status: 500 });
    }
}
