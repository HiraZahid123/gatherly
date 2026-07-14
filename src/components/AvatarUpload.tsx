"use client";

import { useState, useRef } from "react";
import { compressImage } from "@/lib/compressImage";

interface AvatarUploadProps {
    currentImage?: string | null;
    onImageChange: (imageUrl: string) => void;
    onFileSelect?: (file: File) => void;
    isLoading?: boolean;
}

export default function AvatarUpload({ currentImage, onImageChange, onFileSelect, isLoading }: AvatarUploadProps) {
    const [preview, setPreview] = useState<string | null>(currentImage || null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError("");

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            setError("Only JPEG, PNG, and WebP images are allowed");
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError("File size must be less than 5MB");
            return;
        }

        // Compress before preview + upload
        let compressed = file;
        try {
            compressed = await compressImage(file, { maxWidth: 512, maxHeight: 512 });
        } catch {
            // compression failed — fall back to original
        }

        // Show preview of compressed file
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(compressed);

        // Upload file
        if (onFileSelect) {
            onFileSelect(compressed);
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", compressed);

            const response = await fetch("/api/upload/avatar", {
                method: "POST",
                body: formData,
            });
            // ... (keep existing upload logic)
            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Upload failed");
                setPreview(currentImage || null);
                return;
            }

            onImageChange(data.imageUrl);
        } catch (error) {
            setError("An error occurred while uploading");
            setPreview(currentImage || null);
        } finally {
            setUploading(false);
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleRemove = () => {
        setPreview(null);
        onImageChange("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="flex flex-col items-center">
            {/* Avatar Preview */}
            <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100 flex items-center justify-center">
                    {preview ? (
                        <img src={preview} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                        <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                    )}
                </div>

                {/* Upload Overlay */}
                {uploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                )}
            </div>

            {/* Upload/Change Button */}
            <div className="mt-4 flex gap-2">
                <button
                    type="button"
                    onClick={handleClick}
                    disabled={uploading || isLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {preview ? "Change Avatar" : "Upload Avatar"}
                </button>

                {preview && (
                    <button
                        type="button"
                        onClick={handleRemove}
                        disabled={uploading || isLoading}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Remove
                    </button>
                )}
            </div>

            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
                title="Upload avatar"
            />

            {/* Error Message */}
            {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
            )}

            {/* Helper Text */}
            <p className="mt-2 text-xs text-gray-500 text-center">
                JPEG, PNG, or WebP · Max 5MB · Auto-compressed to ~200 KB
            </p>
        </div>
    );
}
