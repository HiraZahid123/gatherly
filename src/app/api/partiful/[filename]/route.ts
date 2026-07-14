import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ filename: string }> }
) {
    const { filename } = await context.params;
    const decodedFilename = decodeURIComponent(filename);
    const filePath = path.join(process.cwd(), "public", "partiful", decodedFilename);

    if (!fs.existsSync(filePath)) {
        return new NextResponse("File Not Found", { status: 404 });
    }

    try {
        const fileBuffer = fs.readFileSync(filePath);
        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": "image/avif",
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch (error) {
        return new NextResponse("Error reading file", { status: 500 });
    }
}
