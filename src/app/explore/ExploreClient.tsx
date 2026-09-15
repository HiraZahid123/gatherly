"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Sparkles, Calendar, MapPin } from "lucide-react";

export interface ExploreEvent {
    id: string;
    title: string;
    slug: string;
    description?: string | null;
    startDate: string | Date;
    location?: string | null;
    coverImage?: string | null;
    host: {
        id: string;
        name?: string | null;
        image?: string | null;
    };
    _count: {
        rsvps: number;
    };
}

const CATEGORIES = [
    { id: "all", label: "✨ All", keywords: [] },
    { id: "wedding", label: "💍 Wedding", keywords: ["wedding", "owambe", "marriage", "nuptial", "reception", "bride", "groom"] },
    { id: "birthday", label: "🎂 Birthdays", keywords: ["birthday", "bday", "born", "cake", "celebrat", "years"] },
    { id: "concert", label: "🎸 Concerts", keywords: ["concert", "music", "live", "band", "show", "dj", "festival", "rave", "tour"] },
    { id: "housewarming", label: "🏡 Housewarmings", keywords: ["housewarming", "home", "house", "apartment", "hangout", "cozy"] },
    { id: "dinner", label: "🍽️ Dinners", keywords: ["dinner", "brunch", "food", "feast", "supper", "lunch", "tasting", "dining"] },
    { id: "party", label: "☀️ Parties", keywords: ["party", "parties", "afters", "bash", "pool", "summer", "night", "club"] },
];

