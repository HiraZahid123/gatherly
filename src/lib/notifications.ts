import { prisma } from "@/lib/prisma";

export type NotificationInput = {
    userId: string;
    title: string;
    message: string;
    type?: string;
    link?: string;
};

export async function createNotification(input: NotificationInput) {
    return (prisma as any).notification.create({
        data: {
            userId: input.userId,
            title: input.title,
            message: input.message,
            type: input.type || "PLATFORM",
            link: input.link,
        },
    });
}