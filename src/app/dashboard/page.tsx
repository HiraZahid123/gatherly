"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Plus, Bell, Globe, HelpCircle, MoreHorizontal, Banknote } from "lucide-react";
import CreatorPayoutsSection from "@/components/dashboard/CreatorPayoutsSection";

interface DashboardEvent {
    id: string;
    title: string;
    slug: string;
    startDate?: string;
    createdAt?: string;
    location?: string;
    coverImage?: string;
    type?: string;
    status?: string;
    theme?: {
        backgroundTheme?: string;
    };
    isHosting?: boolean;
    userRsvpStatus?: string;
    host?: {
        id: string;
        name: string;
        image?: string;
    };
}

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [showDropdown, setShowDropdown] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [events, setEvents] = useState<DashboardEvent[]>([]);
    const [activeTab, setActiveTab] = useState("Hosting");
    const [isEventsLoading, setIsEventsLoading] = useState(true);
    const [draftSavedToast, setDraftSavedToast] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            if (params.get("draftSaved") === "true") {
                setDraftSavedToast(true);
                window.history.replaceState({}, "", "/dashboard");
                setTimeout(() => setDraftSavedToast(false), 6000);
            }
        }
    }, []);

    useEffect(() => {
        if (status === "authenticated") {
            fetchStats();
            fetchEvents();
            fetchNotifications();
        }
    }, [status]);

    const fetchNotifications = async () => {
        try {
            const response = await fetch("/api/notifications", { cache: "no-store" });
            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications || []);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    };

    const markNotificationRead = async (id: string) => {
        await fetch("/api/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        });
        setNotifications((current) => current.map((notification) =>
            notification.id === id ? { ...notification, isRead: true } : notification
        ));
    };

    const fetchStats = async () => {
        try {
            const response = await fetch("/api/events/stats");
            const data = await response.json();
            if (data.success) {
                // Mocking more specific stats for the tabs based on the screenshot
                // setStats(...) removed as it's unused
            }
        } catch (error) {
            console.error("Failed to fetch stats:", error);
        }
    };

    const fetchEvents = async () => {
        try {
            const response = await fetch("/api/events/my-events", { cache: "no-store" });
            const data = await response.json();
            if (data.success) {
                setEvents(data.events);
            }
        } catch (error) {
            console.error("Failed to fetch events:", error);
        } finally {
            setIsEventsLoading(false);
        }
    };

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
        }
    }, [status, router]);

    const userCards = useMemo(() => events.filter(e => e.type === "CARD"), [events]);
    // Events the current user is hosting
    const hosted = useMemo(() => events.filter(e => e.isHosting && e.type !== "CARD"), [events]);
    // Events the current user RSVPd to but didn't create
    const attending = useMemo(() => events.filter(e => !e.isHosting && e.type !== "CARD"), [events]);

    const filteredEvents = useMemo(() => {
        const now = new Date();
        if (activeTab === "Upcoming")       return hosted.filter(e => e.status !== "DRAFT" && e.startDate && new Date(e.startDate) >= now);
        if (activeTab === "Hosting")        return hosted;
        if (activeTab === "Drafts")         return hosted.filter(e => e.status === "DRAFT");
        if (activeTab === "Open invite")    return attending.filter(e => e.startDate && new Date(e.startDate) >= now);
        if (activeTab === "Attended")       return attending.filter(e => e.startDate && new Date(e.startDate) < now);
        if (activeTab === "All past events") return hosted.filter(e => e.status !== "DRAFT" && e.startDate && new Date(e.startDate) < now);
        return [];
    }, [hosted, attending, activeTab]);

    const displayStats = useMemo(() => {
        const now = new Date();
        return {
            upcoming: hosted.filter(e => e.status !== "DRAFT" && e.startDate && new Date(e.startDate) >= now).length,
            hosting:  hosted.length,
            drafts:   hosted.filter(e => e.status === "DRAFT").length,
            open:     attending.filter(e => e.startDate && new Date(e.startDate) >= now).length,
            attended: attending.filter(e => e.startDate && new Date(e.startDate) < now).length,
            past:     hosted.filter(e => e.status !== "DRAFT" && e.startDate && new Date(e.startDate) < now).length,
        };
    }, [hosted, attending]);

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
        );
    }

    if (!session) return null;

    return (
        <div className="min-h-screen text-white relative font-sans antialiased overflow-x-hidden bg-[#0a0a0b]">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100%] h-[60%] bg-gradient-to-b from-green-900/20 via-emerald-950/10 to-transparent blur-[120px]"></div>
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-rose-500/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/5 blur-[120px] rounded-full"></div>
            </div>

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/5 shadow-2xl">
                <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center group">
                        <div className="relative h-11 w-44 transition-transform group-hover:scale-105">
                            <Image src="/logo/logo-full.webp" alt="JollyWitMe Logo" fill className="object-contain" priority />
                        </div>
                    </Link>

                    <div className="flex items-center gap-3 sm:gap-8">
                        <Link href="/events/create" className="flex items-center gap-2 px-4 sm:px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-black transition-all border border-white/10 active:scale-95">
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Create</span>
                        </Link>
                        {session.user.role === "ADMIN" && (
                            <Link href="/admin" className="text-sm font-black text-red-500 hover:text-red-400 transition-colors hidden md:block">
                                Admin Panel
                            </Link>
                        )}
                        <Link href="/blog" className="text-sm font-black text-white/50 hover:text-white transition-colors hidden md:block">Blog</Link>
                        <div className="flex items-center gap-3 sm:gap-6 border-l border-white/10 pl-3 sm:pl-8">
                            <Link href="/help" aria-label="Help center" title="Help center" className="hidden sm:block">
                                <HelpCircle className="w-5 h-5 text-white/30 hover:text-white transition-colors" />
                            </Link>
                            <Link href="/explore" aria-label="Explore events" title="Explore events" className="hidden sm:block">
                                <Globe className="w-5 h-5 text-white/30 hover:text-white transition-colors" />
                            </Link>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    aria-label="Notifications"
                                    title="Notifications"
                                    className="text-white/30 hover:text-white transition-colors"
                                >
                                    <Bell className="w-5 h-5" />
                                    {notifications.some((notification) => !notification.isRead) && (
                                        <span className="absolute -right-1 -top-1 w-2 h-2 rounded-full bg-green-400 ring-2 ring-[#0a0a0b]" />
                                    )}
                                </button>
                                {showNotifications && (
                                    <div className="absolute right-0 top-10 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-white/10 bg-[#1a1a1b] shadow-2xl overflow-hidden">
                                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                                            <span className="text-xs font-black uppercase tracking-widest text-white">Notifications</span>
                                            {notifications.some((notification) => !notification.isRead) && (
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: "{}" });
                                                        setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })));
                                                    }}
                                                    className="text-[10px] font-bold text-green-400 hover:text-green-300"
                                                >
                                                    Mark all read
                                                </button>
                                            )}
                                        </div>
                                        <div className="max-h-80 overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <p className="p-4 text-xs font-semibold text-white/50">No new notifications</p>
                                            ) : notifications.map((notification) => (
                                                <Link
                                                    key={notification.id}
                                                    href={notification.link || "/dashboard"}
                                                    onClick={() => markNotificationRead(notification.id)}
                                                    className={`block px-4 py-3 border-b border-white/5 hover:bg-white/5 ${notification.isRead ? "opacity-60" : ""}`}
                                                >
                                                    <p className="text-xs font-bold text-white">{notification.title}</p>
                                                    <p className="mt-1 text-xs text-white/50">{notification.message}</p>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="relative">
                                <button
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500/80 to-emerald-500/80 p-[2px] hover:scale-105 active:scale-95 transition-all relative"
                                    aria-label="User menu"
                                    title="Open user menu"
                                >
                                    <div className="w-full h-full rounded-full bg-[#0a0a0b] flex items-center justify-center overflow-hidden">
                                        {session.user.image ? (
                                            <Image src={session.user.image} alt="User" width={40} height={40} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-sm font-black text-white">{(session.user.name?.charAt(0) || "U").toUpperCase()}</span>
                                        )}
                                    </div>
                                </button>

                                {showDropdown && (
                                    <div className="absolute right-0 top-14 w-56 bg-[#1a1a1b] border border-white/10 rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] py-2 z-50 overflow-hidden backdrop-blur-2xl">
                                        <div className="px-5 py-3 border-b border-white/5 mb-1 bg-white/5">
                                            <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Signed in as</p>
                                            <p className="text-xs font-bold truncate text-white/90">{session.user.email}</p>
                                        </div>
                                        <Link href="/profile" className="block px-5 py-2.5 text-sm font-bold text-white/70 hover:text-white hover:bg-white/5 transition-colors">Profile Settings</Link>
                                        <div className="h-px bg-white/5 mx-2 my-1" />
                                        <button onClick={() => signOut()} className="w-full text-left px-5 py-2.5 text-sm font-bold text-red-500 hover:bg-red-500/10 transition-colors">Sign Out</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="relative z-10 max-w-[1400px] mx-auto px-6 pt-32 pb-48">
                {/* Draft Saved Toast Banner */}
                {draftSavedToast && (
                    <div className="mb-8 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between text-white backdrop-blur-md animate-in fade-in slide-in-from-top-4">
                        <div className="flex items-center gap-3">
                            <span className="text-xl">🎉</span>
                            <p className="text-sm font-bold text-emerald-300">
                                Event draft saved successfully! You can find and continue editing it anytime in the <span className="underline cursor-pointer" onClick={() => setActiveTab("Drafts")}>Drafts</span> tab.
                            </p>
                        </div>
                        <button
                            onClick={() => setDraftSavedToast(false)}
                            className="text-xs font-bold text-white/60 hover:text-white px-3 py-1 bg-white/10 rounded-full transition-colors"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {/* Greeting */}
                <section className="mb-12">
                    <h1 className="text-5xl font-black tracking-tight mb-2">Welcome back {session.user.name?.split(" ")[0] ?? "User"}!</h1>
                    <p className="text-xl text-white/60 font-medium">
                        {displayStats.upcoming > 0
                            ? <>You have <span className="text-white font-bold">{displayStats.upcoming} upcoming event{displayStats.upcoming !== 1 ? "s" : ""}</span> you&apos;re hosting.</>
                            : displayStats.open > 0
                            ? <>You&apos;re going to <span className="text-white font-bold">{displayStats.open} upcoming event{displayStats.open !== 1 ? "s" : ""}</span>.</>
                            : "No upcoming events. Create one or find something to attend."
                        }
                    </p>
                </section>

                {/* Tabs & Search */}
                <div className="flex flex-col gap-6 mb-8">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
                        <button
                            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 transition-colors shrink-0"
                            aria-label="Search events"
                            title="Search events"
                        >
                            <Search className="w-5 h-5 text-white/60" />
                        </button>
                        {[
                            { name: "Upcoming",        count: displayStats.upcoming },
                            { name: "Hosting",         count: displayStats.hosting },
                            { name: "Drafts",          count: displayStats.drafts },
                            { name: "Open invite",     count: displayStats.open },
                            { name: "Attended",        count: displayStats.attended },
                            { name: "All past events", count: displayStats.past },
                            { name: "Earnings & Payouts", count: 0, isFinancial: true },
                        ].map((tab) => (
                            <button
                                key={tab.name}
                                onClick={() => setActiveTab(tab.name)}
                                className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeTab === tab.name
                                    ? tab.isFinancial
                                        ? "bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                                        : "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                                    : tab.isFinancial
                                        ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20"
                                        : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                                    }`}
                            >
                                {tab.isFinancial && <Banknote className="w-3.5 h-3.5" />}
                                <span>{tab.name}</span>
                                {tab.count > 0 && <span className="opacity-40">{tab.count}</span>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* View: Earnings & Payouts vs Events Grid */}
                {activeTab === "Earnings & Payouts" ? (
                    <CreatorPayoutsSection />
                ) : isEventsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="aspect-square bg-white/5 rounded-2xl animate-pulse"></div>
                        ))}
                    </div>
                ) : filteredEvents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10 group/grid">
                        {filteredEvents.map((event: DashboardEvent) => (
                            <Link 
                                key={event.id} 
                                href={event.status === "DRAFT" ? `/events/${event.id}/edit` : `/e/${event.slug}`} 
                                className="group/card block space-y-4"
                            >
                                <div className="aspect-square rounded-[32px] overflow-hidden bg-white/5 relative shadow-2xl transition-all duration-500 group-hover/card:scale-[1.02] group-hover/card:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)]">
                                    <Image
                                        src={event.coverImage || "/partiful/Aquarius.avif"}
                                        alt={event.title}
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute top-4 left-4 flex gap-2">
                                        {event.status === "DRAFT" ? (
                                            <span className="px-3 py-1 bg-amber-500 text-black font-black text-[10px] tracking-widest uppercase rounded-full shadow-lg">
                                                📝 Draft
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-[10px] font-black tracking-widest uppercase truncate max-w-[100px] text-white">
                                                {event.location || "TBD"}
                                            </span>
                                        )}
                                    </div>
                                    <div className="absolute top-4 right-4">
                                        <button
                                            className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-black/60 transition-colors"
                                            aria-label="More options"
                                            title="More options"
                                        >
                                            <MoreHorizontal className="w-5 h-5 text-white" />
                                        </button>
                                    </div>
                                    <div className="absolute bottom-4 right-4">
                                        {event.status === "DRAFT" ? (
                                            <div className="px-3 py-1 bg-amber-400 text-black rounded-md text-[9px] font-black tracking-widest uppercase flex items-center gap-1 shadow-lg">
                                                ✏️ Continue Draft
                                            </div>
                                        ) : event.isHosting ? (
                                            <div className="px-3 py-1 bg-[#facc15] text-black rounded-md text-[9px] font-black tracking-widest uppercase flex items-center gap-1 shadow-lg">
                                                👑 Hosting
                                            </div>
                                        ) : event.userRsvpStatus === "ACCEPTED" ? (
                                            <div className="px-3 py-1 bg-green-500 text-white rounded-md text-[9px] font-black tracking-widest uppercase flex items-center gap-1 shadow-lg">
                                                ✅ Going
                                            </div>
                                        ) : event.userRsvpStatus === "MAYBE" ? (
                                            <div className="px-3 py-1 bg-amber-400 text-black rounded-md text-[9px] font-black tracking-widest uppercase shadow-lg">
                                                🤔 Maybe
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                                <div className="space-y-1.5 px-2">
                                    <h3 className="text-xl font-black tracking-tight group-hover/card:text-white/90 transition-colors truncate">{event.title}</h3>
                                    {event.status === "DRAFT" ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-amber-400 font-bold">Saved draft</span>
                                            <span className="text-white/30">•</span>
                                            <span className="text-xs text-white/50 hover:text-white transition-colors">Click to continue editing &rarr;</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-white/40 font-bold uppercase tracking-widest">Hosted by</span>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-black ring-1 ring-white/20">
                                                    {event.host?.name?.charAt(0) || "U"}
                                                </div>
                                                <span className="text-xs font-black tracking-tight">{event.host?.name || "Unknown"}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[40px] bg-white/[0.02]">
                        <p className="text-white/40 font-bold">No events found in this category</p>
                    </div>
                )}

                {/* Your Cards Section */}
                <section className="mt-32">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-3xl font-black tracking-tight">Your Cards</h2>
                            <p className="text-white/40 font-bold text-sm">All the cards you&apos;ve created</p>
                        </div>
                        <Link href="/cards/create" className="flex items-center gap-2 px-6 py-2 bg-white/5 hover:bg-white/10 rounded-full text-sm font-black tracking-tight transition-all border border-white/10">
                            <Plus className="w-4 h-4" />
                            <span>New card</span>
                        </Link>
                    </div>

                    <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide no-scrollbar -mx-6 px-6">
                        {userCards.length > 0 ? (
                            userCards.map((card: DashboardEvent) => {
                                // Extract color/theme info from card.theme
                                const backgroundTheme = card.theme?.backgroundTheme || "dark";
                                let colorStyle = {};

                                if (backgroundTheme.startsWith("custom-gradient:")) {
                                    const color = backgroundTheme.split(":")[1];
                                    colorStyle = { background: `linear-gradient(to bottom right, ${color}, #000000)` };
                                } else if (backgroundTheme === 'streak') {
                                    colorStyle = { background: `linear-gradient(to bottom right, #1f2937, #0f172a)` };
                                } else if (backgroundTheme === 'meadow') {
                                    colorStyle = { background: `linear-gradient(to bottom right, #34d399, #134e4a)` };
                                } else {
                                    colorStyle = { background: `linear-gradient(to bottom right, #60a5fa, #a855f7)` };
                                }

                                return (
                                    <Link
                                        key={card.id}
                                        href={`/c/${card.slug}`}
                                        className="min-w-[280px] bg-white/5 rounded-[32px] overflow-hidden border border-white/5 relative group cursor-pointer transition-transform hover:scale-[1.02]"
                                    >
                                        <div className="h-48 opacity-40 absolute inset-0" style={colorStyle}></div>
                                        <div className="relative p-6 h-full flex flex-col justify-end min-h-[320px]">
                                            <div className="flex-1 flex items-center justify-center">
                                                <div className="w-32 h-40 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl flex flex-col p-4 relative overflow-hidden">
                                                    {card.coverImage ? (
                                                        <Image src={card.coverImage} alt="Cover" fill className="object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-gray-200/20 rounded-lg flex items-center justify-center text-3xl">✉️</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="text-xl font-black tracking-tight truncate">{card.title}</h4>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                                                    created {card.createdAt && new Date(card.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })
                        ) : (
                            <div className="py-12 px-12 border-2 border-dashed border-white/5 rounded-[40px] bg-white/[0.02] w-full text-center">
                                <p className="text-white/40 font-bold">No cards created yet</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Mutuals Section */}
                <section className="mt-32 text-center">
                    <h2 className="text-3xl font-black tracking-tight mb-8 text-left">Mutuals</h2>
                    <div className="py-24 space-y-6">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl mx-auto flex items-center justify-center text-3xl">
                            😐
                        </div>
                        <div className="space-y-2">
                            <p className="text-xl font-black">No mutuals yet</p>
                            <p className="text-white/40 font-medium">Check back here when you go to your first event!</p>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/5 bg-black/20 backdrop-blur-xl py-12">
                <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
                    <Link href="/events/create" className="flex items-center gap-2 group">
                        <span className="text-lg font-black tracking-tight group-hover:underline">Create an event for free 🪄</span>
                    </Link>
                    <div className="flex items-center gap-8 text-sm font-black text-white/40">
                        <Link href="/help" className="hover:text-white transition-colors">Help Center</Link>
                        <span className="opacity-20">|</span>
                        <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
                        <span className="opacity-20">|</span>
                        <Link href="/explore" className="hover:text-white transition-colors">Discover</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
