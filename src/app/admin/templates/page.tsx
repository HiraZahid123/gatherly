"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
    Sparkles,
    Plus,
    Flame,
    Eye,
    EyeOff,
    Trash2,
    Edit3,
    Search,
    RefreshCw,
    SlidersHorizontal,
    ExternalLink,
} from "lucide-react";

interface EventTemplateItem {
    id: string;
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
    createdAt: string;
}

export default function AdminTemplatesPage() {
    const [templates, setTemplates] = useState<EventTemplateItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [isSeeding, setIsSeeding] = useState(false);
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const fetchTemplates = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/admin/templates");
            const data = await res.json();
            if (data.success) {
                setTemplates(data.templates);
            }
        } catch (err) {
            console.error("Failed to fetch templates:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handleToggleTrending = async (template: EventTemplateItem) => {
        try {
            const res = await fetch(`/api/admin/templates/${template.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isTrending: !template.isTrending }),
            });
            const data = await res.json();
            if (data.success) {
                setTemplates((prev) =>
                    prev.map((t) => (t.id === template.id ? { ...t, isTrending: !t.isTrending } : t))
                );
            }
        } catch (err) {
            console.error("Toggle trending error:", err);
        }
    };

    const handleTogglePublished = async (template: EventTemplateItem) => {
        try {
            const res = await fetch(`/api/admin/templates/${template.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ published: !template.published }),
            });
            const data = await res.json();
            if (data.success) {
                setTemplates((prev) =>
                    prev.map((t) => (t.id === template.id ? { ...t, published: !t.published } : t))
                );
            }
        } catch (err) {
            console.error("Toggle published error:", err);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete template "${title}"?`)) return;

        try {
            const res = await fetch(`/api/admin/templates/${id}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (data.success) {
                setTemplates((prev) => prev.filter((t) => t.id !== id));
                setFeedback({ type: "success", text: `Template "${title}" deleted successfully.` });
                setTimeout(() => setFeedback(null), 3000);
            }
        } catch (err) {
            console.error("Delete error:", err);
        }
    };

    const handleSeedDefaults = async () => {
        setIsSeeding(true);
        try {
            const res = await fetch("/api/admin/templates/seed", { method: "POST" });
            const data = await res.json();
            if (data.success) {
                setFeedback({ type: "success", text: data.message || "Seeded default templates successfully!" });
                fetchTemplates();
                setTimeout(() => setFeedback(null), 4000);
            } else {
                setFeedback({ type: "error", text: data.error || "Failed to seed templates" });
            }
        } catch (err) {
            console.error("Seed error:", err);
        } finally {
            setIsSeeding(false);
        }
    };

    const categories = ["All", ...Array.from(new Set(templates.map((t) => t.category)))];

    const filteredTemplates = templates.filter((t) => {
        const matchesSearch =
            t.title.toLowerCase().includes(search.toLowerCase()) ||
            t.category.toLowerCase().includes(search.toLowerCase()) ||
            t.theme.toLowerCase().includes(search.toLowerCase());
        const matchesCat = categoryFilter === "All" || t.category === categoryFilter;
        return matchesSearch && matchesCat;
    });

    const trendingCount = templates.filter((t) => t.isTrending && t.published).length;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-16">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                        <Sparkles className="w-8 h-8 text-emerald-400" />
                        Event Templates
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Manage pre-designed event templates that appear in the homepage Trending section and creation studio.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {templates.length === 0 && (
                        <button
                            onClick={handleSeedDefaults}
                            disabled={isSeeding}
                            className="px-5 py-3 rounded-2xl text-sm font-bold bg-white/5 hover:bg-white/10 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 transition-all flex items-center gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${isSeeding ? "animate-spin" : ""}`} />
                            {isSeeding ? "Seeding..." : "Seed Default Templates"}
                        </button>
                    )}
                    <Link
                        href="/admin/templates/new"
                        className="px-6 py-3 rounded-2xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Create Template
                    </Link>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#111113] border border-white/5 rounded-3xl p-6">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Templates</span>
                    <div className="text-3xl font-black text-white mt-1">{templates.length}</div>
                </div>
                <div className="bg-[#111113] border border-white/5 rounded-3xl p-6">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-amber-400" /> Trending on Homepage
                    </span>
                    <div className="text-3xl font-black text-emerald-400 mt-1">{trendingCount}</div>
                </div>
                <div className="bg-[#111113] border border-white/5 rounded-3xl p-6">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-blue-400" /> Published Live
                    </span>
                    <div className="text-3xl font-black text-white mt-1">{templates.filter((t) => t.published).length}</div>
                </div>
            </div>

            {/* Feedback Alert */}
            {feedback && (
                <div
                    className={`p-4 rounded-2xl text-sm font-medium border animate-in fade-in duration-200 ${
                        feedback.type === "success"
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                            : "bg-red-500/10 border-red-500/30 text-red-400"
                    }`}
                >
                    {feedback.text}
                </div>
            )}

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#111113] border border-white/5 p-4 rounded-3xl">
                <div className="relative w-full md:w-96">
                    <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search templates by title, theme, category..."
                        className="w-full bg-[#18181b] border border-white/10 rounded-2xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                    <SlidersHorizontal className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                                categoryFilter === cat
                                    ? "bg-white text-black shadow-md"
                                    : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Templates Grid */}
            {isLoading ? (
                <div className="py-24 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-500 mx-auto mb-4"></div>
                    <p className="text-gray-400 text-sm">Loading templates...</p>
                </div>
            ) : filteredTemplates.length === 0 ? (
                <div className="py-24 text-center bg-[#111113] border border-white/5 rounded-3xl p-12">
                    <Sparkles className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No templates found</h3>
                    <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
                        {templates.length === 0
                            ? "Get started by seeding curated default templates or creating your own."
                            : "No templates matched your search filter."}
                    </p>
                    {templates.length === 0 && (
                        <button
                            onClick={handleSeedDefaults}
                            disabled={isSeeding}
                            className="px-6 py-3 rounded-2xl text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-all inline-flex items-center gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${isSeeding ? "animate-spin" : ""}`} />
                            Seed Initial Templates
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTemplates.map((template) => (
                        <div
                            key={template.id}
                            className="bg-[#111113] border border-white/10 rounded-3xl overflow-hidden group hover:border-emerald-500/40 transition-all flex flex-col justify-between shadow-xl"
                        >
                            <div>
                                {/* Card Thumbnail */}
                                <div className="aspect-[4/3] relative overflow-hidden bg-black/50">
                                    <div className={`absolute inset-0 opacity-40 ${template.bgClass}`} />
                                    {template.previewImage && (
                                        <Image
                                            src={template.previewImage}
                                            alt={template.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    )}

                                    {/* Top Badges */}
                                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                                        <span className="px-3 py-1 bg-black/70 backdrop-blur-md rounded-full text-[11px] font-bold text-white border border-white/10">
                                            {template.category}
                                        </span>
                                        <div className="flex gap-1.5">
                                            {template.isTrending && (
                                                <span className="px-2.5 py-1 bg-amber-500/20 backdrop-blur-md text-amber-300 border border-amber-500/30 rounded-full text-[10px] font-extrabold flex items-center gap-1">
                                                    <Flame className="w-3 h-3 text-amber-400" /> Trending
                                                </span>
                                            )}
                                            {!template.published && (
                                                <span className="px-2.5 py-1 bg-red-500/20 backdrop-blur-md text-red-300 border border-red-500/30 rounded-full text-[10px] font-bold">
                                                    Draft
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="p-6 space-y-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                                            {template.title}
                                        </h3>
                                    </div>

                                    {/* Preset Tags */}
                                    <div className="flex flex-wrap gap-2 text-[11px]">
                                        <span className="px-2.5 py-1 rounded-lg bg-white/5 text-gray-300 border border-white/5 font-mono">
                                            Theme: <b className="text-white">{template.theme}</b>
                                        </span>
                                        <span className="px-2.5 py-1 rounded-lg bg-white/5 text-gray-300 border border-white/5 font-mono">
                                            Effect: <b className="text-emerald-400">{template.effect}</b>
                                        </span>
                                        <span className="px-2.5 py-1 rounded-lg bg-white/5 text-gray-300 border border-white/5 font-mono">
                                            Vibe: <b className="text-white">{template.vibeId}</b>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions Footer */}
                            <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                    {/* Trending Toggle Button */}
                                    <button
                                        onClick={() => handleToggleTrending(template)}
                                        title={template.isTrending ? "Remove from Trending" : "Feature in Trending"}
                                        className={`p-2 rounded-xl border transition-all ${
                                            template.isTrending
                                                ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                                                : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                                        }`}
                                    >
                                        <Flame className="w-4 h-4" />
                                    </button>

                                    {/* Publish Toggle Button */}
                                    <button
                                        onClick={() => handleTogglePublished(template)}
                                        title={template.published ? "Unpublish (Hide)" : "Publish (Make Visible)"}
                                        className={`p-2 rounded-xl border transition-all ${
                                            template.published
                                                ? "bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
                                                : "bg-white/5 border-white/10 text-gray-500 hover:text-white"
                                        }`}
                                    >
                                        {template.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                    </button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Link
                                        href={`/events/create?theme=${template.theme}&effect=${template.effect}&vibeId=${template.vibeId}&poster=${encodeURIComponent(template.poster)}`}
                                        target="_blank"
                                        title="Test in Event Studio"
                                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition-all"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </Link>

                                    <Link
                                        href={`/admin/templates/${template.id}/edit`}
                                        className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 transition-all"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </Link>

                                    <button
                                        onClick={() => handleDelete(template.id, template.title)}
                                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
