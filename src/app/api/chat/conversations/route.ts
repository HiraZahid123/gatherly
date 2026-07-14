import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        // Fetch unique users that the current user has chatted with
        // We look for messages where the user is either sender or recipient
        // and they are NOT event group messages (eventId is null)
        const messages = await (prisma as any).chatMessage.findMany({
            where: {
                eventId: null,
                OR: [
                    { senderId: userId },
                    { recipientId: userId }
                ]
            },
            include: {
                sender: {
                    select: { id: true, name: true, image: true }
                },
                recipient: {
                    select: { id: true, name: true, image: true }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        // Group by user and get latest message
        const conversationMap = new Map();
        for (const msg of messages) {
            const otherUser = msg.senderId === userId ? msg.recipient : msg.sender;
            if (!otherUser) continue;
            
            if (!conversationMap.has(otherUser.id)) {
                conversationMap.set(otherUser.id, {
                    user: otherUser,
                    lastMessage: msg.content,
                    createdAt: msg.createdAt,
                    isRead: msg.recipientId === userId ? msg.isRead : true // If we sent it, consider it read for us
                });
            }
        }

        return NextResponse.json(Array.from(conversationMap.values()));
    } catch (error) {
        console.error("Error fetching conversations:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
