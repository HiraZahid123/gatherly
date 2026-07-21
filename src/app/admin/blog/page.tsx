"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    BookOpen, Plus, Pencil, Trash2, Eye, CheckCircle, Clock,
    ArrowUpRight, Search,
} from "lucide-react";

interface BlogPost {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    category: string;
    authorName: string;
    authorRole: string;
    authorAvatar: string;
    publishedAt: string;
    readingTime: number;
    coverGradient: string;
    coverEmoji: string;
    published: boolean;
    createdAt: string;
}

export default function AdminBlogPage() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/blog");
            const data = await res.json();
            if (data.success) setPosts(data.posts);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPosts(); }, []);

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
        setDeletingId(id);
        try {
            const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
            if (res.ok) setPosts(prev => prev.filter(p => p.id !== id));
        } finally {
            setDeletingId(null);
        }
    };

    const togglePublish = async (post: BlogPost) => {
        const res = await fetch(`/api/admin/blog/${post.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ published: !post.published }),
        });
        if (res.ok) {
            setPosts(prev => prev.map(p => p.id === post.id ? { ...p, published: !p.published } : p));
        }
    };

    const filtered = posts.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase()) ||
        p.authorName.toLowerCase().includes(search.toLowerCase())
    );

    const published = posts.filter(p => p.published).length;
    const drafts = posts.filter(p => !p.published).length;

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight mb-2 uppercase">Blog Manager</h1>
                    <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-xs">
                        Create and manage blog posts
                    </p>
                </div>
                <Link
                    href="/admin/blog/new"
                    className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-black rounded-2xl transition-all hover:scale-105 active:scale-95 text-sm shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    New Post
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Total Posts", value: posts.length, icon: BookOpen, color: "text-green-400", bg: "bg-green-500/10" },
                    { label: "Published", value: published, icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                    { label: "Drafts", value: drafts, icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
                ].map((stat) => (
                    <div key={stat.label} className="bg-[#0a0a0b] border border-white/5 rounded-[2rem] p-6 space-y-4">
                        <div className={`w-10 h-10 rounded-2xl ${stat.bg} flex items-center justify-center`}>
                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">{stat.label}</p>
                            <h3 className="text-3xl font-black tabular-nums">{loading ? "…" : stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                    type="text"
                    placeholder="Search posts by title, category or author…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-5 py-3.5 text-sm font-medium text-white placeholder-white/25 focus:outline-none focus:border-green-500/50 transition-colors"
                />
            </div>

            {/* Table */}
            <div className="bg-[#0a0a0b] border border-white/5 rounded-[2.5rem] overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-24 space-y-4">
                        <div className="text-5xl">📝</div>
                        <p className="text-white/30 font-bold text-sm uppercase tracking-widest">
                            {search ? "No posts match your search" : "No blog posts yet"}
                        </p>
                        {!search && (
                            <Link href="/admin/blog/new" className="inline-flex items-center gap-2 text-green-400 font-bold text-sm hover:text-green-300">
                                <Plus className="w-4 h-4" /> Create your first post
                            </Link>
                        )}
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-white/20">Post</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-white/20">Category</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-white/20">Author</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-white/20">Status</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-white/20">Date</th>
                                <th className="px-6 py-5" />
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((post) => (
                                <tr key={post.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${post.coverGradient} flex items-center justify-center text-lg shrink-0`}>
                                                {post.coverEmoji}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white/90 line-clamp-1 max-w-[280px]">{post.title}</p>
                                                <p className="text-[10px] text-white/30 font-medium mt-0.5">/{post.slug}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="bg-white/5 text-white/60 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                                            {post.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-[9px] font-black shrink-0">
                                                {post.authorAvatar}
                                            </div>
                                            <span className="text-xs font-bold text-white/50">{post.authorName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <button
                                            onClick={() => togglePublish(post)}
                                            className={`flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider transition-all hover:scale-105 ${
                                                post.published
                                                    ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                                    : "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                                            }`}
                                        >
                                            {post.published ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                            {post.published ? "Published" : "Draft"}
                                        </button>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-[10px] text-white/30 font-medium">
                                            {new Date(post.publishedAt).toLocaleDateString("en-US", {
                                                month: "short", day: "numeric", year: "numeric"
                                            })}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link
                                                href={`/blog/${post.slug}`}
                                                target="_blank"
                                                title="Preview"
                                                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                                            >
                                                <Eye className="w-3.5 h-3.5 text-white/40" />
                                            </Link>
                                            <Link
                                                href={`/admin/blog/${post.id}/edit`}
                                                title="Edit"
                                                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-green-500/20 flex items-center justify-center transition-colors"
                                            >
                                                <Pencil className="w-3.5 h-3.5 text-white/40 hover:text-green-400" />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(post.id, post.title)}
                                                disabled={deletingId === post.id}
                                                title="Delete"
                                                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-red-500/20 flex items-center justify-center transition-colors"
                                            >
                                                {deletingId === post.id
                                                    ? <div className="w-3 h-3 rounded-full border border-red-400 border-t-transparent animate-spin" />
                                                    : <Trash2 className="w-3.5 h-3.5 text-white/40 hover:text-red-400" />
                                                }
                                            </button>
                                            <Link
                                                href={`/admin/blog/${post.id}/edit`}
                                                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                                            >
                                                <ArrowUpRight className="w-3.5 h-3.5 text-white/40" />
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
