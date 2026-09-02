import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const MIME_TYPES: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    avif: "image/avif",
    gif: "image/gif",
    svg: "image/svg+xml",
};

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path: filePathParts } = await context.params;
        if (!filePathParts || filePathParts.length === 0) {
            return new NextResponse("Not Found", { status: 404 });
        }

        const relativePath = filePathParts.join("/");
        const uploadsBase = path.join(process.cwd(), "public", "uploads");
        const fullPath = path.join(uploadsBase, relativePath);

        // Security check: ensure path is within public/uploads (prevent directory traversal)
        if (!fullPath.startsWith(uploadsBase)) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        if (!existsSync(fullPath)) {
            return new NextResponse("Not Found", { status: 404 });
        }

        const ext = path.extname(fullPath).toLowerCase().replace(".", "");
        const contentType = MIME_TYPES[ext] || "application/octet-stream";

        const fileBuffer = await readFile(fullPath);

        return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch (error) {
        console.error("Error serving uploaded file:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