export default function ExploreClient({ initialEvents }: { initialEvents: ExploreEvent[] }) {
    const [selectedCategory, setSelectedCategory] = useState<string>("all");

    const filteredEvents = useMemo(() => {
        if (selectedCategory === "all") return initialEvents;

        const catConfig = CATEGORIES.find(c => c.id === selectedCategory);
        if (!catConfig || catConfig.keywords.length === 0) return initialEvents;

        const keywords = catConfig.keywords;
        return initialEvents.filter(event => {
            const searchable = `${event.title || ""} ${event.description || ""}`.toLowerCase();
            return keywords.some(kw => searchable.includes(kw));
        });
    }, [initialEvents, selectedCategory]);

    const cities = ["Lagos", "Abuja", "Port Harcourt", "Ibadan"];
    const groupedEvents = useMemo(() => {
        const grouped: Record<string, ExploreEvent[]> = {};
        cities.forEach(city => grouped[city] = []);

        filteredEvents.forEach(event => {
            const loc = event.location?.toLowerCase() || "";
            let matched = false;
            for (const city of cities) {
                if (loc.includes(city.toLowerCase())) {
                    grouped[city].push(event);
                    matched = true;
                    break;
                }
            }

            // Pseudo-randomly assign unmatched events to Nigerian cities for demo / discover display
            if (!matched) {
                let charCode = 0;
                for (let i = 0; i < event.id.length; i++) {
                    charCode += event.id.charCodeAt(i);
                }
                const cityIndex = charCode % cities.length;
                grouped[cities[cityIndex]].push(event);
            }
        });

        return grouped;
    }, [filteredEvents]);

    const totalCount = filteredEvents.length;

    return (
        <div className="min-h-screen bg-[#0a0a0b] text-white">
            {/* Header placeholder space */}
            <div className="h-20 w-full" />

            {/* Hero Section */}
            <section className="relative pt-20 pb-24 px-6 md:px-12 flex flex-col items-start overflow-hidden">
                <div className="absolute inset-0 z-0 overflow-hidden">
                    {/* Atmospheric colorful glows */}
                    <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-emerald-600/25 blur-[120px] rounded-full" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-orange-600/20 blur-[120px] rounded-full" />
                    <div className="absolute top-[20%] right-[20%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full" />
                    <div className="absolute inset-0 bg-[#0a0a0b]/40" />
                </div>

                <div className="relative z-10 w-full max-w-7xl mx-auto pt-10">
                    <h1 className="text-[5rem] md:text-[8rem] font-black text-white tracking-tighter leading-none mb-4 lowercase">
                        discover
                    </h1>
                    <p className="text-xl md:text-2xl text-white/90 font-medium mb-8 max-w-xl">
                        Find the best events happening around you and connect!
                    </p>

                    {/* Interactive Category Filter Buttons - On Page Filtering without navigation */}
                    <div className="flex flex-wrap gap-2.5 sm:gap-3 mt-6">
                        {CATEGORIES.map(category => {
                            const isSelected = selectedCategory === category.id;
                            return (
                                <button
                                    key={category.id}
                                    type="button"
                                    onClick={() => setSelectedCategory(category.id)}
                                    className={`text-sm font-bold px-5 py-2.5 rounded-full transition-all duration-300 ${
                                        isSelected
                                            ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.35)] scale-105"
                                            : "bg-white/10 hover:bg-white/20 border border-white/20 text-white hover:scale-105"
                                    }`}
                                >
                                    {category.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Content Grid */}
            <main className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-12">
                {totalCount === 0 ? (
                    <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-12 text-center max-w-lg mx-auto">
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                            <Sparkles className="w-6 h-6 text-white/60" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">
                            No {CATEGORIES.find(c => c.id === selectedCategory)?.label || "category"} events right now
                        </h3>
                        <p className="text-sm text-white/60 mb-6">
                            Be the first to host an unforgettable experience in this category.
                        </p>
                        <Link
                            href="/events/create"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black text-sm font-black rounded-full hover:bg-white/90 transition-all hover:scale-105"
                        >
                            Create Event
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-20">
                        {cities.map(city => {
                            const events = groupedEvents[city];
                            if (!events || events.length === 0) return null;

                            return (
                                <div key={city} className="space-y-6">
                                    <div className="flex items-baseline justify-between mb-8 border-b border-white/10 pb-4">
                                        <h2 className="text-4xl sm:text-5xl font-black text-white lowercase tracking-tight">
                                            {city}
                                        </h2>
                                        <span className="text-xs font-bold text-white/40 uppercase tracking-widest">
                                            {events.length} {events.length === 1 ? "event" : "events"}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-4">
                                        {events.map(event => (
                                            <ExploreEventCard key={event.id} event={event} />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}

function ExploreEventCard({ event }: { event: ExploreEvent }) {
    const dateStr = event.startDate
        ? new Date(event.startDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
        : "";
    const timeStr = event.startDate
        ? new Date(event.startDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
        : "";

    let shortLocation = event.location || "Location TBD";
    if (shortLocation.length > 25) {
        shortLocation = shortLocation.substring(0, 25) + "...";
    }

    return (
        <Link
            href={`/e/${event.slug}`}
            className="group flex bg-[#161616] rounded-[1.25rem] overflow-hidden hover:bg-[#1f1f1f] transition-all duration-300 border border-white/5 hover:border-white/10"
        >
            {/* Left Image */}
            <div className="w-[140px] sm:w-[160px] aspect-square relative flex-shrink-0">
                {event.coverImage ? (
                    <Image
                        src={event.coverImage}
                        alt={event.title}
                        fill
                        className="object-cover"
                        sizes="160px"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-green-800 to-emerald-900" />
                )}
            </div>

            {/* Right Content */}
            <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between min-w-0">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded-full overflow-hidden relative bg-white/20 shrink-0">
                            {event.host?.image ? (
                                <Image src={event.host.image} alt="" fill className="object-cover" sizes="20px" />
                            ) : null}
                        </div>
                        <span className="text-[12px] font-bold text-white/80 truncate">
                            {event.host?.name || "Host"} <span className="text-white/40 ml-0.5">&gt;</span>
                        </span>
                    </div>
                    <h3 className="text-lg font-bold text-white leading-tight mb-1.5 group-hover:text-green-400 transition-colors line-clamp-2">
                        {event.title}
                    </h3>
                    <p className="text-[12px] text-white/50 font-medium">
                        {dateStr}{timeStr ? ` at ${timeStr}` : ""}
                        <span className="mx-1.5 opacity-50">•</span>
                        {shortLocation}
                    </p>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.06]">
                    <span className="text-[12px] font-bold text-white/50">
                        {event._count?.rsvps ?? 0} Interested
                    </span>
                    <div className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center bg-white/5 group-hover:bg-white/10 transition-colors">
                        <Star className="w-3 h-3 text-white/60" />
                    </div>
                </div>
            </div>
        </Link>
    );
}
