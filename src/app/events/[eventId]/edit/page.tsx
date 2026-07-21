"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import EventForm from "@/components/EventForm";
import RSVPOptions, { RSVP_STYLES } from "@/components/RSVPOptions";
import CreateEventSidebar from "@/components/CreateEventSidebar";
import FontStyleSelector, { FONT_STYLES } from "@/components/FontStyleSelector";
import Image from "next/image";
import CoverImageGallery from "@/components/CoverImageGallery";
import EffectSelector from "@/components/EffectSelector";
import ThemeSelector from "@/components/ThemeSelector";
import { VIBE_THEMES } from "@/lib/theme";
import { Copy, Plus, MoreHorizontal, MessageCircle, AlertCircle, Edit2, Clock, Trash2, ShieldAlert } from "lucide-react";
import EventSettingsModal from "@/components/EventSettingsModal";
import { IMAGE_VFX_PRESETS, VIDEO_VFX_PRESETS } from "@/components/EffectSelector";
import { ANIMATED_THEME_PRESETS } from "@/components/ThemeSelector";
import CustomFloatingVfx from "@/components/vfx/CustomFloatingVfx";
import Confetti from "@/components/vfx/Confetti";
import Rain from "@/components/vfx/Rain";
import SafeLottiePlayer from "@/components/SafeLottiePlayer";
import VfxCanvas from "@/components/vfx/VfxCanvas";
import FloatingParticles from "@/components/FloatingParticles";
import { BackgroundVideo } from "@/components/BackgroundVideo";
import { ChevronLeft } from "lucide-react";

// Dynamically import InteractiveBackground (Three.js — client only)
const InteractiveBackground = dynamic(
    () => import("@/components/InteractiveBackground"),
    { ssr: false }
);

const INTERACTIVE_THEMES = ['streak', 'meadow', 'crystal', 'waves'];

interface SessionData {
    user?: {
        id?: string;
        name?: string;
        email?: string;
        image?: string;
    };
}

