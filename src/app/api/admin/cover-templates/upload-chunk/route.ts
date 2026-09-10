import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin";
import { addCoverTemplate } from "@/lib/coverTemplates";
import fs from "fs";
import path from "path";

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "avif", "gif", "svg"];

export async function POST(req: NextRequest) {
    try {
        await verifyAdmin();

        const formData = await req.formData();
        const chunk = formData.get("chunk") as File | null;
        const uploadId = formData.get("uploadId") as string | null;
        const chunkIndexStr = formData.get("chunkIndex") as string | null;
        const totalChunksStr = formData.get("totalChunks") as string | null;
        const fileName = formData.get("fileName") as string | null;
        const title = formData.get("title") as string | null;
        const category = formData.get("category") as string | null;

        if (!chunk || !uploadId || chunkIndexStr === null || totalChunksStr === null) {
            return NextResponse.json(
                { success: false, error: "Missing required upload parameters" },
                { status: 400 }
            );
        }

        const chunkIndex = parseInt(chunkIndexStr, 10);
        const totalChunks = parseInt(totalChunksStr, 10);

        if (isNaN(chunkIndex) || isNaN(totalChunks) || totalChunks <= 0 || chunkIndex < 0 || chunkIndex >= totalChunks) {
            return NextResponse.json(
                { success: false, error: "Invalid chunk indexing parameters" },
                { status: 400 }
            );
        }

        // Validate extension
        const rawExt = (fileName?.split(".").pop() || "jpg").toLowerCase();
        const extension = ALLOWED_EXTENSIONS.includes(rawExt) ? rawExt : "jpg";

        // Temporary directory for this upload session
        const tempDir = path.join(process.cwd(), "public", "uploads", "temp", uploadId.replace(/[^a-zA-Z0-9_-]/g, ""));
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Save chunk buffer
        const chunkBuffer = Buffer.from(await chunk.arrayBuffer());
        const chunkFilePath = path.join(tempDir, `chunk_${chunkIndex}`);
        fs.writeFileSync(chunkFilePath, chunkBuffer);

        // If not the last chunk, acknowledge chunk received
        if (chunkIndex < totalChunks - 1) {
            return NextResponse.json({
                success: true,
                isComplete: false,
                chunkIndex,
                totalChunks,
            });
        }

        // Final chunk received: verify all chunks exist and assemble
        for (let i = 0; i < totalChunks; i++) {
            const partPath = path.join(tempDir, `chunk_${i}`);
            if (!fs.existsSync(partPath)) {
                return NextResponse.json(
                    { success: false, error: `Missing chunk ${i} of ${totalChunks}. Please retry upload.` },
                    { status: 400 }
                );
            }
        }

        // Ensure covers upload directory exists
        const coversDir = path.join(process.cwd(), "public", "uploads", "covers");
        if (!fs.existsSync(coversDir)) {
            fs.mkdirSync(coversDir, { recursive: true });
        }

        const finalFilename = `cover-tpl-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${extension}`;
        const finalFilePath = path.join(coversDir, finalFilename);

        // Assemble chunks sequentially into final destination
        const writeStream = fs.createWriteStream(finalFilePath);
        for (let i = 0; i < totalChunks; i++) {
            const partPath = path.join(tempDir, `chunk_${i}`);
            const data = fs.readFileSync(partPath);
            writeStream.write(data);
        }
        await new Promise((resolve, reject) => {
            writeStream.end(resolve);
            writeStream.on("error", reject);
        });

        // Clean up temp chunk files
        try {
            for (let i = 0; i < totalChunks; i++) {
                const partPath = path.join(tempDir, `chunk_${i}`);
                if (fs.existsSync(partPath)) fs.unlinkSync(partPath);
            }
            if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir);
        } catch (cleanupErr) {
            console.warn("Failed to clean up temp chunk directory:", cleanupErr);
        }

        const imageUrl = `/uploads/covers/${finalFilename}`;
        const cleanTitle = title?.trim() || fileName?.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ") || "Cover Template";

        const template = await addCoverTemplate({
            title: cleanTitle,
            url: imageUrl,
            category: category?.trim() || "General",
        });

        return NextResponse.json({
            success: true,
            isComplete: true,
            template,
            message: "Template uploaded and assembled successfully!",
        });
    } catch (err: unknown) {
        console.error("Chunked upload error:", err);
        const msg = err instanceof Error ? err.message : "Chunk upload failed";
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}
