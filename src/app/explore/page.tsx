import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";

export const metadata = {
    title: "Explore — JollyWitMe",
    description: "Find the best events and the communities behind them.",
};

// Revalidate every 60 seconds
export const revalidate = 60;

export default async function ExplorePage() {
    const publicEvents = await prisma.event.findMany({
        where: {
            isHidden: false,
            status: { in: ["PUBLISHED", "ACTIVE"] },
            visibility: "PUBLIC",
            startDate: { gte: new Date() },
        },
        orderBy: { startDate: "asc" },
        select: {
            id: true,
            title: true,
            slug: true,
            startDate: true,
            location: true,
            coverImage: true,
            host: { select: { id: true, name: true, image: true } },
            _count: { select: { rsvps: { where: { status: "ACCEPTED" } } } },
        },
    });

    const cities = ["Lagos", "Abuja", "Port Harcourt", "Ibadan"];
    const groupedEvents: Record<string, typeof publicEvents> = {};
    
    cities.forEach(city => groupedEvents[city] = []);

    publicEvents.forEach(event => {
        const loc = event.location?.toLowerCase() || "";
        let matched = false;
        for (const city of cities) {
            if (loc.includes(city.toLowerCase())) {
                groupedEvents[city].push(event);
                matched = true;
                break;
            }
        }
        
        // Pseudo-randomly assign unmatched events to Nigerian cities for demo purposes
        if (!matched) {
            let charCode = 0;
            for (let i = 0; i < event.id.length; i++) {
                charCode += event.id.charCodeAt(i);
            }
            const cityIndex = charCode % cities.length;
            groupedEvents[cities[cityIndex]].push(event);
        }
    });

    return (
        <div className="min-h-screen bg-[#0a0a0b] text-white">
            {/* Header placeholder space - since navbar is absolute */}
            <div className="h-20 w-full" />

            {/* Hero Section */}
            <section className="relative pt-20 pb-24 px-6 md:px-12 flex flex-col items-start overflow-hidden">
                <div className="absolute inset-0 z-0 overflow-hidden">
                    {/* Partiful style blurred colorful background */}
                    <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-orange-600/30 blur-[120px] rounded-full" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-rose-600/20 blur-[120px] rounded-full" />
                    <div className="absolute top-[20%] right-[20%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full" />
                    <div className="absolute inset-0 bg-[#0a0a0b]/40" />
                </div>
                
                <div className="relative z-10 w-full max-w-7xl mx-auto pt-10">
                    <h1 className="text-[5rem] md:text-[8rem] font-black text-white tracking-tighter leading-none mb-4 lowercase">
                        explore
                    </h1>
                    <p className="text-xl md:text-2xl text-white/90 font-medium mb-8 max-w-xl">
                        Find the best events and the communities behind them
                    </p>
                    <button className="bg-white text-black font-bold text-sm px-6 py-3.5 rounded-lg hover:bg-white/90 transition-colors">
                        See more on the app
                    </button>
                </div>
            </section>

            {/* Content Grid */}
            <main className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-20">
                    {cities.map(city => {
                        const events = groupedEvents[city];
                        if (events.length === 0) return null;
                        
                        return (
                            <div key={city} className="space-y-6">
                                <h2 className="text-5xl font-black text-white lowercase tracking-tight mb-8">
                                    {city}
                                </h2>
                                <div className="flex flex-col gap-4">
                                    {events.map(event => (
                                        <ExploreEventCard key={event.id} event={event} />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}

function ExploreEventCard({ event }: { event: any }) {
    const dateStr = event.startDate ? new Date(event.startDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "";
    const timeStr = event.startDate ? new Date(event.startDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "";
    
    // Format location short
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
                            {event.host.image ? (
                                <Image src={event.host.image} alt="" fill className="object-cover" sizes="20px" />
                            ) : null}
                        </div>
                        <span className="text-[12px] font-bold text-white/80 truncate">
                            {event.host.name} <span className="text-white/40 ml-0.5">&gt;</span>
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
                        {event._count.rsvps} Interested
                    </span>
                    <div className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center bg-white/5 group-hover:bg-white/10 transition-colors">
                        <Star className="w-3 h-3 text-white/60" />
                    </div>
                </div>
            </div>
        </Link>
    );
}
