"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Image as ImageIcon, Link as LinkIcon, X, Loader2, ChevronLeft, ChevronRight, ZoomIn, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { compressImage } from "@/lib/compressImage";

interface Photo {
    id: string;
    url: string;
    createdAt: string;
    user?: { name: string; image?: string };
}

interface PhotoAlbumProps {
    eventId: string;
    isHost?: boolean;
    primaryColor?: string;
    allowGuestUpload?: boolean;
}

export default function PhotoAlbum({ eventId, isHost, primaryColor = "#7c3aed", allowGuestUpload = true }: PhotoAlbumProps) {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (eventId) {
            fetchPhotos();
        } else {
            setIsLoading(false);
        }
    }, [eventId]);

    // Keyboard nav for lightbox
    useEffect(() => {
        if (lightboxIndex === null) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight") setLightboxIndex(i => i !== null ? Math.min(i + 1, photos.length - 1) : null);
            if (e.key === "ArrowLeft") setLightboxIndex(i => i !== null ? Math.max(i - 1, 0) : null);
            if (e.key === "Escape") setLightboxIndex(null);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [lightboxIndex, photos.length]);

    const fetchPhotos = async () => {
        try {
            const res = await fetch(`/api/events/${eventId}/photos`);
            const data = await res.json();
            if (data.success) setPhotos(data.photos);
        } catch (error) {
            console.error("Failed to fetch photos", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setIsUploading(true);
        setShowOptions(false);
        try {
            for (let i = 0; i < files.length; i++) {
                let uploadFile = files[i];
                try {
                    uploadFile = await compressImage(files[i], { maxWidth: 1920, maxHeight: 1920 });
                } catch {
                    // compression failed — fall back to original
                }
                const formData = new FormData();
                formData.append("file", uploadFile);
                const res = await fetch(`/api/events/${eventId}/photos`, { method: "POST", body: formData });
                const data = await res.json();
                if (data.success) {
                    setPhotos(prev => [data.photo, ...prev]);
                } else {
                    toast.error(data.error || "Upload failed");
                }
            }
        } catch {
            toast.error("An error occurred during upload");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
            if (cameraInputRef.current) cameraInputRef.current.value = "";
        }
    };

    const copyAlbumLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            toast.success("Album link copied!");
        } catch {
            toast.error("Failed to copy link");
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">Photo Album</h3>
                    <p className="text-sm text-white/40 font-medium">
                        {photos.length} {photos.length === 1 ? "photo" : "photos"}
                    </p>
                </div>
                <button
                    onClick={copyAlbumLink}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white text-xs font-bold transition-all hover:bg-white/10"
                >
                    <LinkIcon className="w-3 h-3" />
                    Copy link
                </button>
            </div>

            {/* Masonry Grid */}
            {photos.length > 0 && (
                <div
                    className="columns-2 sm:columns-3 gap-3"
                    style={{ columnGap: "12px" }}
                >
                    {photos.map((photo, index) => (
                        <motion.div
                            key={photo.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: Math.min(index * 0.04, 0.4), type: "spring", stiffness: 300, damping: 28 }}
                            className="break-inside-avoid mb-3 rounded-2xl overflow-hidden bg-white/5 border border-white/10 relative group shadow-lg cursor-pointer"
                            onClick={() => setLightboxIndex(index)}
                            style={{ display: "inline-block", width: "100%" }}
                        >
                            <img
                                src={photo.url}
                                alt="Event photo"
                                className="w-full h-auto block transform group-hover:scale-[1.03] transition-transform duration-700"
                                loading="lazy"
                            />
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
                                <div className="flex justify-end">
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md bg-white/10 border border-white/20"
                                    >
                                        <ZoomIn className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                                {photo.user && (
                                    <p className="text-[10px] text-white/80 font-bold truncate">
                                        by {photo.user.name}
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Empty state */}
            {photos.length === 0 && !isUploading && (
                <div className="rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center py-16 gap-3">
                    <ImageIcon className="w-10 h-10 text-white/10" />
                    <p className="text-white/30 font-bold text-sm">No photos yet — be the first to share!</p>
                </div>
            )}

            {/* Hidden Inputs */}
            {(isHost || allowGuestUpload) && (
                <>
                    <input type="file" ref={fileInputRef} onChange={handleUpload} multiple accept="image/*" className="hidden" />
                    <input type="file" ref={cameraInputRef} onChange={handleUpload} accept="image/*" capture="environment" className="hidden" />
                </>
            )}

            {/* Add Photos */}
            {(isHost || allowGuestUpload) && (
            <div className="space-y-3">
                <AnimatePresence mode="wait">
                    {!showOptions ? (
                        <motion.button
                            key="add-btn"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowOptions(true)}
                            disabled={isUploading || !eventId}
                            className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl disabled:opacity-50 active:scale-[0.98]"
                            style={{ background: primaryColor, color: "#fff" }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                            {(!eventId) ? "Save event first to upload" : (isUploading ? "Uploading..." : "Add photos")}
                        </motion.button>
                    ) : (
                        <motion.div
                            key="options"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="grid grid-cols-2 gap-3"
                        >
                            {[
                                { icon: Camera, label: "Camera", ref: cameraInputRef },
                                { icon: ImageIcon, label: "Upload", ref: fileInputRef },
                            ].map(({ icon: Icon, label, ref }) => (
                                <motion.button
                                    key={label}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => ref.current?.click()}
                                    className="flex flex-col items-center justify-center gap-2 p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group"
                                >
                                    <Icon className="w-6 h-6 text-white/40 group-hover:text-white transition-colors" />
                                    <span className="text-sm font-bold text-white/60 group-hover:text-white">{label}</span>
                                </motion.button>
                            ))}
                            <button
                                onClick={() => setShowOptions(false)}
                                className="col-span-2 py-2 text-xs font-bold text-white/30 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            )}

            {/* Lightbox */}
            <AnimatePresence>
                {lightboxIndex !== null && (
                    <Lightbox
                        photos={photos}
                        index={lightboxIndex}
                        primaryColor={primaryColor}
                        onClose={() => setLightboxIndex(null)}
                        onPrev={() => setLightboxIndex(i => i !== null ? Math.max(i - 1, 0) : null)}
                        onNext={() => setLightboxIndex(i => i !== null ? Math.min(i + 1, photos.length - 1) : null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Lightbox ────────────────────────────────────────────────────────────────

function Lightbox({
    photos,
    index,
    primaryColor,
    onClose,
    onPrev,
    onNext,
}: {
    photos: Photo[];
    index: number;
    primaryColor: string;
    onClose: () => void;
    onPrev: () => void;
    onNext: () => void;
}) {
    const photo = photos[index];
    const hasPrev = index > 0;
    const hasNext = index < photos.length - 1;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[300] flex items-center justify-center"
            onClick={onClose}
            style={{
                background: "rgba(0,0,0,0.92)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
            }}
        >
            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10">
                <div className="flex items-center gap-3">
                    {photo.user && (
                        <>
                            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 overflow-hidden flex-shrink-0">
                                {photo.user.image ? (
                                    <img src={photo.user.image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
                                        {photo.user.name[0]}
                                    </div>
                                )}
                            </div>
                            <span className="text-sm font-bold text-white/70">{photo.user.name}</span>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-white/40 font-bold">{index + 1} / {photos.length}</span>
                    <a
                        href={photo.url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                        <Download className="w-4 h-4 text-white/70" />
                    </a>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={onClose}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </motion.button>
                </div>
            </div>

            {/* Image */}
            <AnimatePresence mode="wait">
                <motion.img
                    key={photo.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    src={photo.url}
                    alt="Photo"
                    className="max-w-[90vw] max-h-[80vh] object-contain rounded-2xl shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)]"
                    onClick={e => e.stopPropagation()}
                    style={{ border: `1px solid rgba(255,255,255,0.08)` }}
                />
            </AnimatePresence>

            {/* Prev / Next */}
            {hasPrev && (
                <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={e => { e.stopPropagation(); onPrev(); }}
                    className="absolute left-4 p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/60 transition-all"
                >
                    <ChevronLeft className="w-5 h-5 text-white" />
                </motion.button>
            )}
            {hasNext && (
                <motion.button
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={e => { e.stopPropagation(); onNext(); }}
                    className="absolute right-4 p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/60 transition-all"
                >
                    <ChevronRight className="w-5 h-5 text-white" />
                </motion.button>
            )}

            {/* Thumbnail strip */}
            {photos.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                    {photos.slice(Math.max(0, index - 3), Math.min(photos.length, index + 4)).map((p, relI) => {
                        const absI = Math.max(0, index - 3) + relI;
                        return (
                            <motion.button
                                key={p.id}
                                whileTap={{ scale: 0.9 }}
                                onClick={e => { e.stopPropagation(); /* jump */ }}
                                className="rounded-lg overflow-hidden flex-shrink-0 transition-all"
                                style={{
                                    width: absI === index ? 40 : 28,
                                    height: absI === index ? 40 : 28,
                                    outline: absI === index ? `2px solid ${primaryColor}` : "none",
                                    outlineOffset: "2px",
                                    opacity: absI === index ? 1 : 0.5,
                                }}
                            >
                                <img src={p.url} alt="" className="w-full h-full object-cover" />
                            </motion.button>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );
}
