"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
    Upload,
    Trash2,
    Search,
    RefreshCw,
    SlidersHorizontal,
    ImageIcon,
    CheckCircle2,
    AlertCircle,
    Loader2,
    X,
    Eye,
    Plus,
    Sparkles,
    Move,
} from "lucide-react";
import { CoverTemplateItem } from "@/lib/coverTemplates";
import ImagePositionAdjuster from "@/components/ui/ImagePositionAdjuster";

const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB per chunk

const CATEGORIES = [
    "All",
    "Party",
    "Birthday",
    "Dinner",
    "Night Out",
    "Wedding",
    "Celebration",
    "Music",
    "Sports",
    "Formal",
    "Hangout",
    "Watch Party",
    "Zodiac",
    "Other",
];

export default function CoverTemplatesModule() {
    const [templates, setTemplates] = useState<CoverTemplateItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    // Upload state
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [customTitle, setCustomTitle] = useState("");
    const [customCategory, setCustomCategory] = useState("Party");
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [currentChunk, setCurrentChunk] = useState(0);
    const [totalChunks, setTotalChunks] = useState(0);
    const [uploadStatusText, setUploadStatusText] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Interactive Image Position & Cropper state
    const [showAdjuster, setShowAdjuster] = useState(false);
    const [rawFileForAdjuster, setRawFileForAdjuster] = useState<File | null>(null);

    // Delete confirmation modal state
    const [deleteTarget, setDeleteTarget] = useState<CoverTemplateItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Preview modal state
    const [previewImage, setPreviewImage] = useState<CoverTemplateItem | null>(null);

    // Notifications
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [isSeeding, setIsSeeding] = useState(false);

    const showToast = (type: "success" | "error", text: string) => {
        setFeedback({ type, text });
        setTimeout(() => setFeedback(null), 4000);
    };

    const fetchTemplates = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/admin/cover-templates");
            const data = await res.json();
            if (data.success) {
                setTemplates(data.templates);
            } else {
                showToast("error", data.error || "Failed to load cover templates");
            }
        } catch {
            showToast("error", "Network error loading cover templates");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        setCustomTitle(cleanName);
        setRawFileForAdjuster(file);
        setShowAdjuster(true);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            showToast("error", "Please upload a valid image file");
            return;
        }

        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        setCustomTitle(cleanName);
        setRawFileForAdjuster(file);
        setShowAdjuster(true);
    };

    const handleAdjusterConfirm = (adjustedFile: File, previewUrl: string) => {
        setSelectedFile(adjustedFile);
        setFilePreview(previewUrl);
        setShowAdjuster(false);
    };

    const resetUploadForm = () => {
        setSelectedFile(null);
        setFilePreview(null);
        setRawFileForAdjuster(null);
        setShowAdjuster(false);
        setCustomTitle("");
        setCustomCategory("Party");
        setIsUploading(false);
        setUploadProgress(0);
        setCurrentChunk(0);
        setTotalChunks(0);
        setUploadStatusText("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleChunkedUpload = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        setUploadProgress(0);
        setUploadStatusText("Initializing chunked upload...");

        const file = selectedFile;
        const total = Math.ceil(file.size / CHUNK_SIZE);
        setTotalChunks(total);

        const uploadId = `cov_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        try {
            for (let i = 0; i < total; i++) {
                setCurrentChunk(i + 1);
                const start = i * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, file.size);
                const chunkBlob = file.slice(start, end);

                setUploadStatusText(`Uploading chunk ${i + 1} of ${total}...`);

                const formData = new FormData();
                formData.append("chunk", chunkBlob, file.name);
                formData.append("uploadId", uploadId);
                formData.append("chunkIndex", i.toString());
                formData.append("totalChunks", total.toString());
                formData.append("fileName", file.name);
                formData.append("title", customTitle.trim() || file.name);
                formData.append("category", customCategory);

                const response = await fetch("/api/admin/cover-templates/upload-chunk", {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    let errMsg = "Upload failed";
                    try {
                        const parsed = JSON.parse(errorText);
                        errMsg = parsed.error || errMsg;
                    } catch {
                        errMsg = errorText;
                    }
                    throw new Error(errMsg);
                }

                const result = await response.json();
                if (!result.success) {
                    throw new Error(result.error || "Chunk upload failed");
                }

                const pct = Math.round(((i + 1) / total) * 100);
                setUploadProgress(pct);

                if (result.isComplete && result.template) {
                    setUploadStatusText("Finalizing and optimizing template...");
                    setTemplates((prev) => [result.template, ...prev]);
                    showToast("success", `Cover template "${result.template.title}" uploaded successfully!`);
                    setShowUploadModal(false);
                    resetUploadForm();
                    return;
                }
            }
        } catch (err: unknown) {
            console.error("Upload error:", err);
            const msg = err instanceof Error ? err.message : "An error occurred during upload.";
            showToast("error", msg);
        } finally {
            setIsUploading(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);

        try {
            const res = await fetch(`/api/admin/cover-templates/${deleteTarget.id}`, {
                method: "DELETE",
            });
            const data = await res.json();

            if (data.success) {
                setTemplates((prev) => prev.filter((t) => t.id !== deleteTarget.id));
                showToast("success", `Deleted template "${deleteTarget.title}"`);
                setDeleteTarget(null);
            } else {
                showToast("error", data.error || "Failed to delete template");
            }
        } catch {
            showToast("error", "Error communicating with server");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSeedDefaults = async () => {
        if (!confirm("This will reset/populate the cover templates library with the curated default presets. Continue?")) {
            return;
        }

        setIsSeeding(true);
        try {
            const res = await fetch("/api/admin/cover-templates/seed", { method: "POST" });
            const data = await res.json();
            if (data.success) {
                showToast("success", data.message || "Seeded default cover templates!");
                fetchTemplates();
            } else {
                showToast("error", data.error || "Failed to seed default templates");
            }
        } catch {
            showToast("error", "Failed to seed default templates");
        } finally {
            setIsSeeding(false);
        }
    };

    const filteredTemplates = templates.filter((t) => {
        const matchesSearch =
            t.title.toLowerCase().includes(search.toLowerCase()) ||
            t.category.toLowerCase().includes(search.toLowerCase());
        const matchesCategory =
            selectedCategory === "All" ||
            t.category.toLowerCase() === selectedCategory.toLowerCase();
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-8">
            {/* Header & Stats Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
                        <ImageIcon className="w-7 h-7 text-emerald-400" />
                        Cover Image Templates
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                        Manage cover photos, posters, and themes available to users in the event creator modal.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSeedDefaults}
                        disabled={isSeeding}
                        className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-white/5 hover:bg-white/10 text-emerald-400 border border-emerald-500/20 transition-all flex items-center gap-2"
                        title="Populate or restore default Partiful presets"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? "animate-spin" : ""}`} />
                        {isSeeding ? "Seeding..." : "Reset Defaults"}
                    </button>
                    <button
                        onClick={() => {
                            resetUploadForm();
                            setShowUploadModal(true);
                        }}
                        className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Upload Template
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#111113] border border-white/5 rounded-3xl p-6">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Cover Templates</span>
                    <div className="text-3xl font-black text-white mt-1">{templates.length}</div>
                </div>
                <div className="bg-[#111113] border border-white/5 rounded-3xl p-6">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" /> Custom Uploads
                    </span>
                    <div className="text-3xl font-black text-emerald-400 mt-1">
                        {templates.filter((t) => t.isCustom).length}
                    </div>
                </div>
                <div className="bg-[#111113] border border-white/5 rounded-3xl p-6">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Active Categories</span>
                    <div className="text-3xl font-black text-white mt-1">
                        {new Set(templates.map((t) => t.category)).size}
                    </div>
                </div>
            </div>

            {/* Feedback Alert */}
            {feedback && (
                <div
                    className={`p-4 rounded-2xl text-sm font-medium border animate-in fade-in duration-200 flex items-center gap-3 ${feedback.type === "success"
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                            : "bg-red-500/10 border-red-500/30 text-red-400"
                        }`}
                >
                    {feedback.type === "success" ? (
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    ) : (
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    )}
                    <span>{feedback.text}</span>
                </div>
            )}

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#111113] border border-white/5 p-4 rounded-3xl">
                <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search cover images..."
                        className="w-full bg-[#18181b] border border-white/10 rounded-2xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
                    <SlidersHorizontal className="w-4 h-4 text-gray-400 flex-shrink-0 ml-1 mr-1" />
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${selectedCategory === cat
                                    ? "bg-white text-black shadow-md"
                                    : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Gallery Grid */}
            {isLoading ? (
                <div className="py-24 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-500 mx-auto mb-4" />
                    <p className="text-gray-400 text-sm">Loading cover templates...</p>
                </div>
            ) : filteredTemplates.length === 0 ? (
                <div className="py-20 text-center bg-[#111113] border border-white/5 rounded-3xl p-8">
                    <ImageIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No templates found</h3>
                    <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
                        {templates.length === 0
                            ? "No cover templates currently in library. Click 'Reset Defaults' to populate curated themes."
                            : "No cover templates matched your search criteria."}
                    </p>
                    {templates.length === 0 && (
                        <button
                            onClick={handleSeedDefaults}
                            disabled={isSeeding}
                            className="px-6 py-3 rounded-2xl text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-all inline-flex items-center gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${isSeeding ? "animate-spin" : ""}`} />
                            Populate Default Templates
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {filteredTemplates.map((template) => (
                        <div
                            key={template.id}
                            className="group relative aspect-square rounded-2xl overflow-hidden border border-white/10 bg-black/40 hover:border-emerald-500/50 transition-all duration-300 shadow-lg hover:shadow-emerald-500/10"
                        >
                            <Image
                                src={template.url}
                                alt={template.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                unoptimized
                            />

                            {/* Top Badges */}
                            <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
                                <span className="px-2 py-0.5 bg-black/80 backdrop-blur-md rounded-md text-[10px] font-bold text-white/90 border border-white/10">
                                    {template.category}
                                </span>
                                {template.isCustom && (
                                    <span className="px-1.5 py-0.5 bg-emerald-500/30 backdrop-blur-md border border-emerald-500/40 text-emerald-300 rounded text-[9px] font-bold">
                                        Custom
                                    </span>
                                )}
                            </div>

                            {/* Hover Actions Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3 z-10">
                                <div className="flex justify-end gap-1.5 pt-1">
                                    <button
                                        onClick={() => setPreviewImage(template)}
                                        title="View Preview"
                                        className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-md transition-colors"
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => setDeleteTarget(template)}
                                        title="Delete Template"
                                        className="p-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-lg backdrop-blur-md transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <div>
                                    <p className="text-white text-xs font-bold truncate">{template.title}</p>
                                    <p className="text-[10px] text-gray-400 truncate">{template.category}</p>
                                </div>
                            </div>

                            {/* Default bottom title label (visible when not hovered) */}
                            <div className="absolute bottom-0 inset-x-0 bg-black/70 backdrop-blur-sm px-2.5 py-1.5 border-t border-white/5 group-hover:opacity-0 transition-opacity">
                                <p className="text-[11px] font-bold text-white/90 truncate">{template.title}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Modal with Chunking & Loader */}
            {showUploadModal && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 md:p-10">
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-in fade-in"
                        onClick={() => !isUploading && setShowUploadModal(false)}
                    />

                    <div className="relative w-full max-w-md max-h-[88vh] overflow-y-auto bg-[#111113] border border-white/10 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 scrollbar-none">
                        <div className="flex items-center justify-between pb-4 border-b border-white/5">
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Upload className="w-5 h-5 text-emerald-400" />
                                    Upload Cover Template
                                </h3>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Large images are automatically uploaded in chunks to prevent errors.
                                </p>
                            </div>
                            {!isUploading && (
                                <button
                                    onClick={() => setShowUploadModal(false)}
                                    className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        <div className="space-y-4 pt-4">
                            {/* Drag and Drop Zone */}
                            {!filePreview ? (
                                <div
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-white/15 hover:border-emerald-500/50 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-white/[0.02] hover:bg-white/[0.04]"
                                >
                                    <Upload className="w-8 h-8 text-emerald-400/80 mx-auto mb-3" />
                                    <p className="text-sm font-bold text-white">Click or drag image here to upload</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Supports JPG, PNG, WebP, AVIF (No size limit — chunked upload)
                                    </p>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Preview Thumbnail */}
                                    <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black/60">
                                        <Image
                                            src={filePreview}
                                            alt="Preview"
                                            fill
                                            className="object-contain"
                                        />
                                        {!isUploading && (
                                            <button
                                                onClick={resetUploadForm}
                                                className="absolute top-2 right-2 p-1.5 bg-black/80 hover:bg-black text-white rounded-lg border border-white/10"
                                                title="Change File"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    {!isUploading && (
                                        <button
                                            type="button"
                                            onClick={() => setShowAdjuster(true)}
                                            className="w-full py-2 bg-white/5 hover:bg-white/10 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                                        >
                                            <Move className="w-3.5 h-3.5" />
                                            Reposition & Scroll Cover
                                        </button>
                                    )}

                                    {/* File details info */}
                                    {selectedFile && (
                                        <div className="text-[11px] text-gray-400 flex items-center justify-between px-1">
                                            <span className="truncate max-w-[250px] font-mono">{selectedFile.name}</span>
                                            <span className="font-bold">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                                        </div>
                                    )}

                                    {/* Title and Category inputs */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-bold text-gray-300 mb-1 block">Template Title</label>
                                            <input
                                                type="text"
                                                value={customTitle}
                                                disabled={isUploading}
                                                onChange={(e) => setCustomTitle(e.target.value)}
                                                placeholder="e.g. Summer Sunset Vibe"
                                                className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-300 mb-1 block">Category</label>
                                            <select
                                                value={customCategory}
                                                disabled={isUploading}
                                                onChange={(e) => setCustomCategory(e.target.value)}
                                                className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
                                            >
                                                {CATEGORIES.filter((c) => c !== "All").map((cat) => (
                                                    <option key={cat} value={cat}>
                                                        {cat}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Rich Chunk Progress Loader */}
                            {isUploading && (
                                <div className="space-y-3 bg-[#18181b] border border-emerald-500/30 rounded-2xl p-4">
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2 text-emerald-400 font-bold">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>{uploadStatusText}</span>
                                        </div>
                                        <span className="font-mono text-emerald-400 font-black">{uploadProgress}%</span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/10">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-300 transition-all duration-300 ease-out rounded-full shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                                        <span>
                                            Chunk {currentChunk} of {totalChunks}
                                        </span>
                                        <span>Safe 1MB Chunks</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/5">
                            {!isUploading && (
                                <button
                                    onClick={() => setShowUploadModal(false)}
                                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                onClick={handleChunkedUpload}
                                disabled={!selectedFile || isUploading}
                                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Uploading Chunks...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4" />
                                        Upload & Save Template
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 z-[160] flex items-center justify-center p-6 md:p-10">
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-in fade-in"
                        onClick={() => !isDeleting && setDeleteTarget(null)}
                    />

                    <div className="relative w-full max-w-sm bg-[#111113] border border-white/10 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="text-center">
                            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-white">Delete Cover Template?</h3>
                            <p className="text-xs text-gray-400 mt-2">
                                Are you sure you want to delete <b className="text-white">"{deleteTarget.title}"</b>? It
                                will immediately be removed from the "Choose Cover Image" gallery for all users.
                            </p>
                        </div>

                        <div className="flex justify-center gap-3 mt-6">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                disabled={isDeleting}
                                className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="px-5 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    "Yes, Delete Template"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {previewImage && (
                <div className="fixed inset-0 z-[160] flex items-center justify-center p-6 md:p-10">
                    <div
                        className="absolute inset-0 bg-black/90 backdrop-blur-2xl animate-in fade-in"
                        onClick={() => setPreviewImage(null)}
                    />

                    <div className="relative max-w-sm w-full bg-[#111113] border border-white/15 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        {/* Top-right quick close button */}
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute top-3 right-3 z-20 p-2 bg-black/70 hover:bg-black text-white/80 hover:text-white rounded-full border border-white/10 backdrop-blur-md transition-colors"
                            title="Close"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="relative aspect-square w-full bg-black/40">
                            <Image
                                src={previewImage.url}
                                alt={previewImage.title}
                                fill
                                className="object-cover"
                                unoptimized
                            />
                        </div>
                        <div className="p-4 flex items-center justify-between bg-[#18181b] border-t border-white/10">
                            <div>
                                <h4 className="text-sm font-bold text-white">{previewImage.title}</h4>
                                <span className="text-[11px] text-gray-400">{previewImage.category}</span>
                            </div>
                            <button
                                onClick={() => setPreviewImage(null)}
                                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Interactive Image Cropper & Scroller Modal */}
            {showAdjuster && (rawFileForAdjuster || selectedFile) && (
                <ImagePositionAdjuster
                    file={rawFileForAdjuster || selectedFile!}
                    onConfirm={handleAdjusterConfirm}
                    onCancel={() => {
                        setShowAdjuster(false);
                        if (!filePreview) resetUploadForm();
                    }}
                />
            )}
        </div>
    );
}
