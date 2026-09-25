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

        if ((global as any).io) {
            (global as any).io.to(`event-${comment.eventId}`).emit("delete-comment", { id: commentId, parentId: comment.parentId });
        }

        return NextResponse.json({ success: true, commentId });
    } catch (error) {
        console.error("Error deleting comment:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(
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
        const body = await req.json();
        const { content } = body;

        if (!content || typeof content !== "string" || !content.trim()) {
            return NextResponse.json({ error: "Comment content cannot be empty" }, { status: 400 });
        }

        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
        });

        if (!comment) {
            return NextResponse.json({ error: "Comment not found" }, { status: 404 });
        }

        // Only author can edit the comment text
        if (comment.userId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden: Only author can edit comment" }, { status: 403 });
        }

        const updated = await prisma.comment.update({
            where: { id: commentId },
            data: { content: content.trim() },
            include: {
                user: { select: { id: true, name: true, image: true } },
            },
        });

        if ((global as any).io) {
            (global as any).io.to(`event-${comment.eventId}`).emit("update-comment", updated);
        }

        return NextResponse.json({ success: true, comment: updated });
    } catch (error) {
        console.error("Error updating comment:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
