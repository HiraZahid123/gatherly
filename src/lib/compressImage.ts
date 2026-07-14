const TARGET_BYTES = 200 * 1024; // 200 KB

interface CompressOptions {
    maxWidth?: number;
    maxHeight?: number;
    targetBytes?: number;
}

/**
 * Compresses an image file client-side using Canvas + JPEG encoding.
 * Skips GIFs (animation would be lost). Returns the original file unchanged
 * if it is already within the target size.
 */
export async function compressImage(file: File, options: CompressOptions = {}): Promise<File> {
    const {
        maxWidth = 1920,
        maxHeight = 1920,
        targetBytes = TARGET_BYTES,
    } = options;

    // GIF compression via canvas discards animation — skip
    if (file.type === "image/gif") return file;

    // Already within budget
    if (file.size <= targetBytes) return file;

    // createImageBitmap is available in all supported browsers
    const bitmap = await createImageBitmap(file);

    let { width, height } = bitmap;
    const scale = Math.min(maxWidth / width, maxHeight / height, 1);
    width = Math.round(width * scale);
    height = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    let quality = 0.85;
    let blob: Blob | null = null;

    while (quality >= 0.25) {
        blob = await new Promise<Blob | null>(resolve =>
            canvas.toBlob(resolve, "image/jpeg", quality)
        );
        if (blob && blob.size <= targetBytes) break;
        quality = parseFloat((quality - 0.1).toFixed(2));
    }

    if (!blob) throw new Error("Image compression failed");

    const name = file.name.replace(/\.[^.]+$/, ".jpg");
    return new File([blob], name, { type: "image/jpeg" });
}
