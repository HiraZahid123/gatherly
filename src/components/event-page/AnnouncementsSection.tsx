"use client";

import { useState, useEffect, useRef } from "react";
import { Megaphone, Trash2, Pin, Send, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";

interface Announcement {
    id: string;
    content: string;
    isPinned: boolean;
    createdAt: string;
    host: { id: string; name: string | null; image: string | null };
}

interface AnnouncementsSectionProps {
    eventId: string;
    isHost: boolean;
    isCoHost?: boolean;
    /** Pass a ref trigger from HostSidebar to open/focus the input */
    focusTrigger?: number;
}

function timeAgo(dateStr: string) {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

export default function AnnouncementsSection({
    eventId,
    isHost,
    isCoHost = false,
    focusTrigger,
}: AnnouncementsSectionProps) {
    const canPost = isHost || isCoHost;
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [text, setText] = useState("");
    const [isPinned, setIsPinned] = useState(false);
    const [posting, setPosting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(true);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const fetchAnnouncements = async () => {
        try {
            const res = await fetch(`/api/events/${eventId}/announcements`);
            const data = await res.json();
            if (data.success) setAnnouncements(data.announcements);
        } catch (e) {
            console.error("Failed to fetch announcements", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, [eventId]);

    // Focus input when HostSidebar triggers it
    useEffect(() => {
        if (focusTrigger && focusTrigger > 0) {
            setExpanded(true);
            setTimeout(() => inputRef.current?.focus(), 150);
        }
    }, [focusTrigger]);

    const handlePost = async () => {
        if (!text.trim() || posting) return;
        setPosting(true);
        try {
            const res = await fetch(`/api/events/${eventId}/announcements`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: text.trim(), isPinned }),
            });
            const data = await res.json();
            if (data.success) {
                setAnnouncements((prev) => [data.announcement, ...prev]);
                setText("");
                setIsPinned(false);
            }
        } catch (e) {
            console.error("Failed to post announcement", e);
        } finally {
            setPosting(false);
        }
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            const res = await fetch(`/api/events/${eventId}/announcements?id=${id}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (data.success) {
                setAnnouncements((prev) => prev.filter((a) => a.id !== id));
            }
        } catch (e) {
            console.error("Failed to delete announcement", e);
        } finally {
            setDeletingId(null);
        }
    };

    // Don't render section at all for guests if there are no announcements
    if (!canPost && !loading && announcements.length === 0) return null;

    return (
        <div className="w-full" id="announcements">
            {/* Section header */}
            <button
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-3 w-full text-left mb-5 group"
            >
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center ring-1 ring-amber-500/30 group-hover:bg-amber-500/30 transition-colors">
                    <Megaphone className="w-4 h-4 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-white flex-1">Announcements</h3>
                {announcements.length > 0 && (
                    <span className="text-xs font-bold text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
                        {announcements.length}
                    </span>
                )}
                <span className="text-white/30 group-hover:text-white/60 transition-colors">
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
            </button>

            {expanded && (
                <div className="space-y-4">
                    {/* Compose box — host/co-host only */}
                    {canPost && (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                            <textarea
                                ref={inputRef}
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Write an announcement for your guests…"
                                rows={3}
                                className="w-full bg-transparent text-sm text-white placeholder-white/30 outline-none resize-none leading-relaxed"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handlePost();
                                }}
                            />
                            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                <button
                                    onClick={() => setIsPinned((v) => !v)}
                                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                                        isPinned
                                            ? "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40"
                                            : "text-white/30 hover:text-white/60 hover:bg-white/5"
                                    }`}
                                >
                                    <Pin className="w-3 h-3" />
                                    Pin
                                </button>

                                <button
                                    onClick={handlePost}
                                    disabled={!text.trim() || posting}
                                    className="flex items-center gap-2 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:pointer-events-none text-black text-xs font-bold rounded-lg transition-colors"
                                >
                                    {posting ? (
                                        <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    ) : (
                                        <Send className="w-3.5 h-3.5" />
                                    )}
                                    Post
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Announcements list */}
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2].map((i) => (
                                <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />
                            ))}
                        </div>
                    ) : announcements.length === 0 ? (
                        canPost && (
                            <div className="text-center py-8 text-white/20 text-sm">
                                No announcements yet. Post one above to notify guests.
                            </div>
                        )
                    ) : (
                        announcements.map((a) => (
                            <div
                                key={a.id}
                                className={`relative group rounded-2xl p-4 border transition-all ${
                                    a.isPinned
                                        ? "bg-amber-500/8 border-amber-500/25 ring-1 ring-amber-500/15"
                                        : "bg-white/4 border-white/8 hover:border-white/15"
                                }`}
                            >
                                {a.isPinned && (
                                    <div className="flex items-center gap-1 text-amber-400/70 text-[10px] font-bold uppercase tracking-widest mb-2">
                                        <Pin className="w-2.5 h-2.5" />
                                        Pinned
                                    </div>
                                )}

                                <div className="flex items-start gap-3">
                                    {/* Host avatar */}
                                    <div className="w-8 h-8 rounded-full shrink-0 bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center overflow-hidden ring-1 ring-white/10">
                                        {a.host.image ? (
                                            <Image
                                                src={a.host.image}
                                                alt={a.host.name || "Host"}
                                                width={32}
                                                height={32}
                                                className="object-cover w-8 h-8"
                                            />
                                        ) : (
                                            <span className="text-xs font-bold text-white">
                                                {a.host.name?.[0]?.toUpperCase() || "H"}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold text-white/70">
                                                {a.host.name || "Host"}
                                            </span>
                                            <span className="text-[10px] text-white/25">
                                                {timeAgo(a.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-white/85 leading-relaxed whitespace-pre-wrap">
                                            {a.content}
                                        </p>
                                    </div>

                                    {/* Delete button — host/co-host only */}
                                    {canPost && (
                                        <button
                                            onClick={() => handleDelete(a.id)}
                                            disabled={deletingId === a.id}
                                            className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400/60 hover:text-red-400 transition-all shrink-0 disabled:opacity-30"
                                        >
                                            {deletingId === a.id ? (
                                                <div className="w-3 h-3 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                                            ) : (
                                                <Trash2 className="w-3.5 h-3.5" />
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
