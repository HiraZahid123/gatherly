"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import { applyTheme } from "@/lib/theme";

// Components
import ReadonlyEventSummary from "@/components/event-page/ReadonlyEventSummary";
import RSVPActions from "@/components/event-page/RSVPActions";
import GuestListPreview from "@/components/event-page/GuestListPreview";
import PhotoAlbum from "@/components/event-page/PhotoAlbum";
import ActivityFeed from "@/components/event-page/ActivityFeed";
import HostSidebar from "@/components/event-page/HostSidebar";
import ChatSystem from "@/components/event-page/ChatSystem";
import FloatingParticles from "@/components/FloatingParticles";
import FlyerModal from "@/components/event-page/FlyerModal";
import AnnouncementsSection from "@/components/event-page/AnnouncementsSection";
import RSVPModal from "@/components/RSVPModal";
import TicketCheckoutDrawer from "@/components/TicketCheckoutDrawer";
import ShareEventModal from "@/components/event-page/ShareEventModal";
import Confetti from "@/components/vfx/Confetti";
import Rain from "@/components/vfx/Rain";
import { BackgroundVideo } from "@/components/BackgroundVideo";
import { QrCode, Ticket, Calendar, Share2, Sparkles, Settings } from "lucide-react";
import { getCalendarLinks } from "@/lib/calendar";
import { IMAGE_VFX_PRESETS, VIDEO_VFX_PRESETS } from "@/components/EffectSelector";
import { ANIMATED_THEME_PRESETS } from "@/components/ThemeSelector";
import SafeLottiePlayer from "@/components/SafeLottiePlayer";

// Lazy-load EventSettingsModal — 31 Lucide icons, only needed when host opens Settings
const EventSettingsModal = dynamic(() => import("@/components/EventSettingsModal"), { ssr: false });

// Dynamically import InteractiveBackground (Three.js — client only)
const InteractiveBackground = dynamic(
    () => import("@/components/InteractiveBackground"),
    { ssr: false }
);

const VfxCanvasClient = dynamic(
    () => import("@/components/vfx/VfxCanvas"),
    { ssr: false }
);

const CustomFloatingVfxClient = dynamic(
    () => import("@/components/vfx/CustomFloatingVfx"),
    { ssr: false }
);

const INTERACTIVE_THEMES = ['streak', 'meadow', 'crystal', 'waves'];

interface PublicEventClientProps {
    initialEvent: any;
    initialGuests: any[];
    initialComments: any[];
    initialTicketTiers?: any[];
    slug: string;
}

