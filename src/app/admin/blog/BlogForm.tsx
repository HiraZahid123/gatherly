"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Save, Eye, EyeOff, Sparkles, ArrowLeft, RefreshCw,
} from "lucide-react";
import Link from "next/link";

const GRADIENT_PRESETS = [
    { label: "Teal (Default)",   value: "from-green-600 via-teal-700 to-emerald-800" },
    { label: "Sunset",           value: "from-yellow-600 via-rose-600 to-orange-600" },
    { label: "Ocean",            value: "from-cyan-600 via-teal-600 to-emerald-700" },
    { label: "Purple Rain",      value: "from-violet-700 via-purple-700 to-indigo-800" },
    { label: "Midnight",         value: "from-slate-800 via-gray-900 to-zinc-900" },
    { label: "Candy",            value: "from-pink-500 via-rose-500 to-red-500" },
    { label: "Forest",           value: "from-green-800 via-emerald-700 to-teal-800" },
    { label: "Gold",             value: "from-amber-500 via-yellow-500 to-orange-500" },
];

const CATEGORY_SUGGESTIONS = [
    "Event Planning", "Psychology", "Guides", "Design",
    "Productivity", "Inspiration", "Announcements", "General",
];

interface FormData {
    title: string;
    slug: string;
    excerpt: string;
    category: string;
    authorName: string;
    authorRole: string;
    authorAvatar: string;
    readingTime: number;
    coverGradient: string;
    coverEmoji: string;
    content: string;
    published: boolean;
    publishedAt: string;
}

interface BlogFormProps {
    initialData?: Partial<FormData> & { id?: string };
    mode: "new" | "edit";
}

