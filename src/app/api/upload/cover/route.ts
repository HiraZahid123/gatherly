import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "avif", "gif", "svg", "heic", "heif"];

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const session = await auth();
        if (!session?.user?.id && (session?.user as any)?.role !== "ADMIN") {
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

        // Validate file extension / mime type
        const extension = (file.name.split(".").pop() || "jpg").toLowerCase();
        const isAllowedType =
            file.type.startsWith("image/") ||
            ALLOWED_EXTENSIONS.includes(extension);

        if (!isAllowedType) {
            return NextResponse.json(
                { error: "Invalid file type. Only image files (JPEG, PNG, WebP, AVIF, GIF, SVG) are allowed." },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: "File size exceeds the 15MB limit." },
                { status: 400 }
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const userId = session?.user?.id || "admin";
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 10);
        const filename = `cover-${userId}-${timestamp}-${randomString}.${extension}`;

        // Attempt to save to public/uploads/covers if filesystem is writable
        try {
            const uploadDir = path.join(process.cwd(), "public", "uploads", "covers");
            if (!existsSync(uploadDir)) {
                await mkdir(uploadDir, { recursive: true });
            }
            const filepath = path.join(uploadDir, filename);
            await writeFile(filepath, buffer);

            const imageUrl = `/uploads/covers/${filename}`;
            return NextResponse.json({
                success: true,
                message: "Cover image uploaded successfully.",
                imageUrl,
            });
        } catch (fsError) {
            console.warn("Filesystem write not available, falling back to data URL:", fsError);
            // Fallback for read-only / serverless deployment (Vercel)
            const mimeType = file.type || `image/${extension === "jpg" ? "jpeg" : extension}`;
            const base64Data = buffer.toString("base64");
            const dataUrl = `data:${mimeType};base64,${base64Data}`;

            return NextResponse.json({
                success: true,
                message: "Image processed successfully.",
                imageUrl: dataUrl,
            });
        }
    } catch (error: any) {
        console.error("Cover upload error:", error);
        return NextResponse.json(
            { error: error?.message || "An error occurred while uploading the file." },
            { status: 500 }
        );
    }
}