export default function PublicEventClient({
    initialEvent,
    initialGuests,
    initialComments,
    initialTicketTiers = [],
    slug
}: PublicEventClientProps) {
    const router = useRouter();
    const { data: session } = useSession();
    const searchParams = useSearchParams();

    // State
    const [event, setEvent] = useState(initialEvent);
    const [comments, setComments] = useState(initialComments);
    const [guests, setGuests] = useState(initialGuests);
    const [myRSVP, setMyRSVP] = useState<any>(null);

    // Modals & UI
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [settingsTab, setSettingsTab] = useState("Hosts");
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [isCloning, setIsCloning] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isFlyerOpen, setIsFlyerOpen] = useState(false);
    const [isRSVPModalOpen, setIsRSVPModalOpen] = useState(false);
    const [rsvpInitialStatus, setRsvpInitialStatus] = useState<any>(null);
    const [isRSVPLoading, setIsRSVPLoading] = useState(false);
    const [selectedGuestForChat, setSelectedGuestForChat] = useState<any>(null);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [isCalendarDropdownOpen, setIsCalendarDropdownOpen] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [ticketTiers] = useState(initialTicketTiers);
    const [announceFocusTrigger, setAnnounceFocusTrigger] = useState(0);
    const isHost = session?.user?.id === event.hostId;
    const isCoHost = event.theme?.settings?.hosts?.cohosts?.some((c: any) => 
        (c.id && c.id === session?.user?.id) || 
        (c.email && c.email === session?.user?.email)
    );
    const isStaff = event.staff?.some((s: any) => s.userId === session?.user?.id);
    const hasAdminAccess = isHost || isCoHost;

    // Auto-open Share Sheet if URL contains created=true or share=true
    useEffect(() => {
        if (searchParams.get("created") === "true" || searchParams.get("share") === "true") {
            setIsShareOpen(true);
        }
    }, [searchParams]);

    // Apply theme on mount
    useEffect(() => {
        if (event?.theme) {
            applyTheme(event.theme);
        }
    }, [event?.theme]);

    // Fetch My RSVP status
    useEffect(() => {
        if (event?.id && session?.user?.id) {
            fetchMyRSVP();
        }
    }, [event?.id, session?.user?.id]);

    // SOCKET.IO: Real-time updates for activities (Guests & Comments)
    useEffect(() => {
        if (!event?.id) return;

        const socket = (require('@/lib/socket').getSocket)();
        if (!socket) return;

        // Join the event room
        socket.emit('join-event', event.id);

        // Listen for new comments
        const handleNewComment = () => {
            console.log('[Socket] New comment received');
            fetchComments();
        };

        // Listen for RSVP updates
        const handleRSVPUpdate = () => {
            console.log('[Socket] RSVP update received');
            fetchGuests();
        };

        socket.on('new-comment', handleNewComment);
        socket.on('rsvp-update', handleRSVPUpdate);

        if (session?.user?.id) {
            socket.emit('join-user', session.user.id);
        }

        // Fetch once immediately
        fetchGuests();
        fetchComments();

        return () => {
            socket.off('new-comment', handleNewComment);
            socket.off('rsvp-update', handleRSVPUpdate);
        };
    }, [event?.id]);

    // Handle Deep-linked Ticket
    useEffect(() => {
        const ticketToken = searchParams.get('ticket');
        if (ticketToken && guests.length > 0) {
            const guestWithTicket = guests.find(g => g.qrToken === ticketToken);
            if (guestWithTicket) {
                setMyRSVP(guestWithTicket);
                setIsRSVPModalOpen(true);
                setRsvpInitialStatus(guestWithTicket.status);
                
                // Clear the param to prevent re-opening on manual refreshes
                const newUrl = window.location.pathname;
                window.history.replaceState({}, '', newUrl);
            }
        }
    }, [searchParams, guests]);

    const fetchMyRSVP = async () => {
        try {
            const response = await fetch(`/api/events/${event.id}/rsvp`);
            const data = await response.json();
            if (data.success) {
                setMyRSVP(data.rsvp);
            }
        } catch (error) {
            console.error("Failed to fetch my RSVP:", error);
        }
    };

    const fetchGuests = async () => {
        try {
            const response = await fetch(`/api/events/${event.id}/guests`);
            const data = await response.json();
            if (data.success) {
                setGuests(data.guests);
            }
        } catch (error) {
            console.error("Failed to fetch guests:", error);
        }
    };

    const fetchComments = async () => {
        try {
            const res = await fetch(`/api/comments?eventId=${event.id}`);
            const data = await res.json();
            if (Array.isArray(data)) setComments(data);
        } catch (e) {
            console.error("Failed to fetch comments", e);
        }
    };

    const handleRSVPSuccess = () => {
        fetchGuests();
        fetchMyRSVP();
        const fetchEvent = async () => {
            const response = await fetch(`/api/events/by-slug?slug=${slug}`);
            const data = await response.json();
            if (data.success) setEvent(data.event);
        };
        fetchEvent();
    };

    const handleRSVP = async (selectedStatus: "ACCEPTED" | "MAYBE" | "DECLINED") => {
        if (!session) {
            // Guest mode: open modal to get details
            setRsvpInitialStatus(selectedStatus);
            setIsRSVPModalOpen(true);
            return;
        }

        // Authenticated mode: submit inline
        setIsRSVPLoading(true);
        try {
            // Undo logic: if clicking the same status, remove the RSVP
            if (myRSVP?.status === selectedStatus) {
                const response = await fetch(`/api/events/${event.id}/rsvp`, {
                    method: "DELETE"
                });
                const data = await response.json();
                if (data.success) {
                    setMyRSVP(null);
                    setToastMessage("RSVP removed");
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 3000);
                    handleRSVPSuccess();
                } else {
                    setToastMessage(data.error || "Failed to remove RSVP");
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 3000);
                }
                return;
            }

            const response = await fetch(`/api/events/${event.id}/rsvp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: selectedStatus,
                    guestName: session.user.name || "",
                    guestEmail: session.user.email || "",
                }),
            });
            const data = await response.json();
            if (data.success) {
                setMyRSVP(data.rsvp);
                setToastMessage(`RSVP updated: ${selectedStatus === 'ACCEPTED' ? 'Going' : selectedStatus === 'MAYBE' ? 'Maybe' : 'Declined'}`);
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
                handleRSVPSuccess();
            } else {
                setToastMessage(data.error || "Failed to update RSVP");
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
            }
        } catch (err) {
            setToastMessage("Network error. Please try again.");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } finally {
            setIsRSVPLoading(false);
        }
    };

    const handlePostComment = async (content: string, type: "TEXT" | "GIF" | "STICKER" = "TEXT", mediaUrl?: string, parentId?: string) => {
        if (!session || !event?.id) return;
        try {
            const res = await fetch("/api/comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ eventId: event.id, content, type, mediaUrl, parentId }),
            });
            if (res.ok) {
                fetchComments();
            }
        } catch (error) {
            console.error("Post Comment Error:", error);
        }
    };

    const handleGuestAction = async (rsvpId: string, status: 'ACCEPTED' | 'DECLINED') => {
        if (!event?.id) return;
        try {
            const response = await fetch(`/api/events/${event.id}/rsvp/approve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rsvpId, status }),
            });
            const data = await response.json();
            if (data.success) {
                fetchGuests();
            }
        } catch (error) {
            console.error("Guest Action Error:", error);
        }
    };

    const handleSettingsChange = async (newSettings: any) => {
        if (!event?.id) return;
        try {
            const response = await fetch(`/api/events/${event.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ theme: { ...event.theme, settings: newSettings } }),
            });
            const data = await response.json();
            if (data.success) {
                setEvent(data.event);
            }
        } catch (error) {
            console.error("Settings Update Error:", error);
        }
    };

    const handleStyleChange = async (rsvpStyle: string) => {
        if (!event?.id) return;
        try {
            const response = await fetch(`/api/events/${event.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ theme: { ...event.theme, rsvpStyle } }),
            });
            const data = await response.json();
            if (data.success) {
                setEvent(data.event);
            }
        } catch (error) {
            console.error("Style Update Error:", error);
        }
    };

    const handleToggleRSVP = async (showRSVP: boolean) => {
        if (!event?.id) return;
        try {
            const response = await fetch(`/api/events/${event.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ theme: { ...event.theme, showRSVP } }),
            });
            const data = await response.json();
            if (data.success) {
                setEvent(data.event);
            }
        } catch (error) {
            console.error("Toggle RSVP Error:", error);
        }
    };

    const handleInvite = () => {
        setIsShareOpen(true);
    };

    const handleClone = async () => {
        if (!event?.id || !isHost) return;
        setIsCloning(true);
        try {
            const response = await fetch(`/api/events/${event.id}/clone`, { method: "POST" });
            const data = await response.json();
            if (response.ok && data.success) {
                router.push(`/e/${data.event.slug}`);
            } else {
                throw new Error(data.error || "Failed to clone event");
            }
        } catch (error: any) {
            setToastMessage(error.message || "Failed to clone event");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } finally {
            setIsCloning(false);
        }
    };

    const handleDelete = async () => {
        if (!event?.id || !isHost) return;
        if (!window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/events/${event.id}/delete`, { method: "DELETE" });
            const data = await response.json();
            if (response.ok && data.success) {
                router.push("/dashboard");
            } else {
                throw new Error(data.error || "Failed to delete event");
            }
        } catch (error: any) {
            setToastMessage(error.message || "Failed to delete event");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleExportCSV = () => {
        const rows = [
            ["Name", "Email", "Status", "RSVP'd At"],
            ...guests.map(g => [
                g.name ?? "",
                g.email ?? "",
                g.status,
                g.updatedAt ? new Date(g.updatedAt).toLocaleString() : "",
            ]),
        ];
        const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${event?.slug ?? "event"}-guests.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const backgroundTheme = event?.theme?.backgroundTheme || "";
    const has3DTheme = backgroundTheme && INTERACTIVE_THEMES.includes(backgroundTheme);
    const primaryColor = event?.theme?.primaryColor || "#3b82f6";
    const selectedTheme = event?.theme?.backgroundTheme || "default";

    let bgStyle = has3DTheme ? {} : {
        background: `radial-gradient(circle at 50% 50%, ${primaryColor} 0%, #000000 100%)`
    };

    if (backgroundTheme.startsWith("custom-gradient:")) {
        const color = backgroundTheme.split(":")[1];
        bgStyle = {
            background: `linear-gradient(90deg, ${color} 0%, #ffffff 50%, ${color} 100%)`
        };
    }

    let effect = event?.theme?.effect;
    if (!effect || effect === 'none') {
        const vid = event?.theme?.vibeId || "classic";
        if (['digital', 'futuristic'].includes(vid)) effect = 'grid';
        else if (['fancy', 'eclectic', 'royal'].includes(vid)) effect = 'particles';
        else if (['elegant', 'rose', 'literary'].includes(vid)) effect = 'aurora';
        else effect = 'grain';
    }

    const userRSVPStatus = myRSVP?.status;
    const requireApproval = event?.theme?.settings?.rsvp?.requireApproval === true;

    return (
        <div
            className="min-h-screen text-white selection:bg-green-500/30 font-sans antialiased overflow-x-hidden relative transition-colors duration-700"
            style={bgStyle}
        >
            {has3DTheme && (
                <InteractiveBackground
                    currentTheme={backgroundTheme}
                    currentEffect={event?.theme?.effect}
                />
            )}

            <div className={`fixed inset-0 pointer-events-none z-[70] mix-blend-overlay ${effect === 'grain' ? 'opacity-[0.1]' : 'opacity-[0.03]'}`}
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
            </div>

            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-950/5 blur-[150px] rounded-full"></div>
                
                {/* Preset Video Theme Background */}
                {backgroundTheme.startsWith('preset-video:') && (() => {
                    const presetId = backgroundTheme.split(':')[1];
                    const preset = ANIMATED_THEME_PRESETS.find(p => p.id === presetId);
                    if (preset) {
                        if (preset.type === 'video') {
                            return (
                                <BackgroundVideo 
                                    src={preset.url} 
                                />
                            );
                        } else if (preset.type === 'image') {
                            return (
                                <img 
                                    src={preset.url} 
                                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                                    alt=""
                                />
                            );
                        }
                    }
                    return null;
                })()}
            </div>

            <div className="fixed inset-0 pointer-events-none z-[5]">
                {/* 3D Backgrounds & Core Effects */}
                {(effect === 'skiing' || INTERACTIVE_THEMES.includes(backgroundTheme)) && (
                    <InteractiveBackground currentTheme={backgroundTheme} currentEffect={effect} />
                )}

                {effect === 'grid' && (
                    <div className="absolute inset-0 opacity-[0.05]"
                        style={{ backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
                    ></div>
                )}

                {effect === 'particles' && <FloatingParticles />}

                {/* Masterpiece floral logic removed */}
                
                {effect === 'confetti' && <Confetti />}
                {effect === 'rain' && <Rain />}

                {effect === 'aurora' && (
                    <div className="absolute inset-0 opacity-60 mix-blend-screen pointer-events-none z-[1]">
                        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-cyan-500/50 blur-[120px] rounded-full animate-pulse"></div>
                        <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-green-500/50 blur-[120px] rounded-full animate-pulse delay-700"></div>
                        <div className="absolute top-1/2 left-1/2 w-[50%] h-[50%] bg-rose-500/50 blur-[120px] rounded-full animate-pulse delay-1000"></div>
                    </div>
                )}

                {effect === 'glow' && (
                    <div className="absolute inset-0 opacity-30 bg-gradient-to-br from-rose-500/20 via-transparent to-transparent animate-pulse"></div>
                )}

                {effect === 'vignette' && (
                    <div className="absolute inset-0 pointer-events-none z-[5]" style={{ boxShadow: 'inset 0 0 300px rgba(0,0,0,0.95)' }}></div>
                )}

                {(effect === 'grain' || !effect) && (
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("/noise.png")', backgroundRepeat: 'repeat' }}></div>
                )}
            </div>

            {/* Foreground Overlay VFX (Overlaps background, behind UI) */}
            <div className="fixed inset-0 pointer-events-none z-[8]">
                {/* Custom Uploaded FX */}
                {effect?.startsWith('custom-uploaded:') && (
                    <CustomFloatingVfxClient imageUrl={effect.split(':')[1]} />
                )}

                {/* Preset Image FX */}
                {effect?.startsWith('preset-image:') && (() => {
                    const presetId = effect.split(':')[1];
                    const preset = IMAGE_VFX_PRESETS.find(p => p.id === presetId);
                    if (preset) {
                        return <CustomFloatingVfxClient imageUrl={preset.imageUrl} />;
                    }
                    return null;
                })()}

                {/* Preset WebM Video FX / Lottie */}
                {effect?.startsWith('preset-webm:') && (() => {
                    const presetId = effect.split(':')[1];
                    const preset = VIDEO_VFX_PRESETS.find(p => p.id === presetId);
                    if (preset) {
                        if ((preset as any).type === 'lottie') {
                            return (
                                <SafeLottiePlayer
                                    src={preset.videoUrl}
                                    autoplay
                                    loop
                                    className="absolute inset-0 w-full h-full object-cover opacity-90"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            );
                        }
                        return (
                            <BackgroundVideo 
                                src={preset.videoUrl} 
                                className="absolute inset-0 w-full h-full object-cover opacity-90"
                            />
                        );
                    }
                    return null;
                })()}
            </div>

            {isHost && (
                <HostSidebar
                    onEdit={() => router.push(`/events/${event.id}/edit`)}
                    onTextBlast={() => { setSettingsTab("Messaging"); setIsSettingsOpen(true); }}
                    onInvite={handleInvite}
                    goingCount={guests.filter(g => g.status === 'ACCEPTED').length}
                    onSettings={() => { setSettingsTab("Hosts"); setIsSettingsOpen(true); }}
                    onClone={handleClone}
                    onGenerateFlyer={() => setIsFlyerOpen(true)}
                    onDelete={handleDelete}
                    isCloning={isCloning}
                    isDeleting={isDeleting}
                    selectedTheme={backgroundTheme}
                    onAnnounce={() => setAnnounceFocusTrigger(t => t + 1)}
                    onExportCSV={handleExportCSV}
                />
            )}

            <main className="relative z-10 mx-auto px-6 sm:px-10 pt-20 pb-48 grid grid-cols-1 lg:grid-cols-[1.2fr_380px] max-w-5xl gap-12 justify-center transition-all duration-700">
                <div className="space-y-12">
                    <ReadonlyEventSummary event={event} onShare={() => setIsShareOpen(true)} />

                    <div className="w-full pt-8 border-t border-white/10">
                        <AnnouncementsSection
                            eventId={event.id}
                            isHost={isHost}
                            isCoHost={isCoHost}
                            focusTrigger={announceFocusTrigger}
                        />
                    </div>

                    <div className="w-full pt-8 border-t border-white/10">
                        <GuestListPreview
                            guests={guests}
                            totalCount={guests.filter(g => g.status === 'ACCEPTED').length}
                            onViewAll={() => { setSettingsTab("RSVPs"); setIsSettingsOpen(true); }}
                            onSelectGuest={(guest) => {
                                if (guest.userId && guest.userId !== session?.user?.id) {
                                    setSelectedGuestForChat({ id: guest.userId, name: guest.guestName, image: guest.image });
                                    // Reset after a brief delay so ChatSystem picks up the change
                                    setTimeout(() => setSelectedGuestForChat(null), 100);
                                }
                            }}
                            isHidden={event.guestListHidden && !isHost}
                        />
                    </div>

                    <div className="w-full pt-8 border-t border-white/10">
                        <PhotoAlbum eventId={event.id} isHost={isHost} primaryColor={primaryColor} />
                    </div>

                    <div className="w-full pt-8 border-t border-white/10">
                        <h3 className="text-2xl font-bold text-white mb-6">Activity Feed</h3>
                        <ActivityFeed
                            eventId={event.id}
                            comments={comments}
                            rsvps={guests.filter((g: any) => g.status !== 'PENDING' && g.status !== 'DECLINED').map((g: any) => ({
                                ...g,
                                type: 'rsvp',
                                createdAt: g.updatedAt || new Date().toISOString()
                            }))}
                            onPostComment={handlePostComment}
                            primaryColor={primaryColor}
                        />
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="lg:sticky lg:top-8 space-y-8">
                        <div className="w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 aspect-video lg:aspect-square relative group">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
                            {event.coverImage ? (
                                <Image
                                    src={event.coverImage}
                                    alt={event.title}
                                    fill
                                    className="object-cover transform group-hover:scale-105 transition-transform duration-700"
                                    unoptimized
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-emerald-500/20 via-green-500/20 to-yellow-500/20 flex items-center justify-center">
                                    <span className="text-white/40 font-black text-4xl uppercase tracking-widest">{event.title?.[0]}</span>
                                </div>
                            )}
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                            {event.isPaid ? (
                                <div className="space-y-4">
                                    <div className="text-center space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Paid Event</p>
                                        <h3 className="text-xl font-bold text-white">Get Your Ticket</h3>
                                    </div>

                                    {/* Tier preview */}
                                    <div className="space-y-2">
                                        {ticketTiers.slice(0, 2).map((tier: any) => (
                                            <div key={tier.id} className="flex items-center justify-between px-3 py-2.5 bg-white/5 rounded-xl border border-white/8">
                                                <span className="text-sm font-bold text-white">{tier.name}</span>
                                                <span className="text-sm font-black" style={{ color: primaryColor }}>
                                                    ${(tier.price / 100).toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                        {ticketTiers.length > 2 && (
                                            <p className="text-center text-[10px] text-white/30 font-bold uppercase tracking-widest">
                                                +{ticketTiers.length - 2} more tiers
                                            </p>
                                        )}
                                    </div>

                                     {myRSVP?.status === 'ACCEPTED' ? (
                                        <div className="space-y-2">
                                            <button
                                                onClick={() => setIsRSVPModalOpen(true)}
                                                className="w-full py-3.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl flex items-center justify-center gap-3 transition-all group"
                                            >
                                                <QrCode className="w-5 h-5 text-white/60 group-hover:text-white" />
                                                <span className="font-bold text-sm text-white">View Your Ticket</span>
                                            </button>

                                            <div className="relative">
                                                <button
                                                    onClick={() => setIsCalendarDropdownOpen(!isCalendarDropdownOpen)}
                                                    className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl flex items-center justify-center gap-2 transition-all text-[11px] font-black uppercase tracking-wider text-white/50 hover:text-white"
                                                >
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    Add to Calendar
                                                </button>

                                                {isCalendarDropdownOpen && (() => {
                                                    const links = getCalendarLinks({
                                                        title: event.title,
                                                        description: event.description || "",
                                                        location: event.location || "",
                                                        startDate: event.startDate,
                                                        endDate: event.endDate || undefined
                                                    });
                                                    return (
                                                        <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 bg-[#161618] border border-white/10 rounded-xl p-1.5 shadow-2xl space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                                            <a
                                                                href={links.google}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                                            >
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                                Google Calendar
                                                            </a>
                                                            <a
                                                                href={links.outlook}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                                            >
                                                                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                                                                Outlook Calendar
                                                            </a>
                                                            <a
                                                                href={links.ics}
                                                                download={`event-${event.slug || "ticket"}.ics`}
                                                                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                                            >
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                                Apple / ICS File
                                                            </a>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setIsCheckoutOpen(true)}
                                            className="w-full py-3.5 rounded-xl flex items-center justify-center gap-3 font-bold text-sm text-white transition-all active:scale-95"
                                            style={{ background: primaryColor }}
                                        >
                                            <Ticket className="w-4 h-4" />
                                            Buy Ticket
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <h3 className="text-xl font-bold text-white text-center mb-6">Are you going?</h3>
                                    <RSVPActions
                                        onRSVP={handleRSVP}
                                        currentStatus={userRSVPStatus}
                                        isLoading={isRSVPLoading}
                                        requireApproval={requireApproval}
                                        isStaff={isStaff}
                                    />
                                    {(userRSVPStatus === 'ACCEPTED' || userRSVPStatus === 'MAYBE') && (
                                        <div className="space-y-2 mt-4">
                                            <button
                                                onClick={() => setIsRSVPModalOpen(true)}
                                                className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl flex items-center justify-center gap-3 transition-all group"
                                            >
                                                <QrCode className="w-5 h-5 text-white/60 group-hover:text-white" />
                                                <span className="font-bold text-sm text-white">View Your Ticket</span>
                                            </button>

                                            <div className="relative">
                                                <button
                                                    onClick={() => setIsCalendarDropdownOpen(!isCalendarDropdownOpen)}
                                                    className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl flex items-center justify-center gap-2 transition-all text-[11px] font-black uppercase tracking-wider text-white/50 hover:text-white"
                                                >
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    Add to Calendar
                                                </button>

                                                {isCalendarDropdownOpen && (() => {
                                                    const links = getCalendarLinks({
                                                        title: event.title,
                                                        description: event.description || "",
                                                        location: event.location || "",
                                                        startDate: event.startDate,
                                                        endDate: event.endDate || undefined
                                                    });
                                                    return (
                                                        <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 bg-[#161618] border border-white/10 rounded-xl p-1.5 shadow-2xl space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                                            <a
                                                                href={links.google}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                                            >
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                                Google Calendar
                                                            </a>
                                                            <a
                                                                href={links.outlook}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                                            >
                                                                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                                                                Outlook Calendar
                                                            </a>
                                                            <a
                                                                href={links.ics}
                                                                download={`event-${event.slug || "ticket"}.ics`}
                                                                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                                            >
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                                Apple / ICS File
                                                            </a>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Share Event Button */}
                            <button
                                onClick={() => setIsShareOpen(true)}
                                className="w-full mt-4 py-3.5 bg-gradient-to-r from-emerald-500/15 via-emerald-500/25 to-teal-500/15 hover:from-emerald-500/25 hover:to-teal-500/25 border border-emerald-500/30 hover:border-emerald-500/50 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition-all shadow-lg active:scale-95 group"
                            >
                                <Share2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                                <span>Share Event (WhatsApp, Email, Link)</span>
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Mobile Sticky Floating Action Bar */}
            <div className="fixed bottom-4 left-4 right-4 z-40 lg:hidden flex items-center gap-2.5 p-2 bg-[#121216]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.85)] animate-in slide-in-from-bottom-4">
                <button
                    onClick={() => setIsShareOpen(true)}
                    className="flex-1 py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
                >
                    <Share2 className="w-4 h-4" />
                    <span>Share Event</span>
                </button>
                {event.isPaid ? (
                    <button
                        onClick={() => setIsCheckoutOpen(true)}
                        className="flex-1 py-3.5 px-4 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                        <Ticket className="w-4 h-4 text-emerald-400" />
                        <span>Tickets</span>
                    </button>
                ) : (
                    <button
                        onClick={() => {
                            setIsRSVPModalOpen(true);
                        }}
                        className="flex-1 py-3.5 px-4 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span>RSVP</span>
                    </button>
                )}
                {isHost && (
                    <button
                        onClick={() => { setSettingsTab("Hosts"); setIsSettingsOpen(true); }}
                        className="w-12 h-12 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl flex items-center justify-center flex-shrink-0 active:scale-95 transition-all"
                        title="Event Settings"
                    >
                        <Settings className="w-4 h-4 text-gray-300" />
                    </button>
                )}
            </div>

            <EventSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                event={event}
                settings={{
                    hosts: event.theme?.settings?.hosts || { cohosts: [], linkSharing: false },
                    rsvp: event.theme?.settings?.rsvp || { requireApproval: false, capacity: null, plusOnes: 0, allowMutuals: false, allowMaybe: true },
                    privacy: event.theme?.settings?.privacy || { showTimestamps: true, showNames: true, showCount: true, requirePassword: false, isPrivate: false, guestListHidden: false },
                    hostName: event.host?.name || "Host",
                    hostImage: event.host?.image,
                    reminders: event.theme?.settings?.reminders || []
                }}
                guests={guests}
                onUpdate={setEvent}
                onToggleRSVP={handleToggleRSVP}
                onStyleChange={handleStyleChange}
                onGuestAction={handleGuestAction}
                initialTab={settingsTab}
                primaryColor={primaryColor}
                selectedTheme={selectedTheme}
                isHost={isHost}
                isCoHost={isCoHost}
                isStaff={isStaff}
                onSelectGuest={(guest) => {
                    if (guest.userId && guest.userId !== session?.user?.id) {
                        setSelectedGuestForChat({ id: guest.userId, name: guest.guestName || guest.name, image: guest.image });
                        setTimeout(() => setSelectedGuestForChat(null), 100);
                    }
                }}
            />

            <ShareEventModal
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                event={event}
            />

            <FlyerModal
                isOpen={isFlyerOpen}
                onClose={() => setIsFlyerOpen(false)}
                event={{
                    title: event.title,
                    coverImage: event.coverImage,
                    host: {
                        name: userRSVPStatus ? session?.user?.name || event.host?.name : event.host?.name,
                        image: session?.user?.image || event.host?.image
                    },
                    theme: event.theme
                }}
            />

            <RSVPModal
                isOpen={isRSVPModalOpen}
                onClose={() => setIsRSVPModalOpen(false)}
                event={event}
                user={session?.user}
                onRSVPSuccess={handleRSVPSuccess}
                myRSVP={myRSVP}
                initialStatus={rsvpInitialStatus}
            />

            {event.isPaid && (
                <TicketCheckoutDrawer
                    isOpen={isCheckoutOpen}
                    onClose={() => setIsCheckoutOpen(false)}
                    event={event}
                    tiers={ticketTiers}
                    user={session?.user}
                    primaryColor={primaryColor}
                    onSuccess={() => {
                        fetchMyRSVP();
                        fetchGuests();
                    }}
                />
            )}

            {showToast && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] bg-white text-black px-6 py-3 rounded-full font-bold shadow-2xl animate-in slide-in-from-top-4 fade-in duration-300 pointer-events-none flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    {toastMessage}
                </div>
            )}

            <ChatSystem 
                eventId={event.id} 
                eventName={event.title} 
                externalRecipient={selectedGuestForChat}
            />
        </div>
    );
}
