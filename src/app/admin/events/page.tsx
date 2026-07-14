"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Calendar as CalendarIcon,
    Search,
    MapPin,
    Trash2,
    ExternalLink,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Star,
    EyeOff,
    Eye,
    Filter,
} from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_OPTIONS = ["", "DRAFT", "PUBLISHED", "ACTIVE", "CLOSED", "ARCHIVED"];
const STATUS_COLORS: Record<string, string> = {
    PUBLISHED: "bg-green-500/10 border-green-500/20 text-green-500",
    ACTIVE:    "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
    DRAFT:     "bg-white/5 border-white/10 text-white/40",
    CLOSED:    "bg-orange-500/10 border-orange-500/20 text-orange-400",
    ARCHIVED:  "bg-white/5 border-white/10 text-white/20",
};

export default function EventsManagement() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<any>(null);
    const [pendingAction, setPendingAction] = useState<string | null>(null);

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), search });
            if (statusFilter) params.set("status", statusFilter);
            const res = await fetch(`/api/admin/events?${params}`);
            const data = await res.json();
            if (data.success) {
                setEvents(data.events);
                setPagination(data.pagination);
            }
        } finally {
            setLoading(false);
        }
    }, [page, search, statusFilter]);

    useEffect(() => {
        const timer = setTimeout(fetchEvents, 300);
        return () => clearTimeout(timer);
    }, [fetchEvents]);

    const handleDelete = async (eventId: string) => {
        if (!confirm("Permanently delete this event? This cannot be undone.")) return;
        setPendingAction(eventId + "-delete");
        const res = await fetch(`/api/admin/events?eventId=${eventId}`, { method: "DELETE" });
        if (res.ok) fetchEvents();
        setPendingAction(null);
    };

    const handleToggle = async (eventId: string, field: "isFeatured" | "isHidden", current: boolean) => {
        setPendingAction(eventId + "-" + field);
        const res = await fetch("/api/admin/events", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ eventId, [field]: !current }),
        });
        if (res.ok) {
            setEvents(prev =>
                prev.map(e => e.id === eventId ? { ...e, [field]: !current } : e)
            );
        }
        setPendingAction(null);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight uppercase">Event Vault</h1>
                    <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">
                        {pagination?.total ?? 0} total gatherings
                    </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    {/* Status Filter */}
                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 pointer-events-none" />
                        <select
                            title="Filter by status"
                            value={statusFilter}
                            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                            className="h-14 bg-[#0a0a0b] border border-white/5 rounded-2xl pl-10 pr-6 outline-none focus:border-white/20 text-[10px] font-black uppercase tracking-widest text-white/40 appearance-none cursor-pointer transition-all"
                        >
                            <option value="">All Statuses</option>
                            {STATUS_OPTIONS.filter(Boolean).map(s => (
                                <option key={s} value={s} className="bg-[#1a1a1a]">{s}</option>
                            ))}
                        </select>
                    </div>

                    {/* Search */}
                    <div className="relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-white/60 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search events or slugs..."
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            className="w-64 h-14 bg-[#0a0a0b] border border-white/5 rounded-2xl pl-14 pr-6 outline-none focus:border-white/20 text-sm font-medium transition-all text-white"
                        />
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-white/20">
                <div className="flex items-center gap-2"><Star className="w-3 h-3 text-amber-400" /> Featured</div>
                <div className="flex items-center gap-2"><EyeOff className="w-3 h-3 text-red-400" /> Hidden from public</div>
            </div>

            <div className="bg-[#0a0a0b] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.01]">
                                <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-white/20">Event</th>
                                <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-white/20">Host</th>
                                <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-white/20">Status</th>
                                <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-white/20">Guests</th>
                                <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-white/20">Flags</th>
                                <th className="px-8 py-6"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {loading && events.length === 0 ? (
                                [1, 2, 3, 4].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-8 py-10 h-24 bg-white/[0.01]" />
                                    </tr>
                                ))
                            ) : events.map(event => (
                                <tr
                                    key={event.id}
                                    className={`transition-colors hover:bg-white/[0.02] group ${event.isHidden ? "opacity-50" : ""}`}
                                >
                                    {/* Event */}
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden flex-shrink-0">
                                                {event.coverImage ? (
                                                    <Image src={event.coverImage} alt="" fill className="object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <CalendarIcon className="w-4 h-4 text-white/20" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-white truncate max-w-[180px]">{event.title}</span>
                                                    {event.isFeatured && <Star className="w-3 h-3 text-amber-400 flex-shrink-0 fill-amber-400" />}
                                                    {event.isHidden && <EyeOff className="w-3 h-3 text-red-400 flex-shrink-0" />}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-white/30 mt-0.5">
                                                    <MapPin className="w-3 h-3" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest truncate">{event.location || "TBD"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Host */}
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-[9px] font-black text-emerald-400 flex-shrink-0">
                                                {event.host?.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-white/80">{event.host?.name}</p>
                                                <p className="text-[10px] text-white/20">{event.host?.email}</p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Status */}
                                    <td className="px-8 py-5">
                                        <span className={`text-[9px] font-black uppercase tracking-widest rounded-md px-2.5 py-1 border ${STATUS_COLORS[event.status] ?? "bg-white/5 border-white/10 text-white/40"}`}>
                                            {event.status}
                                        </span>
                                    </td>

                                    {/* Guests */}
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${event._count.rsvps > 0 ? "bg-green-500" : "bg-white/10"}`} />
                                            <span className="text-xs font-bold tabular-nums">{event._count.rsvps}</span>
                                        </div>
                                    </td>

                                    {/* Flags */}
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2">
                                            {/* Feature toggle */}
                                            <button
                                                title={event.isFeatured ? "Remove Feature" : "Mark as Featured"}
                                                disabled={pendingAction === event.id + "-isFeatured"}
                                                onClick={() => handleToggle(event.id, "isFeatured", event.isFeatured)}
                                                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${event.isFeatured ? "bg-amber-500/20 text-amber-400" : "bg-white/5 text-white/20 hover:bg-amber-500/10 hover:text-amber-400/60"}`}
                                            >
                                                {pendingAction === event.id + "-isFeatured"
                                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    : <Star className={`w-3.5 h-3.5 ${event.isFeatured ? "fill-amber-400" : ""}`} />
                                                }
                                            </button>

                                            {/* Hide toggle */}
                                            <button
                                                title={event.isHidden ? "Make Visible" : "Hide from Public"}
                                                disabled={pendingAction === event.id + "-isHidden"}
                                                onClick={() => handleToggle(event.id, "isHidden", event.isHidden)}
                                                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${event.isHidden ? "bg-red-500/20 text-red-400" : "bg-white/5 text-white/20 hover:bg-red-500/10 hover:text-red-400/60"}`}
                                            >
                                                {pendingAction === event.id + "-isHidden"
                                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    : event.isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />
                                                }
                                            </button>
                                        </div>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <a
                                                href={`/e/${event.slug}`}
                                                target="_blank"
                                                title="View Event"
                                                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all"
                                            >
                                                <ExternalLink className="w-4 h-4 text-white/40" />
                                            </a>
                                            <button
                                                title="Delete Event"
                                                disabled={pendingAction === event.id + "-delete"}
                                                onClick={() => handleDelete(event.id)}
                                                className="w-9 h-9 rounded-xl bg-rose-500/5 hover:bg-rose-500/20 flex items-center justify-center transition-all group/del"
                                            >
                                                {pendingAction === event.id + "-delete"
                                                    ? <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                                                    : <Trash2 className="w-4 h-4 text-rose-500/40 group-hover/del:text-rose-500 transition-colors" />
                                                }
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {!loading && events.length === 0 && (
                    <div className="flex flex-col items-center py-20 gap-4">
                        <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center">
                            <CalendarIcon className="w-8 h-8 text-white/10" />
                        </div>
                        <p className="text-sm font-bold text-white/20 uppercase tracking-widest">No events found</p>
                    </div>
                )}

                {pagination && pagination.pages > 1 && (
                    <div className="px-8 py-6 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/20">
                            Page {page} of {pagination.pages}
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
                                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                                disabled={page === pagination.pages}
                                title="Next Page"
                                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-20 flex items-center justify-center transition-all"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
