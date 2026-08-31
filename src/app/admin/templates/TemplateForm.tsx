"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
    ArrowLeft,
    Sparkles,
    Eye,
    Save,
    Upload,
    Flame,
    Palette,
    Layers,
    Check,
    AlertCircle,
    Loader2,
} from "lucide-react";
import { VIBE_THEMES } from "@/lib/theme";
import { THEMES, ANIMATED_THEME_PRESETS } from "@/components/ThemeSelector";
import { EFFECTS, IMAGE_VFX_PRESETS, VIDEO_VFX_PRESETS } from "@/components/EffectSelector";

export interface TemplateData {
    id?: string;
    title: string;
    category: string;
    previewImage: string;
    bgClass: string;
    theme: string;
    effect: string;
    poster: string;
    vibeId: string;
    isTrending: boolean;
    order: number;
    published: boolean;
}

interface TemplateFormProps {
    initialData?: TemplateData;
    isEditing?: boolean;
}

const CATEGORIES = [
    "Wedding",
    "Birthday",
    "Party",
    "Dinner",
    "Concert",
    "Celebration",
    "Night Out",
    "Housewarming",
    "Corporate",
    "Other",
];

const BG_GRADIENT_PRESETS = [
    { label: "Emerald Luxury", value: "bg-gradient-to-br from-emerald-900 via-emerald-950 to-black" },
    { label: "Deep Meadow", value: "bg-emerald-950" },
    { label: "Midnight Velvet", value: "bg-gradient-to-br from-neutral-900 via-black to-emerald-950" },
    { label: "Golden Owambe", value: "bg-gradient-to-br from-yellow-950 via-amber-900 to-black" },
    { label: "Royal Violet", value: "bg-gradient-to-br from-purple-950 via-indigo-950 to-black" },
    { label: "Sunset Rose", value: "bg-gradient-to-br from-rose-950 via-pink-950 to-black" },
    { label: "Graphite Dark", value: "bg-gray-950" },
];

const PRESET_POSTERS = [
    { name: "Disco Party", path: "/partiful/disco-pride.avif" },
    { name: "Butterflies Dinner", path: "/partiful/dinner-butterflies_ywle19.avif" },
    { name: "Award Celebration", path: "/partiful/awardgoesto.avif" },
    { name: "Movie Spotlight", path: "/partiful/movie-awards-spotlight.avif" },
    { name: "Golden Gala", path: "/partiful/awards-night.avif" },
    { name: "Mocktail Soiree", path: "/partiful/mocktail-party.avif" },
    { name: "Brunch O'Clock", path: "/partiful/brunch-oclock.avif" },
    { name: "Bridgerton Ball", path: "/partiful/bridgerton-two.avif" },
    { name: "Housewarming", path: "/partiful/housewarming-muji.avif" },
    { name: "Cozy Vibe", path: "/partiful/cozy-chill-bear.avif" },
    { name: "Heartbeat Rave", path: "/partiful/hypnotic-vday.avif" },
    { name: "Retro Vibe", path: "/partiful/retro-vday.avif" },
];

