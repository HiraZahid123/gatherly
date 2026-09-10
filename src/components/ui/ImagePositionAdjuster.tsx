"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    ZoomIn,
    ZoomOut,
    RotateCcw,
    Move,
    Check,
    X,
    AlignVerticalJustifyStart,
    AlignVerticalJustifyCenter,
    AlignVerticalJustifyEnd,
    Maximize2,
    Eye,
    CreditCard,
    Calendar,
} from "lucide-react";

interface ImagePositionAdjusterProps {
    file: File;
    onConfirm: (croppedFile: File, previewUrl: string) => void;
    onCancel: () => void;
    aspectRatio?: number; // default 1 (square)
    targetSize?: number; // export width/height in px, default 1080
}

export default function ImagePositionAdjuster({
    file,
    onConfirm,
    onCancel,
    aspectRatio = 1,
    targetSize = 1080,
}: ImagePositionAdjusterProps) {
    const [imageSrc, setImageSrc] = useState<string>("");
    const [imgNaturalSize, setImgNaturalSize] = useState<{ width: number; height: number }>({ width: 1, height: 1 });

    // Transform states: zoom and offset (in % relative to viewport)
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

    // Preview mode: "crop" (interactive editor) | "card" (envelope preview) | "event" (event card preview)
    const [previewMode, setPreviewMode] = useState<"crop" | "card" | "event">("crop");
    const [isExporting, setIsExporting] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    // Load file as object URL
    useEffect(() => {
        const url = URL.createObjectURL(file);
        setImageSrc(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { naturalWidth, naturalHeight } = e.currentTarget;
        setImgNaturalSize({ width: naturalWidth, height: naturalHeight });
        // Initial setup: fit nicely
        setScale(1);
        setOffset({ x: 0, y: 0 });
    };

    // Drag handlers (mouse & touch)
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    };

    const handleMouseMove = useCallback(
        (e: React.MouseEvent) => {
            if (!isDragging) return;
            setOffset({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y,
            });
        },
        [isDragging, dragStart]
    );

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            setIsDragging(true);
            setDragStart({
                x: e.touches[0].clientX - offset.x,
                y: e.touches[0].clientY - offset.y,
            });
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging || e.touches.length !== 1) return;
        setOffset({
            x: e.touches[0].clientX - dragStart.x,
            y: e.touches[0].clientY - dragStart.y,
        });
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    // Wheel zoom
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY * -0.0015;
        setScale((prev) => Math.min(Math.max(0.7, prev + delta), 3.5));
    };

    // Quick alignment presets
    const alignTop = () => {
        if (!containerRef.current || !imageRef.current) return;
        const containerH = containerRef.current.clientHeight;
        const imgH = imageRef.current.clientHeight * scale;
        // Align top of image with top of container
        const diff = (imgH - containerH) / 2;
        setOffset((prev) => ({ ...prev, y: diff }));
    };

    const alignCenter = () => {
        setOffset({ x: 0, y: 0 });
    };

    const alignBottom = () => {
        if (!containerRef.current || !imageRef.current) return;
        const containerH = containerRef.current.clientHeight;
        const imgH = imageRef.current.clientHeight * scale;
        const diff = (imgH - containerH) / 2;
        setOffset((prev) => ({ ...prev, y: -diff }));
    };

    const fitToFrame = () => {
        setScale(1);
        setOffset({ x: 0, y: 0 });
    };

    // Export cropped canvas
    const handleApply = async () => {
        if (!imageRef.current || !containerRef.current) return;
        setIsExporting(true);

        try {
            const containerRect = containerRef.current.getBoundingClientRect();
            const imgRect = imageRef.current.getBoundingClientRect();

            const canvas = document.createElement("canvas");
            canvas.width = targetSize;
            canvas.height = Math.round(targetSize / aspectRatio);
            const ctx = canvas.getContext("2d");

            if (!ctx) throw new Error("Could not get canvas 2D context");

            // Fill background with white/black in case of transparent borders
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Calculate ratio between canvas target and rendered viewport
            const renderScale = canvas.width / containerRect.width;

            // Image position relative to container
            const relativeX = (imgRect.left - containerRect.left) * renderScale;
            const relativeY = (imgRect.top - containerRect.top) * renderScale;
            const drawWidth = imgRect.width * renderScale;
            const drawHeight = imgRect.height * renderScale;

            // Load HTMLImageElement for canvas drawing
            const imgElement = new window.Image();
            imgElement.crossOrigin = "anonymous";
            imgElement.src = imageSrc;

            await new Promise((resolve, reject) => {
                imgElement.onload = resolve;
                imgElement.onerror = reject;
            });

            ctx.drawImage(imgElement, relativeX, relativeY, drawWidth, drawHeight);

            // Convert to Blob & File
            const blob = await new Promise<Blob | null>((resolve) =>
                canvas.toBlob(resolve, "image/jpeg", 0.92)
            );

            if (!blob) throw new Error("Failed to generate image blob");

            const cleanFileName = file.name.replace(/\.[^/.]+$/, "") + "-adjusted.jpg";
            const adjustedFile = new File([blob], cleanFileName, { type: "image/jpeg" });
            const adjustedUrl = URL.createObjectURL(blob);

            onConfirm(adjustedFile, adjustedUrl);
        } catch (err) {
            console.error("Cropping error:", err);
            // Fallback to original file
            onConfirm(file, imageSrc);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 md:p-10 bg-black/85 backdrop-blur-2xl animate-in fade-in">
            <div className="relative w-full max-w-lg bg-[#0f0f11] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[88vh] overflow-y-auto scrollbar-none">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <div>
                        <h3 className="text-lg font-black text-white flex items-center gap-2">
                            <Move className="w-5 h-5 text-emerald-400" />
                            Adjust & Position Cover
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Scroll or drag to position your cover photo so no text or graphics are cut off.
                        </p>
                    </div>
                    <button
                        onClick={onCancel}
                        disabled={isExporting}
                        className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* View Mode Switcher (Editor vs Card vs Event) */}
                <div className="flex items-center gap-2 mt-4 p-1 bg-white/5 rounded-2xl border border-white/5 self-center">
                    <button
                        onClick={() => setPreviewMode("crop")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            previewMode === "crop" ? "bg-white text-black shadow-md" : "text-gray-400 hover:text-white"
                        }`}
                    >
                        <Move className="w-3.5 h-3.5" />
                        Adjust Position
                    </button>
                    <button
                        onClick={() => setPreviewMode("card")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            previewMode === "card" ? "bg-white text-black shadow-md" : "text-gray-400 hover:text-white"
                        }`}
                    >
                        <CreditCard className="w-3.5 h-3.5" />
                        Card Preview
                    </button>
                    <button
                        onClick={() => setPreviewMode("event")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            previewMode === "event" ? "bg-white text-black shadow-md" : "text-gray-400 hover:text-white"
                        }`}
                    >
                        <Calendar className="w-3.5 h-3.5" />
                        Event Preview
                    </button>
                </div>

                {/* Main Interactive Stage */}
                <div className="my-4 flex flex-col items-center justify-center">
                    {previewMode === "crop" && (
                        <div className="relative flex flex-col items-center">
                            {/* Viewport Frame */}
                            <div
                                ref={containerRef}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                                onWheel={handleWheel}
                                className={`relative w-[260px] h-[260px] sm:w-[290px] sm:h-[290px] rounded-2xl overflow-hidden border-2 border-dashed border-emerald-500/60 bg-black shadow-2xl select-none cursor-grab active:cursor-grabbing flex items-center justify-center ${
                                    isDragging ? "cursor-grabbing border-emerald-400" : ""
                                }`}
                            >
                                {imageSrc && (
                                    <img
                                        ref={imageRef}
                                        src={imageSrc}
                                        alt="Adjusting"
                                        draggable={false}
                                        onLoad={handleImageLoad}
                                        style={{
                                            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                                            transition: isDragging ? "none" : "transform 0.1s ease-out",
                                            maxWidth: "100%",
                                            maxHeight: "100%",
                                        }}
                                        className="pointer-events-none select-none origin-center"
                                    />
                                )}

                                {/* Overlay Guide */}
                                <div className="absolute inset-0 pointer-events-none border border-white/20 rounded-2xl">
                                    {/* Center Crosshair / Grid hints */}
                                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-b border-white/15" />
                                    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 border-r border-white/15" />
                                </div>

                                {/* Drag Hint Pill */}
                                <div className="absolute bottom-3 bg-black/75 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white/80 border border-white/10 pointer-events-none flex items-center gap-1.5">
                                    <Move className="w-3 h-3 text-emerald-400" />
                                    Drag to reposition & scroll
                                </div>
                            </div>

                            {/* Quick Align Bar */}
                            <div className="flex items-center gap-2 mt-3 text-xs">
                                <span className="text-gray-500 font-bold text-[10px] uppercase tracking-wider">Quick Align:</span>
                                <button
                                    type="button"
                                    onClick={alignTop}
                                    title="Align Top (Shows top text)"
                                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg border border-white/10 text-xs font-semibold flex items-center gap-1"
                                >
                                    <AlignVerticalJustifyStart className="w-3.5 h-3.5 text-emerald-400" />
                                    Top
                                </button>
                                <button
                                    type="button"
                                    onClick={alignCenter}
                                    title="Center"
                                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg border border-white/10 text-xs font-semibold flex items-center gap-1"
                                >
                                    <AlignVerticalJustifyCenter className="w-3.5 h-3.5" />
                                    Center
                                </button>
                                <button
                                    type="button"
                                    onClick={alignBottom}
                                    title="Align Bottom"
                                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg border border-white/10 text-xs font-semibold flex items-center gap-1"
                                >
                                    <AlignVerticalJustifyEnd className="w-3.5 h-3.5" />
                                    Bottom
                                </button>
                                <button
                                    type="button"
                                    onClick={fitToFrame}
                                    title="Reset"
                                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg border border-white/10 text-xs font-semibold flex items-center gap-1"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Reset
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Live Card Envelope Simulation */}
                    {previewMode === "card" && (
                        <div className="relative w-[320px] h-[340px] flex items-center justify-center bg-black/60 rounded-2xl border border-white/10 p-4 overflow-hidden">
                            {/* Card sticking out */}
                            <div className="relative w-[210px] h-[210px] rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-white -rotate-6 transform -translate-y-8 z-10">
                                {imageSrc && (
                                    <img
                                        src={imageSrc}
                                        alt="Card Preview"
                                        style={{
                                            transform: `translate(${offset.x * 0.7}px, ${offset.y * 0.7}px) scale(${scale})`,
                                            maxWidth: "100%",
                                            maxHeight: "100%",
                                        }}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>
                            {/* Envelope front flap mock */}
                            <div className="absolute bottom-2 inset-x-8 h-32 bg-amber-100/90 rounded-b-2xl border-t border-black/10 shadow-xl flex items-center justify-center text-xs font-black text-amber-950/60 uppercase tracking-widest z-20">
                                ✉️ Envelope Pocket
                            </div>
                        </div>
                    )}

                    {/* Live Event Card Simulation */}
                    {previewMode === "event" && (
                        <div className="relative w-[320px] h-[340px] rounded-2xl overflow-hidden border border-white/10 bg-[#1e1e24] shadow-2xl flex flex-col justify-end p-5">
                            {imageSrc && (
                                <img
                                    src={imageSrc}
                                    alt="Event Preview"
                                    style={{
                                        transform: `translate(${offset.x * 0.7}px, ${offset.y * 0.7}px) scale(${scale})`,
                                    }}
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                            <div className="relative z-10 text-white">
                                <span className="px-2.5 py-0.5 bg-emerald-500/80 rounded-full text-[10px] font-black uppercase tracking-wider">
                                    Preview
                                </span>
                                <h4 className="text-xl font-black mt-2 leading-tight">Sample Event Title</h4>
                                <p className="text-xs text-white/70 mt-0.5">Saturday · 8:00 PM</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Controls Bar: Zoom Slider */}
                <div className="flex items-center gap-4 px-4 py-3 bg-[#18181b] rounded-2xl border border-white/5">
                    <button
                        type="button"
                        onClick={() => setScale((prev) => Math.max(0.7, prev - 0.1))}
                        className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5"
                        title="Zoom Out"
                    >
                        <ZoomOut className="w-4 h-4" />
                    </button>
                    <input
                        type="range"
                        min="0.7"
                        max="3.0"
                        step="0.02"
                        value={scale}
                        onChange={(e) => setScale(parseFloat(e.target.value))}
                        className="flex-1 accent-emerald-400 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                    />
                    <button
                        type="button"
                        onClick={() => setScale((prev) => Math.min(3.0, prev + 0.1))}
                        className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5"
                        title="Zoom In"
                    >
                        <ZoomIn className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono text-gray-400 w-12 text-right">
                        {Math.round(scale * 100)}%
                    </span>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                    <button
                        onClick={onCancel}
                        disabled={isExporting}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleApply}
                        disabled={isExporting}
                        className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/25"
                    >
                        <Check className="w-4 h-4" />
                        {isExporting ? "Processing..." : "Use Adjusted Image"}
                    </button>
                </div>
            </div>
        </div>
    );
}