export default function EditEventPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session, status } = useSession() as { data: SessionData | null, status: string };

    // Loading State
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");

    // Event Data State
    const [pendingData, setPendingData] = useState<any>(null);

    // UI State
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [isFontOpen, setIsFontOpen] = useState(false);
    const [isEffectOpen, setIsEffectOpen] = useState(false);
    const [isThemeOpen, setIsThemeOpen] = useState(false);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Persisted Visual/Config State
    const [effect, setEffect] = useState("particles");
    const [selectedTheme, setSelectedTheme] = useState<string | undefined>(undefined);
    const [coverImage, setCoverImage] = useState("/partiful/Aquarius.avif");
    const [vibeId, setVibeId] = useState("classic");
    const [rsvpStyle, setRSVPStyle] = useState("standard");
    const [showRSVP, setShowRSVP] = useState(true);
    const [rsvpLabels, setRSVPLabels] = useState({
        going: "Going",
        maybe: "Maybe",
        notGoing: "Can't Go",
    });

    const [settings, setSettings] = useState({
        hostName: "",
        hostImage: "",
        hosts: { cohosts: [], linkSharing: false },
        rsvp: {
            enabled: true,
            requireApproval: false,
            capacity: null as number | null,
            waitlist: false,
            plusOnes: 1,
            requireNames: false,
            allowMutuals: true,
            buttonStyle: 'icons',
            allowMaybe: true
        },
        privacy: {
            showTimestamps: true,
            showNames: true,
            showCount: true,
            requirePassword: false,
            password: "",
            isPrivate: false,
            guestListHidden: false,
            visibility: "PUBLIC" as "PUBLIC" | "PRIVATE" | "UNLISTED"
        },
        cost: ""
    });

    // Formatting date for input
    const formatDateForInput = (date: string | Date) => {
        if (!date) return "";
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // Fetch Event Data
    const hasFetchedRef = useRef(false);
    useEffect(() => {
        const fetchEvent = async () => {
            if (hasFetchedRef.current) return;
            if (status === "loading") return;
            if (!session) {
                router.push("/auth/signin");
                return;
            }

            try {
                // Fetch event details
                const response = await fetch(`/api/events/my-events`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Failed to fetch event");
                }

                const foundEvent = data.events.find((e: any) => e.id === params.eventId);

                if (!foundEvent) {
                    throw new Error("Event not found or you don't have permission to edit it");
                }

                hasFetchedRef.current = true;

                // Map fetched data to state
                // Map theme/visuals
                const themeData = typeof foundEvent.theme === 'string' ? JSON.parse(foundEvent.theme) : (foundEvent.theme || {});

                // Ensure settings object is fully populated from top-level fields
                const restoredSettings = {
                    ...(themeData.settings || {}),
                    hostName: themeData.settings?.hostName || foundEvent.host?.name || "",
                    hostImage: themeData.settings?.hostImage || foundEvent.host?.image || "",
                    cost: themeData.settings?.cost || "",
                    rsvp: {
                        ...(themeData.settings?.rsvp || {}),
                        capacity: foundEvent.capacity !== null ? foundEvent.capacity : (themeData.settings?.rsvp?.capacity || null),
                        enabled: themeData.settings?.rsvp?.enabled ?? true,
                    },
                    privacy: {
                        ...(themeData.settings?.privacy || {}),
                        isPrivate: foundEvent.isPrivate ?? themeData.settings?.privacy?.isPrivate ?? false,
                        visibility: (foundEvent.visibility as any) || themeData.settings?.privacy?.visibility || "PUBLIC",
                        guestListHidden: foundEvent.guestListHidden ?? themeData.settings?.privacy?.guestListHidden ?? false,
                    }
                };

                setPendingData({
                    title: foundEvent.title,
                    description: foundEvent.description,
                    location: foundEvent.location,
                    startDate: formatDateForInput(foundEvent.startDate),
                    endDate: foundEvent.endDate ? formatDateForInput(foundEvent.endDate) : "",
                    capacity: foundEvent.capacity,
                    visibility: foundEvent.visibility,
                    rsvpDeadline: foundEvent.rsvpDeadline ? formatDateForInput(foundEvent.rsvpDeadline) : "",
                    checkInWindowStart: foundEvent.checkInWindowStart,
                    maxCheckIns: foundEvent.maxCheckIns,
                    cost: restoredSettings.cost || "",
                    theme: { ...themeData, settings: restoredSettings }
                });

                if (themeData.vibeId) setVibeId(themeData.vibeId);
                if (themeData.rsvpStyle) setRSVPStyle(themeData.rsvpStyle);
                if (themeData.showRSVP !== undefined) setShowRSVP(themeData.showRSVP);
                if (themeData.rsvpLabels) setRSVPLabels(themeData.rsvpLabels);

                // CRITICAL: Set the unified settings state
                setSettings(restoredSettings);

                // Restore backgroundTheme (Meadow / Streak)
                if (themeData.backgroundTheme) setSelectedTheme(themeData.backgroundTheme);
                if (themeData.effect) {
                    setEffect(themeData.effect);
                } else if (themeData.vibeId) {
                    const vid = themeData.vibeId;
                    if (['digital', 'futuristic'].includes(vid)) setEffect('grid');
                    else if (['fancy', 'eclectic', 'royal'].includes(vid)) setEffect('particles');
                    else if (['elegant', 'rose', 'literary'].includes(vid)) setEffect('aurora');
                    else setEffect('grain');
                }


                // Restore other independent visual states if we were saving them (assuming we might eventually save these to DB too)
                // For now, we'll keep defaults or try to infer from typical usage if available
                if (foundEvent.coverImage) setCoverImage(foundEvent.coverImage);

            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchEvent();
    }, [params.eventId, session, status, router]);


    const handleSubmit = async (data: any) => {
        setIsSaving(true);

        // Only pass colors if they are valid 6-digit hex strings
        const isHex = (v: unknown) => typeof v === 'string' && /^#[0-9A-Fa-f]{6}$/.test(v);

        const submitData = {
            ...data,
            coverImage,
            // Extract core settings from the settings state
            isPrivate: settings.privacy?.isPrivate,
            visibility: settings.privacy?.isPrivate ? "PRIVATE" : (data.visibility || settings.privacy?.visibility || "PUBLIC"),
            guestListHidden: settings.privacy?.guestListHidden,
            capacity: data.capacity,
            // MERGE theme explicitly to ensure colors/effects from sidebar are preserved
            theme: {
                ...(pendingData?.theme || {}),
                // Overwrite with form-specific values
                vibeId: data.theme?.vibeId || data.vibeId,
                rsvpStyle: data.theme?.rsvpStyle || data.rsvpStyle,
                showRSVP: data.theme?.showRSVP ?? data.showRSVP,
                rsvpLabels: data.theme?.rsvpLabels || {
                    going: data.rsvp_going,
                    maybe: data.rsvp_maybe,
                    notGoing: data.rsvp_notGoing
                },
                // Explicitly ensure independent theme props are preserved
                backgroundTheme: selectedTheme,
                effect: effect, // Use the current effect state
                primaryColor: isHex(pendingData?.theme?.primaryColor) ? pendingData?.theme?.primaryColor : undefined,
                secondaryColor: isHex(pendingData?.theme?.secondaryColor) ? pendingData?.theme?.secondaryColor : undefined,
                settings: settings
            }
        };

        try {
            const response = await fetch(`/api/events/${params.eventId}/update`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(submitData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to update event");
            }

            // Bust client-side cache then navigate so the event page shows updated data instantly
            router.refresh();
            router.push(`/e/${result.event.slug}`);
        } catch (error: any) {
            console.error("Failed to update event:", error);
            setError(error.message || "Failed to update event");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDataChange = (data: any) => {
        setPendingData((prev: any) => ({
            ...prev,
            ...data,
            theme: {
                ...(prev?.theme || {}),
                vibeId: data.vibeId,
                rsvpStyle: data.rsvpStyle,
                showRSVP: data.showRSVP,
                rsvpLabels: {
                    going: data.rsvp_going,
                    maybe: data.rsvp_maybe,
                    notGoing: data.rsvp_notGoing
                },
                // IMPORTANT: Preserving independent theme settings that EventForm doesn't control
                backgroundTheme: prev?.theme?.backgroundTheme,
                primaryColor: prev?.theme?.primaryColor,
                secondaryColor: prev?.theme?.secondaryColor,
                effect: prev?.theme?.effect,
            }
        }));

        if (data.vibeId) {
            setVibeId(data.vibeId);
        }
        if (data.rsvpStyle) setRSVPStyle(data.rsvpStyle);
        if (data.showRSVP !== undefined) setShowRSVP(data.showRSVP);
        if (data.rsvp_going || data.rsvp_maybe || data.rsvp_notGoing) {
            setRSVPLabels(prev => ({
                going: data.rsvp_going || prev.going,
                maybe: data.rsvp_maybe || prev.maybe,
                notGoing: data.rsvp_notGoing || prev.notGoing
            }));
        }

        // Sync redundant fields to settings source of truth
        if (data.capacity !== undefined || data.visibility !== undefined || data.requireApproval !== undefined) {
            setSettings(prev => ({
                ...prev,
                rsvp: {
                    ...prev.rsvp,
                    capacity: data.capacity !== undefined ? (data.capacity === "" ? null : Number(data.capacity)) : prev.rsvp.capacity,
                    requireApproval: data.requireApproval !== undefined ? data.requireApproval : prev.rsvp.requireApproval
                },
                privacy: {
                    ...prev.privacy,
                    visibility: data.visibility !== undefined ? data.visibility : prev.privacy.visibility,
                    isPrivate: data.visibility === "PRIVATE" ? true : (data.visibility === "PUBLIC" ? false : prev.privacy.isPrivate)
                }
            }));
        }
    };

    const handleSidebarClick = (label: string) => {
        if (label === "Font") setIsFontOpen(true);
        if (label === "Theme") setIsThemeOpen(true);
        if (label === "Effect") setIsEffectOpen(true);
        if (label === "Preview") setIsPreviewMode(true);
        if (label === "Settings") setIsSettingsOpen(true);
        if (label === "Publish") {
            // Dispatch submit event to the form
            document.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
    };

    // Background: use 3D theme if saved, else fall back to color gradient
    const is3DTheme = INTERACTIVE_THEMES.includes(selectedTheme || "");
    const isSkier = effect === 'skiing';
    const has3DBackground = is3DTheme || isSkier;
    const primaryColor = pendingData?.theme?.primaryColor || "#3b82f6";

    let bgStyle = has3DBackground ? {} : {
        background: `radial-gradient(circle at 50% 50%, ${primaryColor} 0%, #000000 100%)`
    };

    if (selectedTheme?.startsWith('custom-gradient:')) {
        const color = selectedTheme.split(':')[1];
        bgStyle = {
            background: `linear-gradient(90deg, ${color} 0%, #ffffff 50%, ${color} 100%)`
        };
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="text-center">
                    <div className="inline-block w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-400">Loading event details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="text-center max-w-md px-6">
                    <h2 className="text-2xl font-bold text-red-500 mb-4">Error Loading Event</h2>
                    <p className="text-gray-400 mb-8">{error}</p>
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen text-white selection:bg-red-500/30 overflow-x-hidden relative font-sans antialiased transition-colors duration-700"
            style={bgStyle}
        >
            {/* Texture Overlay (Grain) */}
            <div className={`fixed inset-0 pointer-events-none z-[70] mix-blend-overlay ${effect === 'grain' ? 'opacity-[0.1]' : 'opacity-[0.03]'}`}
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
            </div>

            {/* Background Glow Effects (Clear corners) */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-950/5 blur-[150px] rounded-full"></div>
                
                {/* Preset Video Theme Background */}
                {
                    selectedTheme?.startsWith('preset-video:') && (() => {
                        const presetId = selectedTheme.split(':')[1];
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
                    })()
                }
            </div>

            {/* Fixed Viewport Effects */}
            <div className="fixed inset-0 pointer-events-none z-[5]">
                {/* 3D Interactive Background (Meadow / Streak themes) */}
                {
                    has3DBackground && (
                        <InteractiveBackground
                            currentTheme={selectedTheme}
                            currentEffect={effect}
                        />
                    )
                }

                {/* Cyber Grid */}
                {
                    effect === 'grid' && (
                        <div className="absolute inset-0 opacity-[0.05]"
                            style={{ backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
                        ></div>
                    )
                }

                {/* Floating Particles */}
                {effect === 'particles' && <FloatingParticles />}

                {/* Aurora Glow */}
                {
                    effect === 'aurora' && (
                        <div className="absolute inset-0 opacity-20">
                            <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-cyan-500/30 blur-[120px] rounded-full animate-pulse"></div>
                            <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-green-500/30 blur-[120px] rounded-full animate-pulse delay-700"></div>
                            <div className="absolute top-1/2 left-1/2 w-[50%] h-[50%] bg-rose-500/20 blur-[120px] rounded-full animate-pulse delay-1000"></div>
                        </div>
                    )
                }

                {/* Pulse Glow */}
                {
                    effect === 'glow' && (
                        <div className="absolute inset-0 animate-pulse">
                            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/10 blur-[100px] rounded-full"></div>
                            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full"></div>
                        </div>
                    )
                }

                {/* Floral Cinematic Effect removed */}

                {/* Cinematic Vignette */}
                {
                    effect === 'vignette' && (
                        <div className="absolute inset-0 shadow-[inset_0_0_200px_rgba(0,0,0,0.8)]"></div>
                    )
                }
            </div >

            {/* Foreground Overlay VFX (Overlaps background, behind UI) */}
            <div className="fixed inset-0 pointer-events-none z-[8]">
                {/* Custom Uploaded Effect */}
                {
                    effect?.startsWith('custom-uploaded:') && (
                        <CustomFloatingVfx imageUrl={effect.split(':')[1]} />
                    )
                }

                {/* Preset Image FX */}
                {effect?.startsWith('preset-image:') && (() => {
                    const presetId = effect.split(':')[1];
                    const preset = IMAGE_VFX_PRESETS.find(p => p.id === presetId);
                    if (preset) {
                        return <CustomFloatingVfx imageUrl={preset.imageUrl} />;
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

            {/* Preview Mode Header */}
            {
                isPreviewMode && (
                    <div className="fixed top-0 left-0 right-0 z-[100] bg-black/40 backdrop-blur-xl border-b border-white/5 px-8 py-4 flex items-center justify-between animate-in slide-in-from-top duration-500">
                        <button
                            onClick={() => setIsPreviewMode(false)}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full text-xs font-bold transition-all"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Back to Edit
                        </button>
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Previewing Invitation</span>
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        </div>
                        <button
                            onClick={() => document.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))}
                            className="px-8 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-xs font-bold transition-all shadow-lg shadow-emerald-500/20"
                        >
                            {isSaving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                )
            }

            <main className={`relative z-10 mx-auto px-6 sm:px-10 pt-20 pb-48 grid grid-cols-1 ${isPreviewMode ? 'max-w-xl' : 'lg:grid-cols-[1.2fr_380px] max-w-5xl gap-12 justify-center'} transition-all duration-700`}>
                {/* Left Column: Form Section */}
                <div className={`space-y-12 animate-in fade-in slide-in-from-left-8 duration-1000 ease-out ${isPreviewMode ? 'hidden' : ''}`}>
                    <div className="flex items-center gap-4 text-white/40">
                        {/* <button onClick={() => router.back()} className="hover:text-white transition-colors flex items-center gap-2">
                            <ChevronLeft className="w-5 h-5" />
                            <span className="text-sm font-semibold tracking-wide">CANCEL & BACK</span>
                        </button> */}
                        {/* <div className="h-px w-12 bg-current opacity-20"></div> */}
                    </div>

                    <div className="space-y-2">
                        <EventForm
                            initialData={pendingData}
                            onSubmit={handleSubmit}
                            onDataChange={handleDataChange}
                            rsvpStyle={rsvpStyle}
                            hostName={session?.user?.name || ""}
                            hostImage={session?.user?.image || ""}
                            onAddCohosts={() => setIsSettingsOpen(true)}
                            effect={effect} // Pass effect prop
                            submitLabel={isSaving ? "Saving..." : "Update Event"}
                            isLoading={isSaving}
                        />
                    </div>
                </div>

                {/* Middle Column: Visual Preview (Sticky) */}
                <div className={`space-y-10 pt-4 ${isPreviewMode ? 'w-full scale-110' : 'hidden lg:block sticky top-24 h-fit'} animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 transition-all duration-700`}>
                    <div className="space-y-4">

                        {/* Event Image Card */}
                        <div
                            className="bg-[#2a2a2a] rounded-none border border-white/[0.05] overflow-hidden relative group shadow-[0_60px_100px_-30px_rgba(0,0,0,0.8)]"
                            style={{
                                aspectSizing: 'allow-keywords',
                                aspectRatio: '1 / 1',
                                width: '100%',
                                maxWidth: '100%',
                                minHeight: '200px',
                                maxHeight: 'max(100vh - 400px, 600px)',
                                marginBottom: '24px',
                                display: 'flex',
                                justifyContent: 'center',
                                position: 'relative',
                                flex: 'none',
                                alignSelf: 'center',
                                cursor: 'pointer',
                                boxSizing: 'border-box',
                            } as React.CSSProperties}
                        >
                            {/* Dummy Illustration Background */}
                            <Image
                                src={coverImage}
                                alt="Event Cover"
                                fill
                                className="object-cover group-hover:scale-105 transition-all duration-1000"
                            />
                            {/* Edit Button */}
                            {!isPreviewMode && (
                                <button
                                    onClick={() => setIsGalleryOpen(true)}
                                    className="absolute bottom-6 right-6 flex items-center gap-3 bg-white text-black px-6 py-3 rounded-full text-xs font-bold shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 group z-10"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                    <span>Change Photo</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Interaction Preview */}
                    <div className="space-y-4">
                        <RSVPOptions
                            labels={rsvpLabels}
                            isReadOnly={false}
                            isEditable={!isPreviewMode}
                            style={rsvpStyle}
                            showRSVP={showRSVP}
                            vibeId={vibeId}
                            onLabelsChange={(labels) => setRSVPLabels({
                                going: labels.going || "",
                                maybe: labels.maybe || "",
                                notGoing: labels.notGoing || ""
                            })}
                            onStyleChange={setRSVPStyle}
                            onToggleRSVP={setShowRSVP}
                            containerClassName="rounded-none"
                        />
                    </div>
                </div>
            </main>

            {/* Floating Sidebar (Fixed Right) */}
            <div className={`hidden lg:block fixed right-0 top-1/2 -translate-y-1/2 z-[60] animate-in fade-in slide-in-from-right-8 duration-1000 delay-400 ${isPreviewMode ? 'hidden' : ''}`}>
                <CreateEventSidebar
                    onItemClick={handleSidebarClick}
                    isAuthenticated={!!session}
                    selectedTheme={selectedTheme}
                    selectedEffect={effect}
                    activeItem={
                        isFontOpen ? "Font" :
                            isThemeOpen ? "Theme" :
                                isEffectOpen ? "Effect" :
                                    isSettingsOpen ? "Settings" :
                                        isPreviewMode ? "Preview" : ""
                    }
                />
            </div>

            {/* Modals */}
            <CoverImageGallery
                isOpen={isGalleryOpen}
                onClose={() => setIsGalleryOpen(false)}
                onSelect={(url) => setCoverImage(url)}
                currentImage={coverImage}
            />

            <FontStyleSelector
                isOpen={isFontOpen}
                onClose={() => setIsFontOpen(false)}
                onSelect={(id) => {
                    setVibeId(id);
                    setPendingData((prev: any) => ({
                        ...prev,
                        theme: {
                            ...prev?.theme,
                            vibeId: id
                        }
                    }));
                }}
                currentStyle={vibeId}
            />

            <EffectSelector
                isOpen={isEffectOpen}
                onClose={() => setIsEffectOpen(false)}
                onSelect={(id) => {
                    setEffect(id);
                    setPendingData((prev: any) => ({
                        ...prev,
                        theme: {
                            ...prev?.theme,
                            effect: id
                        }
                    }));
                }}
                currentEffect={effect}
            />

            <ThemeSelector
                isOpen={isThemeOpen}
                onClose={() => setIsThemeOpen(false)}
                onSelect={(themeId, customColor) => {
                    setSelectedTheme(themeId);
                    setPendingData((prev: any) => ({
                        ...prev,
                        theme: {
                            ...prev?.theme,
                            backgroundTheme: themeId,
                            primaryColor: customColor || prev?.theme?.primaryColor
                        }
                    }));
                }}
                currentTheme={selectedTheme || ""}
            />

            <EventSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                event={pendingData}
                settings={settings}
                onUpdate={(updatedData) => {
                    setPendingData({ ...updatedData });
                    if (updatedData.theme?.settings) {
                        setSettings({ ...updatedData.theme.settings });
                    }
                }}
                onStyleChange={setRSVPStyle}
                onToggleRSVP={setShowRSVP}
                guests={[]} // Passing empty guests for now as we haven't fetched them in this context yet
                primaryColor={pendingData?.theme?.primaryColor || primaryColor}
                selectedTheme={selectedTheme || "streak"}
                isHost={true}
            />
        </div >
    );
}