export default function TemplateForm({ initialData, isEditing = false }: TemplateFormProps) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<TemplateData>(
        initialData || {
            title: "",
            category: "Party",
            previewImage: "/partiful/disco-pride.avif",
            bgClass: "bg-gradient-to-br from-emerald-900 via-emerald-950 to-black",
            theme: "meadow",
            effect: "particles",
            poster: "/partiful/disco-pride.avif",
            vibeId: "royal",
            isTrending: true,
            order: 0,
            published: true,
        }
    );

    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const handleChange = (field: keyof TemplateData, value: any) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
            // If preview image changes and poster was the same, sync poster
            ...(field === "previewImage" && prev.poster === prev.previewImage ? { poster: value } : {}),
        }));
    };

    const handleSelectPresetPoster = (posterPath: string) => {
        setFormData((prev) => ({
            ...prev,
            previewImage: posterPath,
            poster: posterPath,
        }));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setError("");

        // Function to read as base64 data URL
        const readAsBase64 = (f: File): Promise<string> => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(f);
            });
        };

        try {
            const uploadFormData = new FormData();
            uploadFormData.append("file", file);

            const res = await fetch("/api/upload/cover", {
                method: "POST",
                body: uploadFormData,
            });

            const data = await res.json();
            if (res.ok && data.imageUrl) {
                setFormData((prev) => ({
                    ...prev,
                    previewImage: data.imageUrl,
                    poster: data.imageUrl,
                }));
                setSuccessMessage("Custom image uploaded successfully!");
            } else {
                // Fallback to local base64 preview
                const base64Url = await readAsBase64(file);
                setFormData((prev) => ({
                    ...prev,
                    previewImage: base64Url,
                    poster: base64Url,
                }));
                setSuccessMessage("Image loaded successfully!");
            }
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (err: unknown) {
            console.warn("Upload API failed, falling back to base64:", err);
            try {
                const base64Url = await readAsBase64(file);
                setFormData((prev) => ({
                    ...prev,
                    previewImage: base64Url,
                    poster: base64Url,
                }));
                setSuccessMessage("Image loaded successfully!");
                setTimeout(() => setSuccessMessage(""), 3000);
            } catch (readErr) {
                setError("Failed to read image file. Please try another image.");
            }
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");
        setIsSaving(true);

        try {
            const url = isEditing && formData.id
                ? `/api/admin/templates/${formData.id}`
                : "/api/admin/templates";
            const method = isEditing ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to save template");
            }

            setSuccessMessage(isEditing ? "Template updated successfully!" : "Template created successfully!");
            
            setTimeout(() => {
                router.push("/admin/templates");
                router.refresh();
            }, 800);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "An unexpected error occurred");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-16">
            {/* Header / Nav */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/templates"
                        className="p-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-2xl border border-white/10 transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                            <Sparkles className="w-7 h-7 text-emerald-400" />
                            {isEditing ? "Edit Template" : "Create New Template"}
                        </h1>
                        <p className="text-sm text-gray-400 mt-1">
                            Configure event design presets shown to users in Trending Templates.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/templates"
                        className="px-5 py-3 rounded-2xl text-sm font-semibold bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-all border border-white/10"
                    >
                        Cancel
                    </Link>
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="px-6 py-3 rounded-2xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {isSaving ? "Saving..." : isEditing ? "Update Template" : "Publish Template"}
                    </button>
                </div>
            </div>

            {/* Alert Messages */}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {successMessage && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-sm flex items-center gap-3">
                    <Check className="w-5 h-5 flex-shrink-0" />
                    <span>{successMessage}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Form Fields Column */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-[#111113] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4">
                            <Layers className="w-5 h-5 text-emerald-400" />
                            General Information
                        </h2>

                        {/* Title */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                                Template Title *
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => handleChange("title", e.target.value)}
                                placeholder="e.g. Grand Owambe Celebration, Afrobeats Rave..."
                                required
                                className="w-full bg-[#18181b] border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            />
                        </div>

                        {/* Category */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                                    Category
                                </label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => handleChange("category", e.target.value)}
                                    className="w-full bg-[#18181b] border border-white/10 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                >
                                    {CATEGORIES.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Order */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                                    Sort Order
                                </label>
                                <input
                                    type="number"
                                    value={formData.order}
                                    onChange={(e) => handleChange("order", e.target.value)}
                                    placeholder="0"
                                    className="w-full bg-[#18181b] border border-white/10 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                />
                            </div>
                        </div>

                        {/* Image / Poster URL + Custom Image Upload */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
                                    Preview Image / Poster Path *
                                </label>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-500/20 transition-all disabled:opacity-50"
                                >
                                    <Upload className={`w-3.5 h-3.5 ${isUploading ? "animate-bounce" : ""}`} />
                                    {isUploading ? "Uploading..." : "Upload Custom Image"}
                                </button>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                            />

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={formData.previewImage}
                                    onChange={(e) => handleChange("previewImage", e.target.value)}
                                    placeholder="/partiful/disco-pride.avif or https://..."
                                    required
                                    className="flex-1 bg-[#18181b] border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono text-xs"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 flex items-center gap-2 text-xs font-bold transition-all disabled:opacity-50"
                                    title="Upload image file from your device"
                                >
                                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> : <Upload className="w-4 h-4 text-emerald-400" />}
                                    <span>{isUploading ? "Uploading..." : "Browse"}</span>
                                </button>
                            </div>
                        </div>

                        {/* Preset Posters Picker */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                                Or Select from High-Quality Presets:
                            </label>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1 border border-white/5 rounded-2xl bg-black/30">
                                {/* Upload Tile */}
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="relative rounded-xl overflow-hidden aspect-[4/3] border border-dashed border-emerald-500/40 hover:border-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 flex flex-col items-center justify-center p-2 text-center transition-all group disabled:opacity-50"
                                >
                                    {isUploading ? (
                                        <Loader2 className="w-5 h-5 text-emerald-400 animate-spin mb-1" />
                                    ) : (
                                        <Upload className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform mb-1" />
                                    )}
                                    <span className="text-[10px] font-bold text-emerald-400 leading-tight">
                                        {isUploading ? "Uploading..." : "+ Upload Image"}
                                    </span>
                                </button>

                                {PRESET_POSTERS.map((p) => {
                                    const isSelected = formData.previewImage === p.path;
                                    return (
                                        <button
                                            key={p.path}
                                            type="button"
                                            onClick={() => handleSelectPresetPoster(p.path)}
                                            className={`relative rounded-xl overflow-hidden aspect-[4/3] border text-left group transition-all ${
                                                isSelected
                                                    ? "border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/20 scale-[0.98]"
                                                    : "border-white/10 hover:border-white/30 opacity-70 hover:opacity-100"
                                            }`}
                                        >
                                            <Image
                                                src={p.path}
                                                alt={p.name}
                                                fill
                                                className="object-cover"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                                                <span className="text-[10px] font-bold text-white truncate drop-shadow">
                                                    {p.name}
                                                </span>
                                            </div>
                                            {isSelected && (
                                                <div className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                                                    <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Styling & Vibe Configuration */}
                    <div className="bg-[#111113] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4">
                            <Palette className="w-5 h-5 text-emerald-400" />
                            Studio Theme & Effects
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Theme */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                                    Base Theme
                                </label>
                                <select
                                    value={formData.theme}
                                    onChange={(e) => handleChange("theme", e.target.value)}
                                    className="w-full bg-[#18181b] border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                >
                                    <optgroup label="3D & Graphic Themes">
                                        {THEMES.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.emoji} {t.label}
                                            </option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="Animated & Motion Themes">
                                        {ANIMATED_THEME_PRESETS.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.label} ({t.category})
                                            </option>
                                        ))}
                                    </optgroup>
                                </select>
                            </div>

                            {/* Effect */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                                    Visual Effect
                                </label>
                                <select
                                    value={formData.effect}
                                    onChange={(e) => handleChange("effect", e.target.value)}
                                    className="w-full bg-[#18181b] border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                >
                                    <optgroup label="Core VFX & Atmospheres">
                                        {EFFECTS.map((e) => (
                                            <option key={e.id} value={e.id}>
                                                {e.emoji} {e.label}
                                            </option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="Graphic Overlays">
                                        {IMAGE_VFX_PRESETS.map((e) => (
                                            <option key={e.id} value={e.id}>
                                                ✨ {e.label}
                                            </option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="Animated Video VFX">
                                        {VIDEO_VFX_PRESETS.map((e) => (
                                            <option key={e.id} value={e.id}>
                                                🎬 {e.label}
                                            </option>
                                        ))}
                                    </optgroup>
                                </select>
                            </div>

                            {/* Vibe Theme */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                                    Font / Vibe
                                </label>
                                <select
                                    value={formData.vibeId}
                                    onChange={(e) => handleChange("vibeId", e.target.value)}
                                    className="w-full bg-[#18181b] border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                >
                                    {VIBE_THEMES.map((v) => (
                                        <option key={v.id} value={v.id}>
                                            {v.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Background Style Presets */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                                Card Background Atmosphere
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                                {BG_GRADIENT_PRESETS.map((preset) => {
                                    const active = formData.bgClass === preset.value;
                                    return (
                                        <button
                                            key={preset.label}
                                            type="button"
                                            onClick={() => handleChange("bgClass", preset.value)}
                                            className={`p-2.5 rounded-xl text-left border text-xs transition-all ${
                                                active
                                                    ? "border-emerald-500 bg-white/10 text-white font-bold ring-1 ring-emerald-500/50"
                                                    : "border-white/10 bg-black/40 text-gray-400 hover:text-white hover:border-white/20"
                                            }`}
                                        >
                                            <div className={`w-full h-3 rounded mb-1.5 ${preset.value}`} />
                                            <span className="truncate block">{preset.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            <input
                                type="text"
                                value={formData.bgClass}
                                onChange={(e) => handleChange("bgClass", e.target.value)}
                                placeholder="Custom Tailwind classes e.g. bg-emerald-950"
                                className="w-full bg-[#18181b] border border-white/10 rounded-2xl px-4 py-2.5 text-white placeholder-gray-500 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            />
                        </div>
                    </div>

                    {/* Visibility & Trending Status */}
                    <div className="bg-[#111113] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5">
                            <div className="space-y-0.5">
                                <div className="text-sm font-bold text-white flex items-center gap-2">
                                    <Flame className="w-4 h-4 text-amber-400" />
                                    Show in Trending Templates
                                </div>
                                <div className="text-xs text-gray-400">
                                    Display this template in the main homepage carousel.
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleChange("isTrending", !formData.isTrending)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    formData.isTrending ? "bg-emerald-500" : "bg-neutral-800"
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        formData.isTrending ? "translate-x-6" : "translate-x-1"
                                    }`}
                                />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5">
                            <div className="space-y-0.5">
                                <div className="text-sm font-bold text-white flex items-center gap-2">
                                    <Eye className="w-4 h-4 text-blue-400" />
                                    Publish Template
                                </div>
                                <div className="text-xs text-gray-400">
                                    When published, users can discover and use this template.
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleChange("published", !formData.published)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    formData.published ? "bg-emerald-500" : "bg-neutral-800"
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        formData.published ? "translate-x-6" : "translate-x-1"
                                    }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Real-time Preview Column */}
                <div className="lg:col-span-5 space-y-4">
                    <div className="sticky top-8 space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <span className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-2">
                                <Eye className="w-4 h-4 text-emerald-400" />
                                Live Card Preview
                            </span>
                            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                                {formData.category}
                            </span>
                        </div>

                        {/* The Actual Homepage Card Mock */}
                        <div className="p-4 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl">
                            <div className="w-full aspect-[4/3] rounded-3xl overflow-hidden relative group shadow-2xl transition-all duration-300">
                                <div className={`absolute inset-0 opacity-50 ${formData.bgClass}`} />
                                {formData.previewImage && (
                                    <Image
                                        src={formData.previewImage}
                                        alt={formData.title || "Template Preview"}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                )}
                                
                                {/* Inner Glass Border */}
                                <div className="absolute inset-4 border border-white/20 rounded-2xl pointer-events-none" />

                                {/* Badge */}
                                <div className="absolute top-6 left-6 z-10">
                                    <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs font-bold text-white border border-white/10 shadow">
                                        {formData.title || "Template Title"}
                                    </span>
                                </div>

                                {/* Hover Button Preview */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                                    <span className="bg-white text-gray-900 px-6 py-3 rounded-full font-bold shadow-xl translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                        Use Template
                                    </span>
                                </div>
                            </div>

                            {/* Preset Parameters Summary */}
                            <div className="mt-4 p-3.5 bg-black/40 rounded-2xl border border-white/5 space-y-2 text-xs">
                                <div className="flex justify-between text-gray-400">
                                    <span>Theme Preset:</span>
                                    <span className="text-white font-mono font-bold capitalize">{formData.theme}</span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                    <span>Visual Effect:</span>
                                    <span className="text-emerald-400 font-mono font-bold capitalize">{formData.effect}</span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                    <span>Typography Vibe:</span>
                                    <span className="text-white font-mono font-bold capitalize">{formData.vibeId}</span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                    <span>Trending Flag:</span>
                                    <span className={formData.isTrending ? "text-amber-400 font-bold" : "text-gray-500"}>
                                        {formData.isTrending ? "🔥 Trending on Homepage" : "Standard"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
