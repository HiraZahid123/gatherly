"use client";

import { useEffect, useState, useCallback } from "react";
import {
    ShieldAlert,
    Search,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Loader2,
    MessageSquare,
    Ban,
    Shield,
    ExternalLink,
    Image as ImageIcon,
    User,
    AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

type Tab = "comments" | "suspended";

export default function ModerationPage() {
    const [tab, setTab] = useState<Tab>("comments");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>({ comments: [], users: [], total: 0, pages: 1 });
    const [pendingId, setPendingId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/moderation?tab=${tab}&search=${encodeURIComponent(search)}&page=${page}`);
            const json = await res.json();
            if (json.success) setData(json);
        } finally {
            setLoading(false);
        }
    }, [tab, search, page]);

    useEffect(() => {
        const t = setTimeout(fetchData, 300);
        return () => clearTimeout(t);
    }, [fetchData]);

    // Reset page when tab/search changes
    useEffect(() => { setPage(1); }, [tab, search]);

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm("Permanently delete this comment?")) return;
        setPendingId(commentId);
        const res = await fetch(`/api/admin/moderation?commentId=${commentId}`, { method: "DELETE" });
        if (res.ok) {
            setData((prev: any) => ({
                ...prev,
                comments: prev.comments.filter((c: any) => c.id !== commentId),
                total: prev.total - 1,
            }));
        }
        setPendingId(null);
    };

    const handleUnsuspend = async (userId: string) => {
        setPendingId(userId);
        await fetch(`/api/admin/users/${userId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "unsuspend" }),
        });
        setData((prev: any) => ({
            ...prev,
            users: prev.users.filter((u: any) => u.id !== userId),
            total: prev.total - 1,
        }));
        setPendingId(null);
    };

    const comments: any[] = data.comments ?? [];
    const suspendedUsers: any[] = data.users ?? [];
    const totalPages: number = data.pages ?? 1;
    const total: number = data.total ?? 0;

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight mb-2 uppercase">Moderation Desk</h1>
                    <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-xs">
                        Review content and manage suspensions
                    </p>
                </div>
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-white/60 transition-colors" />
                    <input
                        type="text"
                        placeholder={tab === "comments" ? "Search comments, users, events…" : "Search suspended users…"}
                        className="bg-[#0a0a0b] border border-white/5 rounded-2xl pl-12 pr-6 py-4 text-sm font-medium w-full md:w-72 focus:outline-none focus:border-white/20 transition-all text-white"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Live summary cards */}
            <div className="grid grid-cols-3 gap-4">
                <div
                    onClick={() => setTab("comments")}
                    className={`p-6 rounded-3xl border cursor-pointer transition-all ${tab === "comments" ? "bg-green-500/10 border-green-500/20" : "bg-white/[0.02] border-white/5 hover:border-white/10"}`}
                >
                    <MessageSquare className={`w-5 h-5 mb-3 ${tab === "comments" ? "text-green-400" : "text-white/30"}`} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Comments</p>
                    <h4 className="text-2xl font-black">{loading ? "…" : tab === "comments" ? total : "—"}</h4>
                </div>
                <div
                    onClick={() => setTab("suspended")}
                    className={`p-6 rounded-3xl border cursor-pointer transition-all ${tab === "suspended" ? "bg-red-500/10 border-red-500/20" : "bg-white/[0.02] border-white/5 hover:border-white/10"}`}
                >
                    <Ban className={`w-5 h-5 mb-3 ${tab === "suspended" ? "text-red-400" : "text-white/30"}`} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Suspensions</p>
                    <h4 className="text-2xl font-black">{loading ? "…" : tab === "suspended" ? total : "—"}</h4>
                </div>
                <div className="p-6 rounded-3xl border bg-white/[0.02] border-white/5">
                    <ShieldAlert className="w-5 h-5 mb-3 text-white/20" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Blocked IPs</p>
                    <h4 className="text-2xl font-black text-white/20">N/A</h4>
                </div>
            </div>

            {/* Tab switcher */}
            <div className="flex gap-1 border-b border-white/5 pb-0">
                {(["comments", "suspended"] as Tab[]).map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-5 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all -mb-px ${
                            tab === t
                                ? "border-white text-white"
                                : "border-transparent text-white/30 hover:text-white/60"
                        }`}
                    >
                        {t === "comments" ? "Comment Queue" : "Suspended Users"}
                    </button>
                ))}
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                >
                    {/* ── COMMENTS TAB ── */}
                    {tab === "comments" && (
                        <div className="bg-[#0a0a0b] border border-white/5 rounded-[2.5rem] overflow-hidden">
                            {loading && comments.length === 0 ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
                                </div>
                            ) : comments.length === 0 ? (
                                <div className="flex flex-col items-center py-20 gap-4">
                                    <div className="w-16 h-16 rounded-3xl bg-green-500/10 flex items-center justify-center">
                                        <MessageSquare className="w-8 h-8 text-green-500/50" />
                                    </div>
                                    <p className="text-sm font-bold text-white/20 uppercase tracking-widest">No comments found</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/[0.03]">
                                    {comments.map(comment => (
                                        <div key={comment.id} className="px-8 py-5 hover:bg-white/[0.02] transition-colors group flex items-start gap-5">
                                            {/* Author avatar */}
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 ring-1 ring-white/10 flex items-center justify-center text-xs font-black flex-shrink-0 overflow-hidden relative">
                                                {comment.user?.image
                                                    ? <Image src={comment.user.image} alt="" fill className="object-cover" />
                                                    : <User className="w-4 h-4 text-white/30" />
                                                }
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <span className="text-xs font-bold text-white">{comment.user?.name || "Anonymous"}</span>
                                                    <span className="text-[10px] text-white/20">on</span>
                                                    <a
                                                        href={`/e/${comment.event?.slug}`}
                                                        target="_blank"
                                                        className="text-[10px] font-bold text-green-400/70 hover:text-green-400 transition-colors flex items-center gap-1"
                                                    >
                                                        {comment.event?.title}
                                                        <ExternalLink className="w-2.5 h-2.5" />
                                                    </a>
                                                    <span className="text-[9px] text-white/20 ml-auto font-mono">
                                                        {new Date(comment.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                    </span>
                                                </div>

                                                {comment.type === "GIF" && comment.mediaUrl ? (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <ImageIcon className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />
                                                        <span className="text-xs text-white/40 italic">GIF attachment</span>
                                                        <a href={comment.mediaUrl} target="_blank" className="text-[9px] text-green-400/60 hover:text-green-400">view</a>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-white/60 leading-relaxed line-clamp-3">
                                                        "{comment.content}"
                                                    </p>
                                                )}
                                            </div>

                                            {/* Delete */}
                                            <button
                                                title="Delete Comment"
                                                disabled={pendingId === comment.id}
                                                onClick={() => handleDeleteComment(comment.id)}
                                                className="w-9 h-9 rounded-xl bg-red-500/5 hover:bg-red-500/20 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                                            >
                                                {pendingId === comment.id
                                                    ? <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                                                    : <Trash2 className="w-4 h-4 text-red-400/50 hover:text-red-400 transition-colors" />
                                                }
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── SUSPENDED USERS TAB ── */}
                    {tab === "suspended" && (
                        <div className="bg-[#0a0a0b] border border-white/5 rounded-[2.5rem] overflow-hidden">
                            {loading && suspendedUsers.length === 0 ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
                                </div>
                            ) : suspendedUsers.length === 0 ? (
                                <div className="flex flex-col items-center py-20 gap-4">
                                    <div className="w-16 h-16 rounded-3xl bg-green-500/10 flex items-center justify-center">
                                        <Shield className="w-8 h-8 text-green-500/50" />
                                    </div>
                                    <p className="text-sm font-bold text-white/20 uppercase tracking-widest">No suspended users</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/[0.03]">
                                    {suspendedUsers.map(user => (
                                        <div key={user.id} className="px-8 py-5 hover:bg-white/[0.02] transition-colors group flex items-center gap-5">
                                            {/* Avatar */}
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 ring-1 ring-red-500/20 flex items-center justify-center text-xs font-black flex-shrink-0 overflow-hidden relative">
                                                {user.image
                                                    ? <Image src={user.image} alt="" fill className="object-cover opacity-60" />
                                                    : <Ban className="w-4 h-4 text-red-400/60" />
                                                }
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="text-sm font-bold text-white">{user.name || "Anonymous"}</span>
                                                    <span className="text-[8px] font-black uppercase tracking-widest bg-red-500/20 text-red-400 px-2 py-0.5 rounded-md">Suspended</span>
                                                </div>
                                                <p className="text-xs text-white/30">{user.email}</p>
                                                {user.suspendedReason && (
                                                    <div className="flex items-start gap-1.5 mt-1.5">
                                                        <AlertTriangle className="w-3 h-3 text-amber-400/60 flex-shrink-0 mt-0.5" />
                                                        <p className="text-[10px] text-white/40 italic">{user.suspendedReason}</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Meta */}
                                            <div className="hidden md:flex flex-col items-end gap-1 text-right flex-shrink-0">
                                                <span className="text-[9px] font-mono text-white/20">
                                                    {user.suspendedAt
                                                        ? new Date(user.suspendedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                                                        : "—"}
                                                </span>
                                                <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-white/20">
                                                    <span>{user._count?.events ?? 0} events</span>
                                                    <span>{user._count?.rsvps ?? 0} rsvps</span>
                                                </div>
                                            </div>

                                            {/* Restore */}
                                            <button
                                                title="Restore Account"
                                                disabled={pendingId === user.id}
                                                onClick={() => handleUnsuspend(user.id)}
                                                className="w-9 h-9 rounded-xl bg-green-500/10 hover:bg-green-500/20 flex items-center justify-center transition-all flex-shrink-0"
                                            >
                                                {pendingId === user.id
                                                    ? <Loader2 className="w-4 h-4 animate-spin text-green-400" />
                                                    : <Shield className="w-4 h-4 text-green-400" />
                                                }
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20">
                        Page {page} of {totalPages}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            title="Previous Page"
                            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-20 flex items-center justify-center transition-all"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            title="Next Page"
                            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-20 flex items-center justify-center transition-all"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
