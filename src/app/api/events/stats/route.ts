import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const userId = session.user.id;

        const [total, drafts, published] = await Promise.all([
            prisma.event.count({
                where: { hostId: userId }
            }),
            prisma.event.count({
                where: {
                    hostId: userId,
                    status: "DRAFT"
                }
            }),
            prisma.event.count({
                where: {
                    hostId: userId,
                    status: "PUBLISHED"
                }
            })
        ]);

        return NextResponse.json({
            success: true,
            stats: {
                total,
                drafts,
                published
            }
        });
    } catch (error) {
        console.error("Fetch stats error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
