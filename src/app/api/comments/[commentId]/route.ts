import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    req: NextRequest,
    props: { params: Promise<{ commentId: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { commentId } = params;

        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            include: { event: true },
        });

        if (!comment) {
            return NextResponse.json({ error: "Comment not found" }, { status: 404 });
        }

        // Allow deletion if user is the author OR the event host
        const isAuthor = comment.userId === session.user.id;
        const isHost = comment.event.hostId === session.user.id;

        if (!isAuthor && !isHost) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await prisma.comment.delete({
            where: { id: commentId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting comment:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
