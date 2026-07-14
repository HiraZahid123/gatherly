"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Users,
    Calendar,
    CheckCircle2,
    MessageSquare,
    ArrowUpRight,
    TrendingUp,
    Clock,
    ShieldAlert,
    DollarSign,
    Ban,
} from "lucide-react";

interface AdminStats {
    users: number;
    events: number;
    rsvps: number;
    comments: number;
    revenue: number;
    suspended: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [recentEvents, setRecentEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/admin/stats")
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setStats(data.stats);
                    setRecentEvents(data.recentEvents);
                }
            })
            .finally(() => setLoading(false));
    }, []);

    const formatRevenue = (cents: number) =>
        (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

    const statCards = [
        { label: "Total Users", value: stats?.users || 0, icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/10", format: "number" },
        { label: "Live Events", value: stats?.events || 0, icon: Calendar, color: "text-green-500", bg: "bg-green-500/10", format: "number" },
        { label: "Active RSVPs", value: stats?.rsvps || 0, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10", format: "number" },
        { label: "Comments", value: stats?.comments || 0, icon: MessageSquare, color: "text-amber-500", bg: "bg-amber-500/10", format: "number" },
        { label: "Gross Revenue", value: stats?.revenue || 0, icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/10", format: "currency" },
        { label: "Suspensions", value: stats?.suspended || 0, icon: Ban, color: "text-red-400", bg: "bg-red-500/10", format: "number" },
    ];

    return (
        <div className="space-y-12">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-black tracking-tight mb-2 uppercase">Command Center</h1>
                <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-xs">Real-time platform oversight</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {statCards.map((card, i) => (
                    <div key={i} className="bg-[#0a0a0b] border border-white/5 rounded-[2rem] p-6 space-y-5 relative group overflow-hidden transition-all hover:border-white/20">
                        <div className={`w-10 h-10 rounded-2xl ${card.bg} flex items-center justify-center`}>
                            <card.icon className={`w-5 h-5 ${card.color}`} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">{card.label}</p>
                            <h3 className="text-3xl font-black tabular-nums tracking-tighter">
                                {loading ? "…" : card.format === "currency" ? formatRevenue(card.value) : card.value.toLocaleString()}
                            </h3>
                        </div>
                        <div className="absolute top-6 right-6 text-white/5 group-hover:text-white/10 transition-colors">
                            <TrendingUp className="w-10 h-10" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Recent Events */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-black uppercase tracking-widest flex items-center gap-3">
                            <Clock className="w-5 h-5 text-green-500" />
                            Recent Operations
                        </h2>
                        <button className="text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors">View All Actions</button>
                    </div>

                    <div className="bg-[#0a0a0b] border border-white/5 rounded-[2.5rem] overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-white/20">Event Title</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-white/20">Host</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-white/20">Timestamp</th>
                                    <th className="px-8 py-6"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentEvents.map((event, i) => (
                                    <tr key={i} className="border-b border-white/5 transition-colors hover:bg-white/[0.02]">
                                        <td className="px-8 py-6">
                                            <span className="text-sm font-bold text-white/90">{event.title}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-xs font-bold text-white/40">{event.host?.name}</span>
                                        </td>
                                        <td className="px-8 py-6 font-mono text-[10px] text-white/20">
                                            {new Date(event.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <Link href={`/e/${event.slug}`} target="_blank" className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors ml-auto">
                                                <ArrowUpRight className="w-4 h-4 text-white/40" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {recentEvents.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-12 text-center text-xs font-bold text-white/20 uppercase tracking-widest">
                                            No recent activity detected
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Quick Actions / System Status */}
                <div className="space-y-6">
                    <h2 className="text-lg font-black uppercase tracking-widest">System Integrations</h2>
                    <div className="bg-[#0a0a0b] border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">API Status</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                    <span className="text-[10px] font-black uppercase text-green-500">Global</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Database</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                    <span className="text-[10px] font-black uppercase text-green-500">Healthy</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Storage (AWS)</span>
                                <span className="text-[10px] font-black uppercase text-green-500 flex items-center gap-2">
                                     <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                    Active
                                </span>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button className="w-full h-14 bg-white/5 hover:bg-red-500/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-500 transition-all flex items-center justify-center gap-2">
                                <ShieldAlert className="w-4 h-4" />
                                Emergency Lockout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
