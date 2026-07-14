import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized. Please sign in." },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No file provided." },
                { status: 400 }
            );
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: "Invalid file type. Only JPEG, PNG, and WebP images are allowed." },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: "File size must be less than 5MB." },
                { status: 400 }
            );
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const extension = file.name.split(".").pop();
        const filename = `${session.user.id}-${timestamp}-${randomString}.${extension}`;

        // Create upload directory if it doesn't exist
        const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        // Convert file to buffer and save
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filepath = path.join(uploadDir, filename);
        await writeFile(filepath, buffer);

        // Generate URL
        const imageUrl = `/uploads/avatars/${filename}`;

        return NextResponse.json({
            success: true,
            message: "Avatar uploaded successfully.",
            imageUrl,
        });
    } catch (error) {
        console.error("Avatar upload error:", error);
        return NextResponse.json(
            { error: "An error occurred while uploading the file." },
            { status: 500 }
        );
    }
}
