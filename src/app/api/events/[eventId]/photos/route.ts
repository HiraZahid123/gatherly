import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

// GET: Fetch all photos for an event
export async function GET(
    request: NextRequest,
    props: { params: Promise<{ eventId: string }> }
) {
    const params = await props.params;
    try {
        const { eventId } = params;

        if (!(prisma as any).photo) {
            return NextResponse.json({ success: true, photos: [] });
        }

        const photos = await (prisma as any).photo.findMany({
            where: { eventId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true
                    }
                }
            },
            orderBy: { createdAt: "desc" },
            take: 200,
        });

        return NextResponse.json({ success: true, photos });
    } catch (error) {
        console.error("Photos Fetch error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

// POST: Upload a photo to an event
export async function POST(
    request: NextRequest,
    props: { params: Promise<{ eventId: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();
        const { eventId } = params;

        // Check if event exists
        const event = await prisma.event.findUnique({
            where: { id: eventId }
        });

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        const userId = session?.user?.id;
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const isHost = event.hostId === userId;
        const theme = event.theme as any;
        const allowGuestUpload = theme?.settings?.photos?.allowGuestUpload ?? true;

        if (!isHost) {
            if (!allowGuestUpload) {
                return NextResponse.json({ error: "Guest uploads are disabled by the host" }, { status: 403 });
            }

            // Verify the user is an accepted guest or co-host
            const isCohost = theme?.settings?.hosts?.cohosts?.some((c: any) => c.id === userId);
            
            if (!isCohost) {
                const rsvp = await prisma.rSVP.findFirst({
                    where: { eventId, userId, status: "ACCEPTED" }
                });
                
                if (!rsvp) {
                    return NextResponse.json({ error: "Only invited or joined guests can upload photos" }, { status: 403 });
                }
            }
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: "File size must be less than 10MB." },
                { status: 400 }
            );
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 10);
        const extension = file.name.split(".").pop();
        const filename = `photo-${timestamp}-${randomString}.${extension}`;

        // Create directory: public/uploads/events/[eventId]/photos
        const relativePath = path.join("uploads", "events", eventId, "photos");
        const uploadDir = path.join(process.cwd(), "public", relativePath);

        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        // Save file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filepath = path.join(uploadDir, filename);
        await writeFile(filepath, buffer);

        // Save to database
        if (!(prisma as any).photo) {
            throw new Error("Prisma model 'Photo' is not yet available in the client. Please restart the dev server.");
        }

        const photo = await (prisma as any).photo.create({
            data: {
                url: `/${relativePath}/${filename}`.replace(/\\/g, "/"),
                eventId: eventId,
                userId: session?.user?.id || null,
            }
        });

        return NextResponse.json({ success: true, photo });
    } catch (error) {
        console.error("Photo Upload error details:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal Server Error" },
            { status: 500 }
        );
    }
}
