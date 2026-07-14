import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { Calendar, MapPin, Users, Star, ArrowRight, Plus, Search } from "lucide-react";

export const metadata = {
    title: "Discover Events — Gatherly",
    description: "Find upcoming events happening near you and around the world.",
};

// Revalidate every 60 seconds so newly published events appear without a full deploy
export const revalidate = 60;

export default async function DiscoverPage() {
    const session = await auth();

    const now = new Date();

    const [featuredEvents, upcomingEvents] = await Promise.all([
        // Featured events — always first
        prisma.event.findMany({
            where: {
                isHidden: false,
                isFeatured: true,
                status: { in: ["PUBLISHED", "ACTIVE"] },
                visibility: "PUBLIC",
                startDate: { gte: now },
            },
            orderBy: { startDate: "asc" },
            take: 6,
            select: {
                id: true,
                title: true,
                slug: true,
                startDate: true,
                location: true,
                locationType: true,
                coverImage: true,
                isFeatured: true,
                theme: true,
                host: { select: { id: true, name: true, image: true } },
                _count: { select: { rsvps: { where: { status: "ACCEPTED" } } } },
            },
        }),
        // Non-featured upcoming public events
        prisma.event.findMany({
            where: {
                isHidden: false,
                isFeatured: false,
                status: { in: ["PUBLISHED", "ACTIVE"] },
                visibility: "PUBLIC",
                startDate: { gte: now },
            },
            orderBy: { startDate: "asc" },
            take: 24,
            select: {
                id: true,
                title: true,
                slug: true,
                startDate: true,
                location: true,
                locationType: true,
                coverImage: true,
                isFeatured: true,
                theme: true,
                host: { select: { id: true, name: true, image: true } },
                _count: { select: { rsvps: { where: { status: "ACCEPTED" } } } },
            },
        }),
    ]);

    const allEvents = [...featuredEvents, ...upcomingEvents];
    const hasAny = allEvents.length > 0;

    return (
        <div className="min-h-screen bg-[#0a0a0b] text-white">
            {/* Ambient glow */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[80%] h-[50%] bg-green-900/20 blur-[160px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-900/15 blur-[140px] rounded-full" />
            </div>

            {/* Header */}
            <header className="relative z-10 border-b border-white/5 bg-black/30 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="relative w-9 h-9">
                            <Image src="/logo/logo-white.svg" alt="Gatherly" fill className="object-contain" />
                        </div>
                        <span className="text-xl font-black tracking-tighter">gatherly</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        {session ? (
                            <>
                                <Link href="/dashboard" className="text-sm font-bold text-white/50 hover:text-white transition-colors">
                                    Dashboard
                                </Link>
                                <Link
                                    href="/events/create"
                                    className="flex items-center gap-2 px-4 py-2 bg-white text-black text-sm font-black rounded-full hover:bg-white/90 transition-all active:scale-95"
                                >
                                    <Plus className="w-4 h-4" />
                                    Create Event
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link href="/auth/signin" className="text-sm font-bold text-white/50 hover:text-white transition-colors">
                                    Sign in
                                </Link>
                                <Link
                                    href="/auth/signup"
                                    className="px-4 py-2 bg-white text-black text-sm font-black rounded-full hover:bg-white/90 transition-all active:scale-95"
                                >
                                    Get started
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className="relative z-10 max-w-7xl mx-auto px-6 py-16 space-y-20">

                {/* Hero */}
                <section className="text-center space-y-6 pt-8">
                    <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5">
                        <Search className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-xs font-bold text-green-400 uppercase tracking-widest">Discover</span>
                    </div>
                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.05]">
                        Find your next<br />
                        <span className="bg-gradient-to-r from-green-400 via-yellow-400 to-emerald-400 bg-clip-text text-transparent">
                            unforgettable event
                        </span>
                    </h1>
                    <p className="text-xl text-white/50 font-medium max-w-xl mx-auto">
                        Upcoming public events from hosts on Gatherly. No invite needed.
                    </p>
                </section>

                {!hasAny ? (
                    /* ── Empty state ── */
                    <section className="py-32 flex flex-col items-center gap-6 border-2 border-dashed border-white/5 rounded-[3rem]">
                        <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center">
                            <Calendar className="w-10 h-10 text-white/20" />
                        </div>
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-black">No public events yet</h2>
                            <p className="text-white/40 text-sm">Be the first to host something amazing.</p>
                        </div>
                        <Link
                            href={session ? "/events/create" : "/auth/signup"}
                            className="flex items-center gap-2 px-6 py-3 bg-white text-black font-black rounded-full hover:bg-white/90 transition-all active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            Create an event
                        </Link>
                    </section>
                ) : (
                    <>
                        {/* ── Featured events ── */}
                        {featuredEvents.length > 0 && (
                            <section className="space-y-8">
                                <div className="flex items-center gap-3">
                                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                                    <h2 className="text-2xl font-black uppercase tracking-tight">Featured</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {featuredEvents.map(event => (
                                        <EventCard key={event.id} event={event} featured />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* ── All upcoming ── */}
                        {upcomingEvents.length > 0 && (
                            <section className="space-y-8">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-black uppercase tracking-tight">Upcoming</h2>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20">
                                        {upcomingEvents.length} event{upcomingEvents.length !== 1 ? "s" : ""}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {upcomingEvents.map(event => (
                                        <EventCard key={event.id} event={event} />
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}

                {/* CTA strip */}
                <section className="border border-white/5 bg-white/[0.02] rounded-[3rem] p-12 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-2">
                        <h3 className="text-3xl font-black tracking-tight">Host your own event</h3>
                        <p className="text-white/40 font-medium">Free to create. Stunning by default.</p>
                    </div>
                    <Link
                        href={session ? "/events/create" : "/auth/signup"}
                        className="flex items-center gap-2 px-8 py-4 bg-white text-black font-black rounded-full hover:bg-white/90 transition-all active:scale-95 whitespace-nowrap"
                    >
                        Get started free
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </section>
            </main>
        </div>
    );
}

/* ─── Event card sub-component ─────────────────────────────── */
function EventCard({ event, featured = false }: { event: any; featured?: boolean }) {
    const theme = typeof event.theme === "string" ? JSON.parse(event.theme) : (event.theme ?? {});
    const primaryColor: string = theme?.primaryColor ?? "#6366f1";

    const dateStr = event.startDate
        ? new Date(event.startDate).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
        })
        : null;

    const timeStr = event.startDate
        ? new Date(event.startDate).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
        })
        : null;

    return (
        <Link
            href={`/e/${event.slug}`}
            className={`group block rounded-[2rem] overflow-hidden border transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${
                featured
                    ? "border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40"
                    : "border-white/5 bg-white/[0.02] hover:border-white/20"
            }`}
        >
            {/* Cover image */}
            <div className="relative aspect-[4/3] overflow-hidden">
                {event.coverImage ? (
                    <Image
                        src={event.coverImage}
                        alt={event.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <div
                        className="w-full h-full"
                        style={{ background: `linear-gradient(135deg, ${primaryColor}33, ${primaryColor}11)` }}
                    >
                        <div className="w-full h-full flex items-center justify-center">
                            <Calendar className="w-12 h-12 text-white/10" />
                        </div>
                    </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Featured badge */}
                {featured && (
                    <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-amber-400/90 backdrop-blur-sm text-black px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
                        <Star className="w-3 h-3 fill-black" />
                        Featured
                    </div>
                )}

                {/* RSVP count */}
                <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
                    <Users className="w-3 h-3 text-white/60" />
                    <span className="text-[10px] font-black text-white/80">{event._count.rsvps}</span>
                </div>
            </div>

            {/* Info */}
            <div className="p-5 space-y-3">
                <h3 className="text-base font-black leading-snug tracking-tight line-clamp-2 group-hover:text-white/90 transition-colors">
                    {event.title}
                </h3>

                <div className="space-y-1.5">
                    {dateStr && (
                        <div className="flex items-center gap-2 text-white/40">
                            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="text-xs font-bold">{dateStr}{timeStr ? ` · ${timeStr}` : ""}</span>
                        </div>
                    )}
                    {event.location && (
                        <div className="flex items-center gap-2 text-white/40">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="text-xs font-medium truncate">{event.location}</span>
                        </div>
                    )}
                </div>

                {/* Host */}
                <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/30 flex items-center justify-center text-[9px] font-black text-emerald-300 flex-shrink-0 overflow-hidden relative">
                        {event.host?.image ? (
                            <Image src={event.host.image} alt="" fill className="object-cover" />
                        ) : (
                            event.host?.name?.charAt(0) ?? "?"
                        )}
                    </div>
                    <span className="text-[10px] font-bold text-white/30 truncate">
                        by {event.host?.name ?? "Unknown"}
                    </span>
                </div>
            </div>
        </Link>
    );
}