function slugify(text: string) {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export default function BlogForm({ initialData, mode }: BlogFormProps) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [preview, setPreview] = useState(false);
    const [error, setError] = useState("");
    const [slugManual, setSlugManual] = useState(false);

    const [form, setForm] = useState<FormData>({
        title: "",
        slug: "",
        excerpt: "",
        category: "General",
        authorName: "JollyWitMe Team",
        authorRole: "Editor",
        authorAvatar: "GT",
        readingTime: 5,
        coverGradient: "from-green-600 via-teal-700 to-emerald-800",
        coverEmoji: "✨",
        content: "",
        published: false,
        publishedAt: new Date().toISOString().slice(0, 16),
        ...initialData,
    });

    // Auto-generate slug from title
    useEffect(() => {
        if (!slugManual && mode === "new") {
            setForm(prev => ({ ...prev, slug: slugify(prev.title) }));
        }
    }, [form.title, slugManual, mode]);

    // Auto-generate avatar initials from author name
    useEffect(() => {
        if (form.authorName) {
            const initials = form.authorName
                .split(" ")
                .map(w => w[0]?.toUpperCase() || "")
                .slice(0, 2)
                .join("");
            setForm(prev => ({ ...prev, authorAvatar: initials || "GT" }));
        }
    }, [form.authorName]);

    const set = (key: keyof FormData, value: string | number | boolean) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const handleSubmit = async (publishNow?: boolean) => {
        if (!form.title.trim() || !form.slug.trim() || !form.content.trim()) {
            setError("Title, slug, and content are required.");
            return;
        }
        setSaving(true);
        setError("");

        const payload = {
            ...form,
            published: publishNow !== undefined ? publishNow : form.published,
            readingTime: Number(form.readingTime),
        };

        try {
            const url = mode === "edit" && initialData?.id
                ? `/api/admin/blog/${initialData.id}`
                : "/api/admin/blog";
            const method = mode === "edit" ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();

            if (!data.success) {
                setError(data.error || "Something went wrong.");
                return;
            }

            router.push("/admin/blog");
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-5xl space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/blog" className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                        <ArrowLeft className="w-4 h-4 text-white/60" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight uppercase">
                            {mode === "new" ? "New Post" : "Edit Post"}
                        </h1>
                        <p className="text-white/30 text-xs font-bold uppercase tracking-widest">
                            {mode === "new" ? "Create a new blog post" : "Editing: " + form.title}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setPreview(!preview)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/60 text-sm font-bold rounded-2xl transition-all border border-white/10"
                    >
                        {preview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {preview ? "Edit" : "Preview"}
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSubmit(false)}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/60 text-sm font-bold rounded-2xl transition-all border border-white/10 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        Save Draft
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSubmit(true)}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-400 text-black text-sm font-black rounded-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                        {saving
                            ? <RefreshCw className="w-4 h-4 animate-spin" />
                            : <Sparkles className="w-4 h-4" />
                        }
                        {form.published || mode === "edit" ? "Save & Publish" : "Publish"}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl px-5 py-4 text-sm text-red-400 font-medium">
                    {error}
                </div>
            )}

            {preview ? (
                /* ── PREVIEW MODE ── */
                <div className="bg-[#0a0a0b] border border-white/5 rounded-[2.5rem] overflow-hidden">
                    <div className={`h-52 bg-gradient-to-br ${form.coverGradient} flex items-center justify-center relative`}>
                        <span className="text-8xl opacity-80">{form.coverEmoji}</span>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-transparent to-transparent" />
                        <div className="absolute top-4 left-4 bg-white/15 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">
                            {form.category}
                        </div>
                    </div>
                    <div className="p-10">
                        <div className="flex items-center gap-3 mb-6 text-xs text-white/40">
                            <span>{form.readingTime} min read</span>
                            <span>·</span>
                            <span>{new Date(form.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                        </div>
                        <h2 className="text-4xl font-black tracking-tight mb-4">{form.title || "Untitled"}</h2>
                        <p className="text-white/50 text-lg leading-relaxed mb-8">{form.excerpt}</p>
                        <div className="flex items-center gap-3 py-4 border-t border-white/5">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-xs font-black">
                                {form.authorAvatar}
                            </div>
                            <div>
                                <p className="text-sm font-bold">{form.authorName}</p>
                                <p className="text-xs text-white/40">{form.authorRole}</p>
                            </div>
                        </div>
                        <div
                            className="prose-blog mt-8 pt-8 border-t border-white/5"
                            dangerouslySetInnerHTML={{ __html: form.content }}
                        />
                    </div>
                    <style>{`
                        .prose-blog { color: rgba(255,255,255,0.75); font-size: 1rem; line-height: 1.8; }
                        .prose-blog p { margin-bottom: 1.25rem; }
                        .prose-blog h2 { font-size: 1.4rem; font-weight: 900; color: #fff; margin-top: 2rem; margin-bottom: 0.75rem; }
                        .prose-blog h3 { font-size: 1.15rem; font-weight: 800; color: #fff; margin-top: 1.5rem; margin-bottom: 0.5rem; }
                        .prose-blog strong { color: #fff; font-weight: 800; }
                        .prose-blog ul { list-style: disc; padding-left: 1.5rem; margin-bottom: 1.25rem; }
                        .prose-blog ol { list-style: decimal; padding-left: 1.5rem; margin-bottom: 1.25rem; }
                        .prose-blog blockquote { border-left: 3px solid #22c55e; padding: 0.75rem 1rem; margin: 1.5rem 0; background: rgba(34,197,94,0.08); border-radius: 0 8px 8px 0; }
                        .prose-blog a { color: #86efac; text-decoration: underline; }
                    `}</style>
                </div>
            ) : (
                /* ── EDIT MODE ── */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Column */}
                    <div className="lg:col-span-2 space-y-5">
                        {/* Title */}
                        <div className="bg-[#0a0a0b] border border-white/5 rounded-[2rem] p-6 space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30">Content</h3>
                            <div className="space-y-3">
                                <label className="block">
                                    <span className="text-xs font-bold text-white/50 mb-1.5 block">Title *</span>
                                    <input
                                        type="text"
                                        value={form.title}
                                        onChange={e => set("title", e.target.value)}
                                        placeholder="Enter an attention-grabbing title…"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-medium placeholder-white/20 focus:outline-none focus:border-green-500/50 transition-colors"
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-xs font-bold text-white/50 mb-1.5 block">
                                        Slug *
                                        <button
                                            type="button"
                                            onClick={() => { setSlugManual(false); setForm(prev => ({ ...prev, slug: slugify(prev.title) })); }}
                                            className="ml-2 text-green-400 hover:text-green-300 text-[9px] uppercase tracking-wider"
                                        >
                                            ↺ Auto
                                        </button>
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-white/25 text-sm font-mono">/blog/</span>
                                        <input
                                            type="text"
                                            value={form.slug}
                                            onChange={e => { setSlugManual(true); set("slug", slugify(e.target.value)); }}
                                            placeholder="my-post-slug"
                                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono placeholder-white/20 focus:outline-none focus:border-green-500/50 transition-colors"
                                        />
                                    </div>
                                </label>
                                <label className="block">
                                    <span className="text-xs font-bold text-white/50 mb-1.5 block">Excerpt / Summary</span>
                                    <textarea
                                        value={form.excerpt}
                                        onChange={e => set("excerpt", e.target.value)}
                                        rows={3}
                                        placeholder="A short summary that appears in post cards and SEO…"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-medium placeholder-white/20 focus:outline-none focus:border-green-500/50 transition-colors resize-none"
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="bg-[#0a0a0b] border border-white/5 rounded-[2rem] p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30">Article Body (HTML)</h3>
                                <span className="text-[9px] text-white/20 font-medium">Supports &lt;h2&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;ul&gt;, &lt;blockquote&gt;, &lt;a&gt;</span>
                            </div>
                            <textarea
                                value={form.content}
                                onChange={e => set("content", e.target.value)}
                                rows={20}
                                placeholder={`<p>Start writing your article here...</p>\n\n<h2>Section Heading</h2>\n\n<p>More content...</p>`}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white text-sm font-mono placeholder-white/20 focus:outline-none focus:border-green-500/50 transition-colors resize-y leading-relaxed"
                            />
                        </div>
                    </div>

                    {/* Side Column */}
                    <div className="space-y-5">
                        {/* Publish Settings */}
                        <div className="bg-[#0a0a0b] border border-white/5 rounded-[2rem] p-6 space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30">Publish Settings</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                    <div>
                                        <p className="text-xs font-bold text-white/70">Status</p>
                                        <p className="text-[10px] text-white/30">{form.published ? "Live on site" : "Hidden (draft)"}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => set("published", !form.published)}
                                        className={`relative w-12 h-6 rounded-full transition-all ${form.published ? "bg-green-500" : "bg-white/10"}`}
                                    >
                                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.published ? "left-6" : "left-0.5"}`} />
                                    </button>
                                </div>
                                <label className="block">
                                    <span className="text-xs font-bold text-white/50 mb-1.5 block">Publish Date</span>
                                    <input
                                        type="datetime-local"
                                        value={form.publishedAt}
                                        onChange={e => set("publishedAt", e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs font-medium focus:outline-none focus:border-green-500/50 transition-colors"
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-xs font-bold text-white/50 mb-1.5 block">Reading Time (mins)</span>
                                    <input
                                        type="number"
                                        min={1}
                                        max={60}
                                        value={form.readingTime}
                                        onChange={e => set("readingTime", Number(e.target.value))}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-medium focus:outline-none focus:border-green-500/50 transition-colors"
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Category */}
                        <div className="bg-[#0a0a0b] border border-white/5 rounded-[2rem] p-6 space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30">Category</h3>
                            <input
                                type="text"
                                value={form.category}
                                onChange={e => set("category", e.target.value)}
                                placeholder="e.g. Event Planning"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-medium placeholder-white/20 focus:outline-none focus:border-green-500/50 transition-colors"
                            />
                            <div className="flex flex-wrap gap-2">
                                {CATEGORY_SUGGESTIONS.map(cat => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => set("category", cat)}
                                        className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-all ${
                                            form.category === cat
                                                ? "bg-green-500/20 text-green-400 border border-green-500/40"
                                                : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60"
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Cover */}
                        <div className="bg-[#0a0a0b] border border-white/5 rounded-[2rem] p-6 space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30">Cover Style</h3>

                            {/* Live preview */}
                            <div className={`h-24 rounded-2xl bg-gradient-to-br ${form.coverGradient} flex items-center justify-center text-5xl`}>
                                {form.coverEmoji}
                            </div>

                            <label className="block">
                                <span className="text-xs font-bold text-white/50 mb-1.5 block">Cover Emoji</span>
                                <input
                                    type="text"
                                    value={form.coverEmoji}
                                    onChange={e => set("coverEmoji", e.target.value)}
                                    placeholder="✨"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xl font-medium placeholder-white/20 focus:outline-none focus:border-green-500/50 transition-colors"
                                />
                            </label>
                            <div>
                                <span className="text-xs font-bold text-white/50 mb-2 block">Gradient</span>
                                <div className="space-y-2">
                                    {GRADIENT_PRESETS.map(g => (
                                        <button
                                            key={g.value}
                                            type="button"
                                            onClick={() => set("coverGradient", g.value)}
                                            className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                                                form.coverGradient === g.value ? "bg-white/10 border border-white/20" : "hover:bg-white/5"
                                            }`}
                                        >
                                            <div className={`w-8 h-6 rounded-lg bg-gradient-to-br ${g.value} shrink-0`} />
                                            <span className="text-xs font-bold text-white/60">{g.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Author */}
                        <div className="bg-[#0a0a0b] border border-white/5 rounded-[2rem] p-6 space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30">Author</h3>
                            <div className="space-y-3">
                                <label className="block">
                                    <span className="text-xs font-bold text-white/50 mb-1.5 block">Name</span>
                                    <input
                                        type="text"
                                        value={form.authorName}
                                        onChange={e => set("authorName", e.target.value)}
                                        placeholder="Author Name"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-medium placeholder-white/20 focus:outline-none focus:border-green-500/50 transition-colors"
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-xs font-bold text-white/50 mb-1.5 block">Role / Title</span>
                                    <input
                                        type="text"
                                        value={form.authorRole}
                                        onChange={e => set("authorRole", e.target.value)}
                                        placeholder="e.g. Head of Product"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-medium placeholder-white/20 focus:outline-none focus:border-green-500/50 transition-colors"
                                    />
                                </label>
                                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-sm font-black shrink-0">
                                        {form.authorAvatar || "?"}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold">{form.authorName || "Author Name"}</p>
                                        <p className="text-[10px] text-white/40">{form.authorRole || "Role"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
