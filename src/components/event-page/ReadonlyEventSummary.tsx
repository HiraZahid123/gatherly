import Image from "next/image";
import { Calendar, Crown, MapPin, Users, DollarSign, User, Link as LinkIcon, Info, Music, Gift, Shirt, Utensils, Car, Bed, ArrowLeft } from "lucide-react";
import { VIBE_THEMES } from "@/lib/theme";
import { format } from "date-fns";
import { useSession } from "next-auth/react";

interface ReadonlyEventSummaryProps {
    event: any;
}

const LINK_ICONS = {
    Link: LinkIcon,
    Info: Info,
    Music: Music,
    Gift: Gift,
    Shirt: Shirt,
    Utensils: Utensils,
    Car: Car,
    Bed: Bed,
};

export default function ReadonlyEventSummary({ event }: ReadonlyEventSummaryProps) {
    const { data: session } = useSession();
    const vibeId = event.theme?.vibeId || "classic";
    const currentVibe = VIBE_THEMES.find(v => v.id === vibeId) || VIBE_THEMES[0];
    const startDate = event.startDate ? new Date(event.startDate) : null;
    const endDate = event.endDate ? new Date(event.endDate) : null;

    return (
        <div className="space-y-10 text-white animate-in fade-in slide-in-from-left-4 duration-1000 max-w-xl">
            {/* Header Section (Title) - Matches Title Box Spacing */}
            <div className="p-5 pb-3">
                <div className="flex items-center gap-4 text-white/40 mb-6 -ml-1">
                    <ArrowLeft className="w-6 h-6 cursor-pointer hover:text-white transition-all hover:-translate-x-1" onClick={() => window.history.back()} />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Event Preview</span>
                </div>

                <h1 className={`text-5xl md:text-7xl text-white tracking-tighter leading-[0.9] ${currentVibe.fontClass} drop-shadow-2xl`}>
                    {event.title || "Untitled Event"}
                </h1>
            </div>

            {/* Date Section - Matches Date Input Box Spacing */}
            <div className="space-y-4 pt-2">
                <div className="px-6">
                    <div className="text-2xl md:text-3xl font-medium tracking-tight text-white/90 drop-shadow-xl">
                        {startDate ? (
                            <>
                                {format(startDate, "EEEE, MMMM d")}
                                {endDate && !startDate.toLocaleDateString().includes(endDate.toLocaleDateString()) && (
                                    <span className="text-white/40 block mt-1 text-2xl">— {format(endDate, "EEEE, MMMM d")}</span>
                                )}
                            </>
                        ) : (
                            "Date & Time TBD"
                        )}
                    </div>
                    {startDate && (
                        <div className="text-xl md:text-xl font-medium text-white/60 mt-1">
                            {format(startDate, "h:mm a")}
                            {endDate && (
                                <span className="opacity-60 ml-2">
                                    — {format(endDate, "h:mm a")}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Metadata Stack - Matches Stacked Box Spacing */}
            <div className="space-y-0 border-y border-white/5 py-2">
                {/* Host */}
                <div className="flex items-center gap-4 px-6 py-5 group">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-green-500 p-0.5 shadow-xl ring-2 ring-white/10 flex items-center justify-center">
                            <div className="w-full h-full rounded-full overflow-hidden relative border-2 border-black bg-neutral-900">
                                {event.host?.image || (session?.user?.id === event.hostId ? session?.user?.image : null) ? (
                                    <Image
                                        src={event.host?.image || (session?.user?.id === event.hostId ? session?.user?.image : "")}
                                        alt={event.host?.name || ""}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-neutral-900 flex items-center justify-center text-lg font-bold">
                                        {event.host?.name?.charAt(0).toUpperCase() || "H"}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-black">
                            <Crown className="w-3 h-3 text-black" fill="currentColor" />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-0.5">Hosted by</span>
                        <span className="text-xl font-bold tracking-tight text-white">
                            {event.host?.name || "JollyWitMe Host"}
                            {event.theme?.hostNickname && <span className="text-white/40 ml-2 font-medium">({event.theme.hostNickname})</span>}
                        </span>
                    </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-4 px-6 py-4 text-white/80 group">
                    <div className="w-5 h-5 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
                    </div>
                    <span className={`text-base font-bold tracking-tight ${event.location ? 'text-white' : 'text-white/20'}`}>
                        {event.location?.replace(" @ ", ", ") || "No Location Set"}
                    </span>
                </div>



                {/* Capacity */}
                <div className="flex items-center gap-4 px-6 py-4 text-white/80 group">
                    <div className="w-5 h-5 flex items-center justify-center">
                        <Users className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
                    </div>
                    <span className="text-base font-bold tracking-tight">
                        {event.capacity ? `${event.capacity} spots available` : "Unlimited spots"}
                    </span>
                </div>

                {/* Cost */}
                {event.theme?.settings?.cost && (
                    <div className="flex items-center gap-4 px-6 py-4 text-white/80 group">
                        <div className="w-5 h-5 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
                        </div>
                        <span className="text-base font-bold tracking-tight">
                            {event.theme.settings.cost}
                        </span>
                    </div>
                )}

                {/* RSVP Deadline */}
                {event.rsvpDeadline && (
                    <div className="flex items-center gap-4 px-6 py-4 text-white/80 group">
                        <div className="w-5 h-5 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
                        </div>
                        <span className="text-base font-bold tracking-tight text-white/90">
                            RSVP by {format(new Date(event.rsvpDeadline), "MMMM d, h:mm a")}
                        </span>
                    </div>
                )}

                {/* Links */}
                {event.theme?.links?.map((link: any) => {
                    const Icon = (LINK_ICONS as any)[link.icon] || LinkIcon;
                    return (
                        <div key={link.id} className="flex items-center gap-4 px-6 py-4 group">
                            <div className="w-5 h-5 flex items-center justify-center">
                                <Icon className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <a href={link.url} target="_blank" rel="noopener noreferrer" className="block text-base font-bold text-white/90 truncate hover:text-white transition-colors">
                                    {link.url.replace(/^https?:\/\//, '')}
                                </a>
                                {link.text && link.text !== 'Link' && (
                                    <div className="text-xs font-bold text-white/40 truncate">{link.text}</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Description & Sections */}
            {(event.description || (event.theme?.sections?.length > 0)) && (
                <div className="space-y-8 pt-4">
                    {event.description && (
                        <div className="px-6 py-4">
                            <p className="text-lg font-medium text-white/80 leading-relaxed whitespace-pre-wrap">
                                {event.description}
                            </p>
                        </div>
                    )}

                    {event.theme?.sections?.map((section: any) => (
                        <div key={section.id} className="px-8 py-6 space-y-4">
                            <h3 className="text-xl font-black text-white uppercase tracking-wider">{section.title}</h3>
                            <p className="text-lg font-medium text-white/70 leading-relaxed whitespace-pre-wrap">
                                {section.content}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
