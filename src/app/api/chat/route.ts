import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { content, eventId, recipientId } = body;

        if (!content || (!eventId && !recipientId)) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const message = await (prisma as any).chatMessage.create({
            data: {
                content,
                senderId: session.user.id,
                eventId: eventId || null,
                recipientId: recipientId || null,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
            },
        });

        // Emit socket event
        if ((global as any).io) {
            if (eventId) {
                // Group message
                (global as any).io.to(`event-${eventId}`).emit('new-chat-message', message);
            } else if (recipientId) {
                // Private message - send to both recipient and sender's other tabs
                (global as any).io.to(`user-${recipientId}`).emit('new-chat-message', message);
                (global as any).io.to(`user-${session.user.id}`).emit('new-chat-message', message);
            }
        }

        return NextResponse.json(message, { status: 201 });
    } catch (error) {
        console.error("Error creating chat message:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const eventId = searchParams.get("eventId");
        const recipientId = searchParams.get("recipientId");

        if (!eventId && !recipientId) {
            return NextResponse.json({ error: "Event ID or Recipient ID is required" }, { status: 400 });
        }

        let whereClause = {};
        if (eventId) {
            whereClause = { eventId };
        } else if (recipientId) {
            whereClause = {
                OR: [
                    { senderId: session.user.id, recipientId },
                    { senderId: recipientId, recipientId: session.user.id }
                ]
            };
        }

        const messages = await (prisma as any).chatMessage.findMany({
            where: whereClause,
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
            },
            orderBy: {
                createdAt: "asc",
            },
            take: 100, // Limit for now
        });

        return NextResponse.json(messages);
    } catch (error) {
        console.error("Error fetching chat messages:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
