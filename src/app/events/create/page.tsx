"use client";

import { useState, useMemo, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import EventForm from "@/components/EventForm";
import RSVPOptions, { RSVP_STYLES } from "@/components/RSVPOptions";
import CreateEventSidebar from "@/components/CreateEventSidebar";
import { IMAGE_VFX_PRESETS, VIDEO_VFX_PRESETS } from "@/components/EffectSelector";
import { ANIMATED_THEME_PRESETS } from "@/components/ThemeSelector";
import Image from "next/image";
import CoverImageGallery from "@/components/CoverImageGallery";
import FontStyleSelector, { FONT_STYLES } from "@/components/FontStyleSelector";
import ThemeSelector from "@/components/ThemeSelector";
import EffectSelector from "@/components/EffectSelector";
import FloatingParticles from "@/components/FloatingParticles";
import InteractiveBackground from "@/components/InteractiveBackground";
import VfxCanvas from "@/components/vfx/VfxCanvas";
import { VIBE_THEMES, normalizeThemeId, normalizeEffectId } from "@/lib/theme";
import EventSettingsModal from "@/components/EventSettingsModal";
import { ChevronLeft, Palette, Sparkles, Settings, CheckCircle, LogIn, Loader2 } from "lucide-react";
import CustomFloatingVfx from "@/components/vfx/CustomFloatingVfx";
import Confetti from "@/components/vfx/Confetti";
import Rain from "@/components/vfx/Rain";
import dynamic from 'next/dynamic';
import SafeLottiePlayer from "@/components/SafeLottiePlayer";
import { BackgroundVideo } from "@/components/BackgroundVideo";

const INTERACTIVE_THEMES = ['streak', 'meadow', 'crystal', 'waves'];

interface SessionData {
    user?: {
        id?: string;
        name?: string;
        email?: string;
        image?: string;
    };
}

function CreateEventContent() {
    const router = useRouter();
    const { data: session } = useSession() as { data: SessionData | null };
    const [isLoading, setIsLoading] = useState(false);
    const [pendingData, setPendingData] = useState<any>(null);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [isFontOpen, setIsFontOpen] = useState(false);
    const [isEffectOpen, setIsEffectOpen] = useState(false);
    const [isThemeOpen, setIsThemeOpen] = useState(false);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [selectedTheme, setSelectedTheme] = useState("dark");
    const [effect, setEffect] = useState<string>("particles");
    const [coverImage, setCoverImage] = useState("/partiful/Aquarius.avif");
    const [vibeId, setVibeId] = useState("classic");
    const [rsvpStyle, setRSVPStyle] = useState("standard");
    const [showRSVP, setShowRSVP] = useState(true);
    const [isLoaded, setIsLoaded] = useState(false);
    const [rsvpLabels, setRSVPLabels] = useState({
        going: "Going",
        maybe: "Maybe",
        notGoing: "Can't Go",
    });
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [settings, setSettings] = useState({
        hostName: session?.user?.name || "",
        hostImage: session?.user?.image || "",
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

    // Memoize initialData to avoid unnecessary re-renders of EventForm
    const initialData = useMemo(() => {
        const data: any = { ...pendingData, coverImage };
        if (!data.host && session?.user?.name) {
            data.host = session.user.name;
        }
        data.theme = {
            vibeId,
            rsvpStyle,
            showRSVP,
            rsvpLabels,
        };
        return data;
    }, [pendingData, coverImage, vibeId, rsvpStyle, showRSVP, rsvpLabels, session?.user?.name]);

    const searchParams = useSearchParams();

    // Load all persisted states on mount, giving URL params priority over local storage
    useEffect(() => {
        let finalTheme = "dark";
        let finalEffect = "particles";
        let finalPoster = "/partiful/Aquarius.avif";
        let finalVibeId = "classic";

        const hasUrlParams = !!(searchParams.get("theme") || searchParams.get("effect") || searchParams.get("poster") || searchParams.get("vibeId"));

        const savedData = localStorage.getItem("pending_event_data");
        if (savedData && !hasUrlParams) {
            try {
                const parsed = JSON.parse(savedData);
                setPendingData(parsed);
                if (parsed.vibeId) finalVibeId = parsed.vibeId;
                if (parsed.selectedTheme) finalTheme = parsed.selectedTheme;
                if (parsed.effect) finalEffect = parsed.effect;
                if (parsed.coverImage) finalPoster = parsed.coverImage;
                if (parsed.rsvpStyle) setRSVPStyle(parsed.rsvpStyle);
                if (parsed.showRSVP !== undefined) setShowRSVP(parsed.showRSVP);
                if (parsed.rsvpLabels) setRSVPLabels(parsed.rsvpLabels);
                if (parsed.settings) setSettings(parsed.settings);
            } catch (err) {
                console.error("Failed to parse pending event data:", err);
            }
        }

        // URL Params OVERRIDE local storage
        if (searchParams.get("theme")) finalTheme = normalizeThemeId(searchParams.get("theme")!);
        if (searchParams.get("effect")) finalEffect = normalizeEffectId(searchParams.get("effect")!);
        if (searchParams.get("poster")) finalPoster = searchParams.get("poster")!;
        if (searchParams.get("vibeId")) finalVibeId = searchParams.get("vibeId")!;

        setSelectedTheme(finalTheme);
        setEffect(finalEffect);
        setCoverImage(finalPoster);
        setVibeId(finalVibeId);

        // If URL params exist, populate pendingData so EventForm immediately syncs on first render!
        if (hasUrlParams) {
            setPendingData((prev: any) => ({
                ...(prev || {}),
                coverImage: finalPoster,
                vibeId: finalVibeId,
                selectedTheme: finalTheme,
                effect: finalEffect,
                theme: {
                    ...(prev?.theme || {}),
                    vibeId: finalVibeId,
                    backgroundTheme: finalTheme,
                    effect: finalEffect,
                }
            }));
        }

        setIsLoaded(true);
    }, [searchParams]);

    const toggleTheme = () => setIsThemeOpen(!isThemeOpen);

    // Persist all states in one object — debounced to avoid blocking on every keystroke
    useEffect(() => {
        if (!isLoaded) return;

        if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
        persistTimerRef.current = setTimeout(() => {
            const saveData = {
                ...pendingData,
                vibeId,
                selectedTheme,
                effect,
                coverImage,
                rsvpStyle,
                showRSVP,
                rsvpLabels,
                settings
            };
            localStorage.setItem("pending_event_data", JSON.stringify(saveData));
        }, 600);
    }, [pendingData, vibeId, selectedTheme, effect, coverImage, rsvpStyle, showRSVP, rsvpLabels, settings, isLoaded]);

    const handleSubmit = async (data: any) => {
        if (!session) {
            // State is already persisted via useEffect, just redirect
            router.push(`/auth/signin?callbackUrl=/events/create`);
            return;
        }

        setIsLoading(true);

        // Only pass colors if they are valid 6-digit hex strings
        const isHex = (v: unknown) => typeof v === 'string' && /^#[0-9A-Fa-f]{6}$/.test(v);

        const submitData = {
            ...data,
            coverImage: coverImage, // Guarantee the cover image selected in the sidebar is sent!
            // Extract core settings from the settings state
            isPrivate: settings.privacy?.isPrivate,
            visibility: settings.privacy?.isPrivate ? "PRIVATE" : (data.visibility || settings.privacy?.visibility || "PUBLIC"),
            guestListHidden: settings.privacy?.guestListHidden,
            capacity: data.capacity,
            cost: data.cost || settings.cost,
            isPaid: data.isPaid !== undefined ? data.isPaid : (settings.cost !== ""),
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
                // Only send colors if they are valid hex — theme IDs (meadow, streak) are NOT colors
                primaryColor: isHex(pendingData?.theme?.primaryColor) ? pendingData?.theme?.primaryColor : undefined,
                secondaryColor: isHex(pendingData?.theme?.secondaryColor) ? pendingData?.theme?.secondaryColor : undefined,
                settings: settings
            }
        };

        try {
            const response = await fetch("/api/events/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(submitData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to create event");
            }

            // Clear all persisted data on success
            localStorage.removeItem("pending_event_data");
            localStorage.removeItem("event_theme_id");
            localStorage.removeItem("event_effect_id");
            localStorage.removeItem("event_cover_image");

            // Redirect to the event page and trigger instant Share Sheet
            router.push(`/e/${result.event.slug}?created=true&share=true`);
        } catch (error: any) {
            console.error("Failed to create event:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };



    const handleDataChange = useCallback((data: any) => {
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
        if (data.capacity !== undefined || data.visibility !== undefined || data.requireApproval !== undefined || data.cost !== undefined) {
            setSettings(prev => ({
                ...prev,
                rsvp: {
                    ...prev.rsvp,
                    capacity: data.capacity !== undefined ? (data.capacity === "" ? null : Number(data.capacity)) : prev.rsvp.capacity,
                    requireApproval: data.requireApproval !== undefined ? data.requireApproval : prev.rsvp.requireApproval
                },
                privacy: {
                    ...prev.privacy,
                    visibility: data.visibility !== undefined ? data.visibility : prev.privacy.visibility,                    isPrivate: data.visibility === "PRIVATE" ? true : (data.visibility === "PUBLIC" ? false : prev.privacy.isPrivate)
                },
                cost: data.cost !== undefined ? data.cost : prev.cost
            }));
        }
    }, []);

    const handleCancel = () => {
        router.push("/dashboard");
    };

    const handleSidebarClick = (label: string) => {
        if (label === "Font") setIsFontOpen(true);
        if (label === "Theme") setIsThemeOpen(true);
        if (label === "Effect") setIsEffectOpen(true);
        if (label === "Preview") setIsPreviewMode(true);
        if (label === "Settings") setIsSettingsOpen(true);
        if (label === "Publish") {
            document.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
        if (label === "Sign in") {
            router.push("/api/auth/signin");
        }
    };

    // Background style using selected Color Palette (independent of Vibe)
    const has3DTheme = selectedTheme && INTERACTIVE_THEMES.includes(selectedTheme);
    const hasVideoTheme = selectedTheme && (selectedTheme.startsWith('preset-video:') || ANIMATED_THEME_PRESETS.some(p => p.id === selectedTheme));
    const primaryColor = pendingData?.theme?.primaryColor || "#3b82f6"; // Default to blue

    let bgStyle: React.CSSProperties = (has3DTheme || hasVideoTheme) ? { background: '#0a0a0b' } : {
        background: `radial-gradient(circle at 50% 50%, ${primaryColor} 0%, #000000 100%)`
    };

    if (selectedTheme?.startsWith('custom-gradient:')) {
        const color = selectedTheme.split(':')[1];
        bgStyle = {
            background: `linear-gradient(90deg, ${color} 0%, #ffffff 50%, ${color} 100%)`
        };
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

            {/* Background Glow Effects (Brighter and more balanced) */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-950/5 blur-[150px] rounded-full"></div>
                
                {/* Preset Video Theme Background */}
                {(selectedTheme?.startsWith('preset-video:') || ANIMATED_THEME_PRESETS.some(p => p.id === selectedTheme)) && (() => {
                    const presetId = selectedTheme?.startsWith('preset-video:') ? selectedTheme.split(':')[1] : selectedTheme;
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

            {/* Fixed Viewport Effects */}
            <div className="fixed inset-0 pointer-events-none z-[5]">
                {/* Cyber Grid */}
                {effect === 'grid' && (
                    <div className="absolute inset-0 opacity-[0.05]"
                        style={{ backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
                    ></div>
                )}

                {/* Floating Particles */}
                {effect === 'particles' && <FloatingParticles />}

                {/* 3D Theme Backgrounds (Meadow grass, Streak lines, Crystal, Waves) + Effect (Ghost Skiers) */}
                {(INTERACTIVE_THEMES.includes(selectedTheme || '') || effect === 'skiing') && (
                    <InteractiveBackground currentTheme={selectedTheme} currentEffect={effect} />
                )}

                {/* Aurora Glow */}
                {effect === 'aurora' && (
                    <div className="absolute inset-0 opacity-60 mix-blend-screen">
                        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-cyan-500/50 blur-[120px] rounded-full animate-pulse"></div>
                        <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-green-500/50 blur-[120px] rounded-full animate-pulse delay-700"></div>
                        <div className="absolute top-1/2 left-1/2 w-[50%] h-[50%] bg-rose-500/50 blur-[120px] rounded-full animate-pulse delay-1000"></div>
                    </div>
                )}

                {/* Pulse Glow */}
                {effect === 'glow' && (
                    <div className="absolute inset-0 mix-blend-screen animate-pulse">
                        <div className="absolute top-1/4 left-1/4 w-[40rem] h-[40rem] bg-rose-500/30 blur-[120px] rounded-full"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-[40rem] h-[40rem] bg-emerald-500/30 blur-[120px] rounded-full"></div>
                    </div>
                )}

                {/* Confetti Explosion */}
                {effect === 'confetti' && <Confetti />}

                {/* Rain */}
                {effect === 'rain' && <Rain />}

                {/* Cinematic Vignette */}
                {effect === 'vignette' && (
                    <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 300px rgba(0,0,0,0.95)' }}></div>
                )}
            </div>

            {/* Foreground Overlay VFX (Overlaps background, behind UI) */}
            <div className="fixed inset-0 pointer-events-none z-[8]">
                {/* Custom Uploaded Effect */}
                {effect?.startsWith('custom-uploaded:') && (
                    <CustomFloatingVfx imageUrl={effect.split(':')[1]} />
                )}
                {/* Preset Image FX */}
                {(effect?.startsWith('preset-image:') || IMAGE_VFX_PRESETS.some(p => p.id === effect)) && (() => {
                    const presetId = effect?.startsWith('preset-image:') ? effect.split(':')[1] : effect;
                    const preset = IMAGE_VFX_PRESETS.find(p => p.id === presetId);
                    if (preset) {
                        return <CustomFloatingVfx imageUrl={preset.imageUrl} />;
                    }
                    return null;
                })()}

                {/* Preset WebM Video FX / Lottie */}
                {(effect?.startsWith('preset-webm:') || VIDEO_VFX_PRESETS.some(p => p.id === effect)) && (() => {
                    const presetId = effect?.startsWith('preset-webm:') ? effect.split(':')[1] : effect;
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
            {isPreviewMode && (
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
                    <button className="px-8 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-xs font-bold transition-all shadow-lg shadow-emerald-500/20">
                        Save Draft
                    </button>
                </div>
            )}

            <main className={`relative z-10 mx-auto px-6 sm:px-10 pt-20 pb-48 lg:pb-48 pb-32 grid grid-cols-1 ${isPreviewMode ? 'max-w-xl' : 'lg:grid-cols-[1.2fr_380px] max-w-5xl gap-12 justify-center'} transition-all duration-700`}>
                {/* Left Column: Form Section */}
                <div className={`space-y-12 animate-in fade-in slide-in-from-left-8 duration-1000 ease-out ${isPreviewMode ? 'hidden' : ''}`}>

                    {/* Mobile cover thumbnail — hidden on lg where the real preview column shows */}
                    <div className="lg:hidden w-full aspect-video rounded-2xl overflow-hidden relative shadow-xl">
                        <Image
                            src={coverImage}
                            alt="Event cover"
                            fill
                            className="object-cover"
                            unoptimized
                        />
                        <button
                            type="button"
                            onClick={() => setIsGalleryOpen(true)}
                            className="absolute inset-0 flex items-end justify-end p-3"
                        >
                            <span className="bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full">
                                Change cover
                            </span>
                        </button>
                    </div>

                    <div className="flex items-center gap-4 text-white/40">
                        <div className="h-px w-12 bg-current opacity-20"></div>
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
                            effect={effect}
                        />
                    </div>
                </div>

                {/* Middle Column: Visual Preview (Sticky) */}
                <div className={`space-y-10 pt-4 ${isPreviewMode ? 'w-full scale-110' : 'hidden lg:block sticky top-24 h-fit'} animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 transition-all duration-700`}>
                    <div className="space-y-4">
                        {!isPreviewMode && (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                </div>
                            </div>
                        )}
                        {/* Event Image Card */}
                        <div
                            className="bg-[#2a2a2a] rounded-none border border-white/[0.05] overflow-hidden relative group shadow-[0_60px_100px_-30px_rgba(0,0,0,0.8)]"
                            style={{
                                aspectSizing: 'allow-keywords',
                                aspectRatio: '1 / 1',
                                width: '100%',
                                maxWidth: '100%',
                                minHeight: '200px',
                                maxHeight: 'max(10vh - 400px, 600px)',
                                marginBottom: '24px',
                                display: 'flex',
                                justifyContent: 'center',
                                position: 'relative',
                                flex: 'none',
                                alignSelf: 'center',
                                cursor: 'pointer',
                                boxSizing: 'border-box',
                                // @ts-ignore
                                '--qb-dialog-container-width': '320px',
                                '--qb-dialog-container-height': '650px',
                                '--qb-dialog-drag-handler-height': '24px',
                                '--qb-toolbar-container-default-width': '48px',
                                '--qb-comp-card-base-overflow': 'visible',
                                '--qb-comp-card-base-background-color': 'transparent',
                                '--qb-comp-card-base-box-shadow': 'none',
                                '--qb-highlight-underline-thickness': '2px',
                                '--qb-highlight-selected-underline-thickness': '2px',
                                '--qb-highlight-underline-offset': '2px',
                                '--qb-highlight-grammar-error-underline-color': '#f2a6a6',
                                '--qb-highlight-grammar-error-background-color': 'transparent',
                                '--qb-highlight-grammar-error-selected-underline-color': '#df2020',
                                '--qb-highlight-grammar-error-selected-background-color': 'rgba(220, 38, 38, 0.1)',
                                '--qb-highlight-grammar-error-emphasized-underline-color': '#df2020',
                                '--qb-highlight-grammar-error-emphasized-background-color': 'rgba(220, 38, 38, 0.1)',
                                '--qb-highlight-spelling-error-underline-color': '#f2a6a6',
                                '--qb-highlight-spelling-error-background-color': 'transparent',
                                '--qb-highlight-spelling-error-selected-underline-color': '#df2020',
                                '--qb-highlight-spelling-error-selected-background-color': 'rgba(220, 38, 38, 0.1)',
                                '--qb-highlight-spelling-error-emphasized-underline-color': '#df2020',
                                '--qb-highlight-spelling-error-emphasized-background-color': 'rgba(220, 38, 38, 0.1)',
                                '--qb-highlight-style-error-underline-color': '#00000033',
                                '--qb-highlight-style-error-background-color': 'transparent',
                                '--qb-highlight-style-error-selected-underline-color': '#b4b4b4',
                                '--qb-highlight-style-error-selected-background-color': 'rgba(67, 67, 67, 0.1)',
                                '--qb-highlight-style-error-emphasized-underline-color': '#b4b4b4',
                                '--qb-highlight-style-error-emphasized-background-color': 'rgba(67, 67, 67, 0.1)',
                                '--qb-highlight-selection-paraphrase-word-underline-color': '#0042d7',
                                '--qb-highlight-selection-paraphrase-word-background-color': 'transparent',
                                '--qb-highlight-selection-paraphrase-phrase-underline-color': '#0042d7',
                                '--qb-highlight-selection-paraphrase-phrase-background-color': 'rgb(0, 103, 197, 0.15)',
                                '--qb-highlight-selection-paraphrase-sentence-underline-color': 'transparent',
                                '--qb-highlight-selection-paraphrase-sentence-background-color': 'rgb(0, 103, 197, 0.15)',
                                '--qb-highlight-selection-toolbox-word-underline-color': '#00000033',
                                '--qb-highlight-selection-toolbox-word-background-color': 'rgba(67, 67, 67, 0.1)',
                                '--qb-highlight-selection-toolbox-phrase-underline-color': '#00000033',
                                '--qb-highlight-selection-toolbox-phrase-background-color': 'rgb(0, 103, 197, 0.15)',
                                '--qb-highlight-selection-toolbox-sentence-underline-color': 'transparent',
                                '--qb-highlight-selection-toolbox-sentence-background-color': 'rgb(0, 103, 197, 0.15)',
                                '--qb-highlight-sentence-from-hover-underline-color': 'transparent',
                                '--qb-highlight-sentence-from-hover-background-color': 'rgba(67, 67, 67, 0.1)',
                                '--qb-highlight-word-from-hover-underline-color': 'transparent',
                                '--qb-highlight-word-from-hover-background-color': 'rgba(67, 67, 67, 0.1)',
                                '--qb-highlight-sentence-from-caret-underline-color': '#00000033',
                                '--qb-highlight-sentence-from-caret-background-color': 'rgba(67, 67, 67, 0.1)',
                                '--qb-highlight-word-from-caret-underline-color': 'transparent',
                                '--qb-highlight-word-from-caret-background-color': 'rgba(67, 67, 67, 0.1)',
                                '--qb-toolbox-onboarding-cta-pulse-color': 'rgba(23, 135, 51, 0.8)',
                                '--lt-color-gray-100': '#f8f9fc',
                                '--lt-color-gray-200': '#f1f3f9',
                                '--lt-color-gray-300': '#dee3ed',
                                '--lt-color-gray-400': '#c2c9d6',
                                '--lt-color-gray-500': '#8f96a3',
                                '--lt-color-gray-600': '#5e636e',
                                '--lt-color-gray-700': '#2f3237',
                                '--lt-color-gray-800': '#1d1e20',
                                '--lt-color-gray-900': '#111213',
                                '--lt-shadowDefault': '0 2px 6px -1px rgba(0, 0, 0, 0.16),0 1px 4px -1px rgba(0, 0, 0, 0.04)',
                                '--lt-shadowActive': '0 0 8px -2px rgba(0, 0, 0, 0.1),0 6px 20px -3px rgba(0, 0, 0, 0.2)',
                                '--lt-color-white': '#fff',
                                '--lt-color-black': '#111213',
                                '--lt-color-transparent': 'rgba(255, 255, 255, 0)',
                                '--lt-color-background-light': 'var(--lt-color-gray-100)',
                                '--lt-color-background-default': 'var(--lt-color-gray-200)',
                                '--lt-color-background-dark': 'var(--lt-color-gray-300)',
                                '--lt-color-border-light': 'var(--lt-color-gray-200)',
                                '--lt-color-border-default': 'var(--lt-color-gray-300)',
                                '--lt-color-border-dark': 'var(--lt-color-gray-400)',
                                '--lt-color-text-very-light': 'var(--lt-color-gray-500)',
                                '--lt-color-text-light': 'var(--lt-color-gray-600)',
                                '--lt-color-text-default': 'var(--lt-color-gray-700)',
                                '--lt-color-text-dark': 'var(--lt-color-gray-800)',
                                '--lt-color-overlay-default': '#fff',
                                '--lt-color-overlay-dark': '#fff',
                                '--lt-color-overlay-transparent': 'rgba(0, 0, 0, 0.1)',
                                '--lt-shadow-website-overlay': '0 0 7px 0 rgba(0, 0, 0, 0.3)',
                                '--page-margin-bottom': '0px',
                                '--page-margin-top': '0px',
                                '--background-color': '#252464',
                                '--background-color-80': '#252464cc',
                                '--primary-color': '#ab76f6',
                                '--primary-color-90': '#ab76f6e6',
                                '--primary-color-80': '#ab76f6cc',
                                '--primary-color-70': '#ab76f6b3',
                                '--primary-color-50': '#ab76f680',
                                '--primary-color-30': '#ab76f64d',
                                '--primary-color-20': '#ab76f633',
                                '--primary-color-10': '#ab76f61a',
                                '--primary-color-05': '#ab76f60d',
                                '--primary-color-light': '#c9a6f9',
                                '--primary-color-very-light': '#fff',
                                '--danger-color': '#fa304b',
                                '--danger-color-90': '#fa304be6',
                                '--danger-color-70': '#fa304bb3',
                                '--danger-color-50': '#fa304b80',
                                '--danger-color-30': '#fa304b4d',
                                '--danger-color-10': '#fa304b1a',
                                '--danger-color-light': '#fb6276',
                                '--danger-color-very-light': '#fec5cd',
                                '--warning-color': '#ffc562',
                                '--warning-color-90': '#ffc562e6',
                                '--warning-color-70': '#ffc562b3',
                                '--warning-color-50': '#ffc56280',
                                '--warning-color-30': '#ffc5624d',
                                '--warning-color-25': '#ffc56240',
                                '--warning-color-10': '#ffc5621a',
                                '--text-color': '#fff',
                                '--text-color-90': '#ffffffe6',
                                '--text-color-80': '#fffc',
                                '--text-color-70': '#fffc',
                                '--text-color-60': '#ffffffb3',
                                '--text-color-50': '#fff9',
                                '--text-color-40': '#ffffff80',
                                '--text-color-30': '#fff6',
                                '--text-color-20': '#ffffff4d',
                                '--text-color-15': '#ffffff40',
                                '--text-color-10': '#ffffff26',
                                '--text-color-05': '#ffffff1a',
                                '--text-color-02': '#ffffff05',
                                '--inverse-text-color': '#000',
                                '--inverse-text-color-70': '#000c',
                                '--inverse-text-color-50': '#0009',
                                '--inverse-text-color-30': '#0006',
                                '--inverse-text-color-20': '#0000004d',
                                '--shadow-color': '#0000004d',
                                '--shadow-color-light': '#0003',
                                '--card-gradient-background': 'radial-gradient(88.39% 90.7% at 89.05% -20.96%,#34cc26 0%,#fff0 100%),radial-gradient(40.01% 71.83% at 8.32% 97.77%,#a8cc6d 0%,#8e7cff00 100%),#563eb8',
                                '--input-gradient-background': 'linear-gradient(90deg,#351a8e,#6b429c)',
                                '--pill-background-color': '#ffffff1a',
                                '--pill-background-color-2': '#ffffff4d',
                                '--toolbar-background-color': '#fff3',
                                '--menu-background-color': '#ffffff4d',
                                '--table-header-color': '#1a262a',
                                '--table-column-color': '#2a3d43',
                                '--card-hover-color': '#ffffff26',
                                '--danger-text-color': '#fa304b',
                                '--danger-with-background-text-color': '#fff',
                                '--danger-input-border-color': '#fa304b',
                                '--danger-control-background-color': '#fa304b',
                                '--danger-control-hover-background-color': '#fa304bcc',
                                '--danger-control-active-background-color': '#fa304b99',
                                '--shared-font-weight': '400',
                                '--shared-line-height': '1.4',
                                '--shared-hover-opacity': '.8',
                                '--shared-active-opacity': '.6',
                                '--shared-disabled-opacity': '.4',
                                '--shared-border-width': '1px',
                                '--shared-large-border-width': '2px',
                                '--shared-border-radius': '4px',
                                '--shared-large-border-radius': '12px',
                                '--shared-round-border-radius': '800px',
                                '--shared-black': '#000',
                                '--shared-white': '#fff',
                                '--shared-box-shadow-radius': '12px',
                                '--spacing-xx-large': '40px',
                                '--spacing-x-large': '24px',
                                '--spacing-large': '16px',
                                '--spacing-medium': '12px',
                                '--spacing-small': '8px',
                                '--spacing-x-small': '4px',
                                '--spacing-xx-small': '2px',
                                '--spacing-line-to-line': '2px',
                                '--spacing-header-to-body': '12px',
                                '--spacing-header-to-detail': '4px',
                                '--animation-duration-quick': '.15s',
                                '--animation-duration-default': '.3s',
                                '--animation-duration-confirmation': '.6s',
                                '--text-display-font-weight': '700',
                                '--text-display-1-font-size': 'var(--text-xxxxx-large-size)',
                                '--text-display-2-font-size': 'var(--text-xxxx-large-size)',
                                '--text-display-3-font-size': 'var(--text-xxx-large-size)',
                                '--text-display-4-font-size': 'var(--text-x-large-size)',
                                '--text-header-font-weight': '700',
                                '--text-header-1-font-size': 'var(--text-xx-large-size)',
                                '--text-header-2-font-size': 'var(--text-x-large-size)',
                                '--text-header-3-font-size': 'var(--text-large-size)',
                                '--text-subheader-font-weight': '600',
                                '--text-subheader-1-font-size': 'var(--text-large-size)',
                                '--text-subheader-2-font-size': 'var(--text-medium-size)',
                                '--text-subheader-3-font-size': 'var(--text-small-size)',
                                '--text-body-font-weight': '400',
                                '--text-body-1-font-size': 'var(--text-large-size)',
                                '--text-body-2-font-size': 'var(--text-medium-size)',
                                '--text-detail-font-weight': '400',
                                '--text-detail-1-font-size': 'var(--text-medium-size)',
                                '--text-detail-2-font-size': 'var(--text-small-size)',
                                '--button-font-weight': '600',
                                '--button-gap': '4px',
                                '--button-outlined-border-width': '1px',
                                '--button-hover-opacity': '.6',
                                '--button-active-opacity': '.4',
                                '--button-large-font-size': 'var(--text-large-size)',
                                '--button-large-icon-size': 'var(--icon-large-size)',
                                '--button-large-horizontal-padding': '24px',
                                '--button-large-border-radius': '4px',
                                '--button-large-icon-only-border-radius': '800px',
                                '--button-large-minimal-icon-only-icon-size': 'var(--icon-x-large-size)',
                                '--button-medium-font-size': 'var(--text-medium-size)',
                                '--button-medium-icon-size': 'var(--icon-medium-size)',
                                '--button-medium-horizontal-padding': '16px',
                                '--button-medium-border-radius': '800px',
                                '--button-medium-minimal-icon-only-icon-size': 'var(--icon-large-size)',
                                '--button-small-font-size': 'var(--text-small-size)',
                                '--button-small-icon-size': 'var(--icon-small-size)',
                                '--button-small-horizontal-padding': '12px',
                                '--button-small-border-radius': '800px',
                                '--button-small-minimal-icon-only-icon-size': 'var(--icon-medium-size)',
                                '--category-option-font-weight': '600',
                                '--category-option-gap': '8px',
                                '--category-option-border-radius': '800px',
                                '--category-option-font-size': 'var(--text-medium-size)',
                                '--category-option-icon-size': 'var(--icon-medium-size)',
                                '--category-option-horizontal-padding': '16px',
                                '--category-selector-gap': '8px',
                                '--avatar-border-radius': '800px',
                                '--avatar-xxx-large-font-size': 'var(--text-xxx-large-size)',
                                '--avatar-xx-large-font-size': 'var(--text-xx-large-size)',
                                '--avatar-x-large-font-size': 'var(--text-x-large-size)',
                                '--avatar-large-font-size': 'var(--text-large-size)',
                                '--avatar-medium-font-size': 'var(--text-large-size)',
                                '--avatar-small-font-size': 'var(--text-small-size)',
                                '--avatar-x-small-font-size': 'var(--text-small-size)',
                                '--avatar-xx-small-font-size': 'var(--text-x-small-size)',
                                '--avatar-xxx-large-square-border-radius': '16px',
                                '--avatar-xx-large-square-border-radius': '16px',
                                '--avatar-x-large-square-border-radius': '12px',
                                '--avatar-large-square-border-radius': '12px',
                                '--avatar-medium-square-border-radius': '8px',
                                '--avatar-small-square-border-radius': '8px',
                                '--avatar-x-small-square-border-radius': '4px',
                                '--avatar-xx-small-square-border-radius': '2px',
                                '--avatar-group-gap': '4px',
                                '--input-gap': '8px',
                                '--input-horizontal-padding': '12px',
                                '--input-rounded-horizontal-padding': '16px',
                                '--input-rounded-with-suffix-right-padding': '12px',
                                '--input-border-radius': '4px',
                                '--input-large-font-size': 'var(--text-large-size)',
                                '--input-large-icon-size': 'var(--icon-large-size)',
                                '--input-medium-font-size': 'var(--text-medium-size)',
                                '--input-medium-icon-size': 'var(--icon-medium-size)',
                                '--select-options-gap': '2px',
                                '--select-option-gap': '8px',
                                '--select-option-padding-horizontal': '16px',
                                '--select-option-icon-size': 'var(--icon-medium-size)',
                                '--select-minimal-gap': '2px',
                                '--select-minimal-focused-opacity': '.6',
                                '--select-option-large-icon-size': 'var(--icon-x-large-size)',
                                '--form-field-gap': '4px',
                                '--dropdown-font-size': 'var(--text-medium-size)',
                                '--dropdown-height': '32px',
                                '--dropdown-border-radius': '4px',
                                '--dropdown-caret-size': 'var(--icon-medium-size)',
                                '--switch-height': '20px',
                                '--switch-width': '40px',
                                '--switch-border-radius': '800px',
                                '--switch-border-width': '1px',
                                '--switch-gap': '8px',
                                '--switch-handle-size': '12px',
                                '--switch-handle-border-radius': '800px',
                                '--checkbox-icon-size': 'var(--icon-small-size)',
                                '--checkbox-gap': '8px',
                                '--checkbox-border-radius': '4px',
                                '--rsvp-button-border-radius': '800px',
                                '--rsvp-button-border-width': '1px',
                                '--rsvp-button-active-ring-size-scale': '1.2',
                                '--rsvp-button-animation-duration': '.2s',
                                '--rsvp-button-large-size': '128px',
                                '--rsvp-button-medium-size': '104px',
                                '--rsvp-button-medium-narrow-size': '96px',
                                '--rsvp-button-medium-extra-narrow-size': '88px',
                                '--rsvp-button-small-size': '44px',
                                '--rsvp-button-small-gap': '8px',
                                '--rsvp-button-group-large-gap': '32px',
                                '--rsvp-button-group-medium-gap': '24px',
                                '--rsvp-button-group-small-gap': '12px',
                                '--box-border-radius': '8px',
                                '--box-padding': '12px',
                                '--box-button-horizontal-padding': '12px',
                                '--box-button-vertical-padding': '16px',
                                '--box-button-gap': '2px',
                                '--callout-border-radius': '4px',
                                '--callout-padding': '16px',
                                '--callout-gap': '12px',
                                '--link-font-weight': '600',
                                '--info-text-gap': '4px',
                                '--info-text-boxed-padding': '8px',
                                '--footer-hint-margin-bottom': '12px',
                                '--footer-actions-gap': '16px',
                                '--footer-primary-action-min-width': '104px',
                                '--badge-gap': '4px',
                                '--badge-border-radius': '800px',
                                '--badge-font-weight': '600',
                                '--badge-small-font-size': 'var(--text-x-small-size)',
                                '--badge-medium-padding-horizontal': '8px',
                                '--badge-medium-font-size': 'var(--text-small-size)',
                                '--badge-small-dot-height': '4px',
                                '--badge-medium-dot-height': '8px',
                                '--header-bar-gap': '16px',
                                '--header-bar-z-index': '2',
                                '--event-field-icon-size': 'var(--icon-medium-size)',
                                '--event-field-icon-margin-end': '8px',
                                '--editable-event-field-padding-vertical': '4px',
                                '--wysiwyg-offset': '8px',
                                '--wysiwyg-border-radius': '4px',
                                '--wysiwyg-select-min-width': '128px',
                                '--wysiwyg-hover-background-opacity': '.6',
                                '--menu-sections-gap': '16px',
                                '--menu-section-text-gap': '4px',
                                '--menu-section-border-radius': '4px',
                                '--menu-item-padding': '16px',
                                '--menu-item-height': '60px',
                                '--menu-item-label-font-weight': '600',
                                '--menu-item-gap': '8px',
                                '--menu-item-icon-size': 'var(--icon-large-size)',
                                '--menu-item-right-icon-size': 'var(--icon-small-size)',
                                '--menu-item-right-label-max-width': '120px',
                                '--menu-item-right-gap': '4px',
                                '--toast-border-radius': '12px',
                                '--toast-icon-size': 'var(--icon-large-size)',
                                '--toast-padding-horizontal': '16px',
                                '--toast-padding-vertical': '12px',
                                '--toast-z-index': 'calc(var(--modal-z-index) + 100)',
                                '--popover-border-radius': '4px',
                                '--popover-z-index': '3',
                                '--tooltip-max-width': '200px',
                                '--tooltip-padding-vertical': '8px',
                                '--tooltip-padding-horizontal': '12px',
                                '--modal-min-width': '320px',
                                '--modal-border-radius': '12px',
                                '--modal-z-index': '100',
                                '--modal-blur-radius': '100px',
                                '--modal-with-header-content-padding-top': '8px',
                                '--non-ideal-state-glyph-size': 'var(--icon-xxx-large-size)',
                                '--non-ideal-state-glyph-margin-bottom': '8px',
                                '--non-ideal-state-description-margin-top': '4px',
                                '--non-ideal-state-button-margin-top': '24px',
                                '--reaction-option-height': '32px',
                                '--reaction-option-min-width': '56px',
                                '--reaction-option-add-reaction-width': '48px',
                                '--reaction-option-border-radius': '800px',
                                '--reaction-option-horizontal-padding': '8px',
                                '--reaction-option-gap': '4px',
                                '--reaction-option-font-size': 'var(--text-medium-size)',
                                '--reaction-option-glyph-size': 'var(--icon-medium-size)',
                                '--reaction-option-font-weight': '600',
                                '--reaction-option-count-right-margin': 'var(--spacing-xx-small)',
                                '--reaction-selector-gap': '8px',
                                '--user-row-padding-horizontal': 'calc(var(--spacing-screen-margin-horizontal) - var(--user-row-margin-horizontal))',
                                '--user-row-padding-vertical': '12px',
                                '--user-row-column-gap': '12px',
                                '--user-row-row-gap': '2px',
                                '--user-row-metadata-item-gap': '4px',
                                '--user-row-dense-padding-vertical': '8px',
                                '--user-list-gap': 'var(--spacing-xx-small)',
                                '--image-grid-gap': 'var(--spacing-x-small)',
                                '--image-grid-default-image-width': '200px',
                                '--payment-button-padding': '16px',
                                '--payment-button-label-margin-left': '12px',
                                '--payment-button-cta-margin-left': '12px',
                                '--payment-button-side-margin': '16px',
                                '--guest-ticket-content-already-paid-margin-top': '24px',
                                '--guest-ticket-content-cost-margin-top': '8px',
                                '--card-image-width': '85%',
                                '--card-toolbar-max-width': '304px',
                                '--editable-card-image-rotation': '-6deg',
                                '--editable-card-image-width': '80%',
                                '--editable-card-image-envelope-aspect-ratio': '5/6',
                                '--editable-card-image-envelope-top-offset': '-10%',
                                '--editable-card-image-envelope-right-offset': '-5%',
                                '--editable-card-image-envelope-rotate-z': '16deg',
                                '--card-card-padding': '12px',
                                '--card-card-image-margin-bottom': '8px',
                                '--day-picker-day-small-size': '36px',
                                '--day-picker-day-medium-size': '40px',
                                '--day-picker-day-large-size': '44px',
                                '--day-picker-day-x-large-size': '48px',
                                '--post-it-border-radius': '12px',
                                '--post-it-padding-horizontal': '16px',
                                '--post-it-padding-vertical': '12px',
                                '--post-it-header-gap': '12px',
                                '--post-it-content-margin-top': '8px',
                                '--post-it-push-pin-size': '12px',
                                '--post-it-push-pin-size-shine': '8px',
                                '--post-it-push-pin-top-offset': '-4px',
                                '--post-it-list-left-rotate': '-4deg',
                                '--post-it-list-right-rotate': '4deg',
                                '--post-it-list-gap': '16px',
                                '--post-it-list-new-box-gap': '12px',
                                '--post-it-list-new-box-asset-height': '64px',
                                '--post-it-list-new-box-asset-width': '60px',
                                '--post-it-list-new-box-asset-rotate': '-4deg',
                                '--post-it-list-new-box-border-width': '2px',
                                '--shared-primary-color': '#fff',
                                '--shared-inverse-color': '#000',
                                '--shared-danger-color': '#fa304b',
                                '--shared-box-shadow-color': '#00000040',
                                '--shared-hover-background-color': '#ffffff1a',
                                '--scrollbar-background-color': '#fff6',
                                '--scrollbar-hover-background-color': '#fff9',
                                '--text-display-color': '#fff',
                                '--text-display-inverse-color': '#000',
                                '--text-header-color': '#fff',
                                '--text-header-inverse-color': '#000',
                                '--text-subheader-color': '#fff',
                                '--text-subheader-inverse-color': '#000',
                                '--text-body-color': '#fffc',
                                '--text-body-inverse-color': '#000c',
                                '--text-detail-color': '#fff9',
                                '--text-detail-inverse-color': '#0009',
                                '--text-inactive-color': '#fff6',
                                '--text-inactive-inverse-color': '#0006',
                                '--avatar-text-color': '#000c',
                                '--avatar-minimal-text-color': '#fffc',
                                '--avatar-minimal-background-color': '#ffffff40',
                                '--button-filled-label-color': '#000',
                                '--button-filled-background-color': '#fff',
                                '--button-filled-hover-label-color': '#000c',
                                '--button-filled-hover-background-color': '#fffc',
                                '--button-filled-active-label-color': '#0009',
                                '--button-filled-active-background-color': '#fff9',
                                '--button-filled-danger-label-color': '#fff',
                                '--button-filled-danger-background-color': '#fa304b',
                                '--button-filled-danger-hover-label-color': '#fffc',
                                '--button-filled-danger-hover-background-color': '#fa304bcc',
                                '--button-filled-danger-active-label-color': '#fff9',
                                '--button-filled-danger-active-background-color': '#fa304b99',
                                '--button-outlined-label-color': '#fff',
                                '--button-outlined-background-color': '#ffffff0d',
                                '--button-outlined-border-color': '#fff6',
                                '--button-outlined-hover-border-color': '#fff6',
                                '--button-outlined-hover-background-color': '#ffffff1a',
                                '--button-outlined-active-border-color': '#fff6',
                                '--button-outlined-active-background-color': '#ffffff40',
                                '--button-outlined-danger-label-color': '#fa304b',
                                '--button-outlined-danger-border-color': '#fa304b66',
                                '--button-outlined-danger-hover-border-color': '#fa304b66',
                                '--button-outlined-danger-hover-background-color': '#fa304b1a',
                                '--button-outlined-danger-active-border-color': '#fa304b99',
                                '--button-outlined-danger-active-background-color': '#fa304b33',
                                '--button-minimal-label-color': '#fff',
                                '--button-minimal-hover-background-color': '#ffffff1a',
                                '--button-minimal-active-background-color': '#ffffff40',
                                '--button-minimal-danger-label-color': '#fa304b',
                                '--button-minimal-danger-hover-background-color': '#fa304b1a',
                                '--button-minimal-danger-active-background-color': '#fa304b33',
                                '--category-option-label-color': '#fff',
                                '--category-option-suffix-color': '#fff9',
                                '--category-option-background-color': '#ffffff0d',
                                '--category-option-hover-border-color': '#ffffff40',
                                '--category-option-selected-background-color': '#ffffff26',
                                '--category-option-selected-border-color': '#fff9',
                                '--rsvp-button-background-color': 'transparent',
                                '--rsvp-button-border-color': '#ffffff40',
                                '--rsvp-button-glyph-color': '#fff',
                                '--rsvp-interested-button-group-background-color': '#000',
                                '--rsvp-interested-button-group-border-color': '#0000001a',
                                '--rsvp-interested-button-group-divider-background-color': '#fff9',
                                '--rsvp-interested-button-group-font-color': '#fff',
                                '--tag-label-color': '#fffc',
                                '--tag-detail-color': '#fff9',
                                '--tag-background-color': '#ffffff0d',
                                '--tag-hover-background-color': '#ffffff1a',
                                '--tag-active-background-color': '#ffffff40',
                                '--tag-selected-label-color': '#000',
                                '--tag-selected-detail-color': '#000c',
                                '--tag-selected-background-color': '#fff',
                                '--tag-selected-hover-background-color': '#fffc',
                                '--tag-selected-active-background-color': '#fff9',
                                '--tag-special-selected-label-color': '#000',
                                '--tag-special-selected-detail-color': '#000c',
                                '--input-placeholder-color': '#fff6',
                                '--input-value-color': '#fff',
                                '--input-icon-color': '#fff6',
                                '--input-border-color': '#ffffff1a',
                                '--input-background-color': '#ffffff0d',
                                '--input-hover-border-color': '#ffffff26',
                                '--input-hover-background-color': '#ffffff1a',
                                '--input-active-border-color': '#ffffff0d',
                                '--input-active-background-color': '#ffffff40',
                                '--input-focused-icon-color': '#fff',
                                '--input-focused-border-color': '#fff6',
                                '--input-focused-background-color': '#ffffff0d',
                                '--input-danger-border-color': '#fa304b',
                                '--select-option-icon-color': '#fffc',
                                '--select-option-label-color': '#fffc',
                                '--select-option-description-color': '#fff9',
                                '--select-option-hover-background-color': '#ffffff1a',
                                '--select-option-hover-border-color': '#ffffff08',
                                '--select-option-active-background-color': '#ffffff40',
                                '--select-option-active-border-color': '#ffffff08',
                                '--select-option-selected-background-color': '#ffffff0d',
                                '--select-option-selected-border-color': '#ffffff08',
                                '--select-option-selected-icon-color': '#fff',
                                '--select-option-selected-label-color': '#fff',
                                '--select-option-selected-description-color': '#fffc',
                                '--switch-checked-handle-color': '#000',
                                '--switch-unchecked-handle-color': '#fffc',
                                '--switch-checked-track-color': '#fff',
                                '--switch-track-border-color': '#ffffff40',
                                '--checkbox-icon-color': '#000',
                                '--checkbox-unchecked-border-color': '#fff9',
                                '--checkbox-unchecked-hover-border-color': '#fffc',
                                '--checkbox-unchecked-active-border-color': '#fff9',
                                '--checkbox-checked-background-color': '#fff',
                                '--checkbox-checked-hover-background-color': '#fffc',
                                '--checkbox-checked-active-background-color': '#fff9',
                                '--box-background-color': '#ffffff0d',
                                '--box-border-color': '#ffffff1a',
                                '--callout-background-color': '#ffffff0d',
                                '--callout-border-color': '#ffffff1a',
                                '--callout-special-background-color': '#000',
                                '--callout-special-border-color': '#ffffff26',
                                '--info-text-boxed-background-color': '#ffffff0d',
                                '--info-text-boxed-danger-background-color': '#fa304b1a',
                                '--footer-border-color': '#ffffff1a',
                                '--divider-border-color': '#ffffff1a',
                                '--badge-filled-label-color': '#000',
                                '--badge-filled-background-color': '#fff',
                                '--badge-filled-danger-label-color': '#fff',
                                '--badge-filled-danger-background-color': '#fa304b',
                                '--badge-filled-warning-label-color': '#fff',
                                '--badge-filled-warning-background-color': '#fb0',
                                '--badge-minimal-label-color': '#fff',
                                '--badge-minimal-background-color': '#ffffff1a',
                                '--badge-minimal-danger-label-color': '#fa304b',
                                '--event-field-icon-color': '#fffc',
                                '--wysiwyg-border-color': '#ffffff26',
                                '--wysiwyg-background-color': '#ffffff26',
                                '--wysiwyg-focused-border-color': '#fff9',
                                '--wysiwyg-focused-background-color': '#000c',
                                '--menu-item-label-color': '#fffc',
                                '--menu-item-active-label-color': '#fff',
                                '--menu-item-danger-label-color': '#fa304bcc',
                                '--menu-item-danger-active-label-color': '#fa304b',
                                '--menu-item-detail-color': '#fff9',
                                '--menu-item-active-detail-color': '#fffc',
                                '--menu-item-danger-detail-color': '#fa304b99',
                                '--menu-item-danger-active-detail-color': '#fa304bcc',
                                '--menu-item-background-color': '#ffffff0d',
                                '--menu-item-hover-background-color': '#ffffff1a',
                                '--menu-item-active-background-color': '#ffffff26',
                                '--theme-or-effect-option-background-color': '#ffffff26',
                                '--toast-background-color': '#000',
                                '--toast-border-color': '#ffffff1a',
                                '--popover-background-color': '#000',
                                '--popover-border-color': '#ffffff26',
                                '--popover-arrow-border-color': '#ffffff36',
                                '--modal-overlay-fade-color': '#ffffff0d',
                                '--reaction-option-background-color': '#ffffff26',
                                '--reaction-option-count-color': '#fff9',
                                '--reaction-option-hover-border-color': '#ffffff40',
                                '--reaction-option-selected-count-color': '#fff',
                                '--user-row-hover-background-color': '#ffffff1a',
                                '--user-row-hover-border-color': '#ffffff1a',
                                '--user-row-active-background-color': '#ffffff26',
                                '--user-row-active-border-color': '#ffffff26',
                                '--user-row-selected-background-color': '#ffffff1a',
                                '--user-row-selected-border-color': '#ffffff1a',
                                '--day-picker-week-day-header-color': '#fff6',
                                '--day-picker-day-color': '#fffc',
                                '--day-picker-day-hover-background-color': '#ffffff0d',
                                '--day-picker-day-hover-border-color': '#ffffff1a',
                                '--day-picker-day-outside-color': '#fff6',
                                '--day-picker-day-disabled-color': '#ffffff40',
                                '--day-picker-day-selected-background-color': '#fff',
                                '--day-picker-day-selected-color': '#000',
                                '--spacing-screen-margin-horizontal': '24px',
                                '--spacing-screen-margin-vertical': '24px',
                                '--text-xxxxx-large-size': '72px',
                                '--text-xxxx-large-size': '52px',
                                '--text-xxx-large-size': '32px',
                                '--text-xx-large-size': '28px',
                                '--text-x-large-size': '22px',
                                '--text-large-size': '18px',
                                '--text-medium-size': '16px',
                                '--text-small-size': '14px',
                                '--text-x-small-size': '12px',
                                '--icon-xxx-large-size': '72px',
                                '--icon-xx-large-size': '52px',
                                '--icon-x-large-size': '32px',
                                '--icon-large-size': '28px',
                                '--icon-medium-size': '24px',
                                '--icon-small-size': '20px',
                                '--icon-x-small-size': '16px',
                                '--avatar-xxx-large-size': '224px',
                                '--avatar-xx-large-size': '160px',
                                '--avatar-x-large-size': '96px',
                                '--avatar-large-size': '72px',
                                '--avatar-medium-size': '52px',
                                '--avatar-small-size': '40px',
                                '--avatar-x-small-size': '28px',
                                '--avatar-xx-small-size': '20px',
                                '--button-large-height': '52px',
                                '--button-medium-height': '40px',
                                '--button-small-height': '32px',
                                '--category-option-height': '40px',
                                '--input-large-height': '52px',
                                '--input-medium-height': '40px',
                                '--select-option-height': '52px',
                                '--select-option-large-height': '80px',
                                '--checkbox-size': '20px',
                                '--badge-small-height': '20px',
                                '--badge-small-padding-horizontal': '8px',
                                '--badge-medium-height': '24px',
                                '--toast-height': '52px',
                                '--header-bar-height': '64px',
                                '--header-bar-actions-with-title-max-width': '96px',
                                '--footer-padding-top': '24px',
                                '--user-row-margin-horizontal': '8px',
                                '--app-footer-padding-top': '40px',
                                '--progress-bar-height': '16px',
                                '--post-it-width': '224px',
                                '--post-it-height': '264px',
                                '--str-chat__theme-version': '2'
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
                                    <span>Edit</span>
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
                            containerStyle={{
                                '--qb-dialog-container-width': '320px',
                                '--qb-dialog-container-height': '650px',
                                '--qb-dialog-drag-handler-height': '24px',
                                '--qb-toolbar-container-default-width': '48px',
                                '--qb-comp-card-base-overflow': 'visible',
                                '--qb-comp-card-base-background-color': 'transparent',
                                '--qb-comp-card-base-box-shadow': 'none',
                                '--qb-highlight-underline-thickness': '2px',
                                '--qb-highlight-selected-underline-thickness': '2px',
                                '--qb-highlight-underline-offset': '2px',
                                '--qb-highlight-grammar-error-underline-color': '#f2a6a6',
                                '--qb-highlight-grammar-error-background-color': 'transparent',
                                '--qb-highlight-grammar-error-selected-underline-color': '#df2020',
                                '--qb-highlight-grammar-error-selected-background-color': 'rgba(220, 38, 38, 0.1)',
                                '--qb-highlight-grammar-error-emphasized-underline-color': '#df2020',
                                '--qb-highlight-grammar-error-emphasized-background-color': 'rgba(220, 38, 38, 0.1)',
                                '--qb-highlight-spelling-error-underline-color': '#f2a6a6',
                                '--qb-highlight-spelling-error-background-color': 'transparent',
                                '--qb-highlight-spelling-error-selected-underline-color': '#df2020',
                                '--qb-highlight-spelling-error-selected-background-color': 'rgba(220, 38, 38, 0.1)',
                                '--qb-highlight-spelling-error-emphasized-underline-color': '#df2020',
                                '--qb-highlight-spelling-error-emphasized-background-color': 'rgba(220, 38, 38, 0.1)',
                                '--qb-highlight-style-error-underline-color': '#00000033',
                                '--qb-highlight-style-error-background-color': 'transparent',
                                '--qb-highlight-style-error-selected-underline-color': '#b4b4b4',
                                '--qb-highlight-style-error-selected-background-color': 'rgba(67, 67, 67, 0.1)',
                                '--qb-highlight-style-error-emphasized-underline-color': '#b4b4b4',
                                '--qb-highlight-style-error-emphasized-background-color': 'rgba(67, 67, 67, 0.1)',
                                '--qb-highlight-selection-paraphrase-word-underline-color': '#0042d7',
                                '--qb-highlight-selection-paraphrase-word-background-color': 'transparent',
                                '--qb-highlight-selection-paraphrase-phrase-underline-color': '#0042d7',
                                '--qb-highlight-selection-paraphrase-phrase-background-color': 'rgb(0, 103, 197, 0.15)',
                                '--qb-highlight-selection-paraphrase-sentence-underline-color': 'transparent',
                                '--qb-highlight-selection-paraphrase-sentence-background-color': 'rgb(0, 103, 197, 0.15)',
                                '--qb-highlight-selection-toolbox-word-underline-color': '#00000033',
                                '--qb-highlight-selection-toolbox-word-background-color': 'rgba(67, 67, 67, 0.1)',
                                '--qb-highlight-selection-toolbox-phrase-underline-color': '#00000033',
                                '--qb-highlight-selection-toolbox-phrase-background-color': 'rgb(0, 103, 197, 0.15)',
                                '--qb-highlight-selection-toolbox-sentence-underline-color': 'transparent',
                                '--qb-highlight-selection-toolbox-sentence-background-color': 'rgb(0, 103, 197, 0.15)',
                                '--qb-highlight-sentence-from-hover-underline-color': 'transparent',
                                '--qb-highlight-sentence-from-hover-background-color': 'rgba(67, 67, 67, 0.1)',
                                '--qb-highlight-word-from-hover-underline-color': 'transparent',
                                '--qb-highlight-word-from-hover-background-color': 'rgba(67, 67, 67, 0.1)',
                                '--qb-highlight-sentence-from-caret-underline-color': '#00000033',
                                '--qb-highlight-sentence-from-caret-background-color': 'rgba(67, 67, 67, 0.1)',
                                '--qb-highlight-word-from-caret-underline-color': 'transparent',
                                '--qb-highlight-word-from-caret-background-color': 'rgba(67, 67, 67, 0.1)',
                                '--qb-toolbox-onboarding-cta-pulse-color': 'rgba(23, 135, 51, 0.8)',
                                '--lt-color-gray-100': '#f8f9fc',
                                '--lt-color-gray-200': '#f1f3f9',
                                '--lt-color-gray-300': '#dee3ed',
                                '--lt-color-gray-400': '#c2c9d6',
                                '--lt-color-gray-500': '#8f96a3',
                                '--lt-color-gray-600': '#5e636e',
                                '--lt-color-gray-700': '#2f3237',
                                '--lt-color-gray-800': '#1d1e20',
                                '--lt-color-gray-900': '#111213',
                                '--lt-shadowDefault': '0 2px 6px -1px rgba(0, 0, 0, 0.16),0 1px 4px -1px rgba(0, 0, 0, 0.04)',
                                '--lt-shadowActive': '0 0 8px -2px rgba(0, 0, 0, 0.1),0 6px 20px -3px rgba(0, 0, 0, 0.2)',
                                // @ts-ignore
                                '--lt-color-white': '#fff !important',
                                '--lt-color-black': '#111213 !important',
                                '--lt-color-transparent': 'rgba(255, 255, 255, 0) !important',
                                '--lt-color-background-light': 'var(--lt-color-gray-100) !important',
                                '--lt-color-background-default': 'var(--lt-color-gray-200) !important',
                                '--lt-color-background-dark': 'var(--lt-color-gray-300) !important',
                                '--lt-color-border-light': 'var(--lt-color-gray-200) !important',
                                '--lt-color-border-default': 'var(--lt-color-gray-300) !important',
                                '--lt-color-border-dark': 'var(--lt-color-gray-400) !important',
                                '--lt-color-text-very-light': 'var(--lt-color-gray-500) !important',
                                '--lt-color-text-light': 'var(--lt-color-gray-600) !important',
                                '--lt-color-text-default': 'var(--lt-color-gray-700) !important',
                                '--lt-color-text-dark': 'var(--lt-color-gray-800) !important',
                                '--lt-color-overlay-default': '#fff !important',
                                '--lt-color-overlay-dark': '#fff !important',
                                '--lt-color-overlay-transparent': 'rgba(0, 0, 0, 0.1) !important',
                                '--lt-shadow-website-overlay': '0 0 7px 0 rgba(0, 0, 0, 0.3) !important',
                                '--page-margin-bottom': '0px',
                                '--page-margin-top': '0px',
                                '--background-color': '#252464',
                                '--background-color-80': '#252464cc',
                                '--primary-color': '#ab76f6',
                                '--primary-color-90': '#ab76f6e6',
                                '--primary-color-80': '#ab76f6cc',
                                '--primary-color-70': '#ab76f6b3',
                                '--primary-color-50': '#ab76f680',
                                '--primary-color-30': '#ab76f64d',
                                '--primary-color-20': '#ab76f633',
                                '--primary-color-10': '#ab76f61a',
                                '--primary-color-05': '#ab76f60d',
                                '--primary-color-light': '#c9a6f9',
                                '--primary-color-very-light': '#fff',
                                '--danger-color': '#fa304b',
                                '--danger-color-90': '#fa304be6',
                                '--danger-color-70': '#fa304bb3',
                                '--danger-color-50': '#fa304b80',
                                '--danger-color-30': '#fa304b4d',
                                '--danger-color-10': '#fa304b1a',
                                '--danger-color-light': '#fb6276',
                                '--danger-color-very-light': '#fec5cd',
                                '--warning-color': '#ffc562',
                                '--warning-color-90': '#ffc562e6',
                                '--warning-color-70': '#ffc562b3',
                                '--warning-color-50': '#ffc56280',
                                '--warning-color-30': '#ffc5624d',
                                '--warning-color-25': '#ffc56240',
                                '--warning-color-10': '#ffc5621a',
                                '--text-color': '#fff',
                                '--text-color-90': '#ffffffe6',
                                '--text-color-80': '#fffc',
                                '--text-color-70': '#fffc',
                                '--text-color-60': '#ffffffb3',
                                '--text-color-50': '#fff9',
                                '--text-color-40': '#ffffff80',
                                '--text-color-30': '#fff6',
                                '--text-color-20': '#ffffff4d',
                                '--text-color-15': '#ffffff40',
                                '--text-color-10': '#ffffff26',
                                '--text-color-05': '#ffffff1a',
                                '--text-color-02': '#ffffff05',
                                '--inverse-text-color': '#000',
                                '--inverse-text-color-70': '#000c',
                                '--inverse-text-color-50': '#0009',
                                '--inverse-text-color-30': '#0006',
                                '--inverse-text-color-20': '#0000004d',
                                '--shadow-color': '#0000004d',
                                '--shadow-color-light': '#0003',
                                '--card-gradient-background': 'radial-gradient(88.39% 90.7% at 89.05% -20.96%,#34cc26 0%,#fff0 100%),radial-gradient(40.01% 71.83% at 8.32% 97.77%,#a8cc6d 0%,#8e7cff00 100%),#563eb8',
                                '--input-gradient-background': 'linear-gradient(90deg,#351a8e,#6b429c)',
                                '--pill-background-color': '#ffffff1a',
                                '--pill-background-color-2': '#ffffff4d',
                                '--toolbar-background-color': '#fff3',
                                '--menu-background-color': '#ffffff4d',
                                '--table-header-color': '#1a262a',
                                '--table-column-color': '#2a3d43',
                                '--card-hover-color': '#ffffff26',
                                '--danger-text-color': '#fa304b',
                                '--danger-with-background-text-color': '#fff',
                                '--danger-input-border-color': '#fa304b',
                                '--danger-control-background-color': '#fa304b',
                                '--danger-control-hover-background-color': '#fa304bcc',
                                '--danger-control-active-background-color': '#fa304b99',
                                '--shared-font-weight': '400',
                                '--shared-line-height': '1.4',
                                '--shared-hover-opacity': '.8',
                                '--shared-active-opacity': '.6',
                                '--shared-disabled-opacity': '.4',
                                '--shared-border-width': '1px',
                                '--shared-large-border-width': '2px',
                                '--shared-border-radius': '4px',
                                '--shared-large-border-radius': '12px',
                                '--shared-round-border-radius': '800px',
                                '--shared-black': '#000',
                                '--shared-white': '#fff',
                                '--shared-box-shadow-radius': '12px',
                                '--spacing-xx-large': '40px',
                                '--spacing-x-large': '24px',
                                '--spacing-large': '16px',
                                '--spacing-medium': '12px',
                                '--spacing-small': '8px',
                                '--spacing-x-small': '4px',
                                '--spacing-xx-small': '2px',
                                '--spacing-line-to-line': '2px',
                                '--spacing-header-to-body': '12px',
                                '--spacing-header-to-detail': '4px',
                                '--animation-duration-quick': '.15s',
                                '--animation-duration-default': '.3s',
                                '--animation-duration-confirmation': '.6s',
                                '--text-display-font-weight': '700',
                                '--text-display-1-font-size': 'var(--text-xxxxx-large-size)',
                                '--text-display-2-font-size': 'var(--text-xxxx-large-size)',
                                '--text-display-3-font-size': 'var(--text-xxx-large-size)',
                                '--text-display-4-font-size': 'var(--text-x-large-size)',
                                '--text-header-font-weight': '700',
                                '--text-header-1-font-size': 'var(--text-xx-large-size)',
                                '--text-header-2-font-size': 'var(--text-x-large-size)',
                                '--text-header-3-font-size': 'var(--text-large-size)',
                                '--text-subheader-font-weight': '600',
                                '--text-subheader-1-font-size': 'var(--text-large-size)',
                                '--text-subheader-2-font-size': 'var(--text-medium-size)',
                                '--text-subheader-3-font-size': 'var(--text-small-size)',
                                '--text-body-font-weight': '400',
                                '--text-body-1-font-size': 'var(--text-large-size)',
                                '--text-body-2-font-size': 'var(--text-medium-size)',
                                '--text-detail-font-weight': '400',
                                '--text-detail-1-font-size': 'var(--text-medium-size)',
                                '--text-detail-2-font-size': 'var(--text-small-size)',
                                '--button-font-weight': '600',
                                '--button-gap': '4px',
                                '--button-outlined-border-width': '1px',
                                '--button-hover-opacity': '.6',
                                '--button-active-opacity': '.4',
                                '--button-large-font-size': 'var(--text-large-size)',
                                '--button-large-icon-size': 'var(--icon-large-size)',
                                '--button-large-horizontal-padding': '24px',
                                '--button-large-border-radius': '4px',
                                '--button-large-icon-only-border-radius': '800px',
                                '--button-large-minimal-icon-only-icon-size': 'var(--icon-x-large-size)',
                                '--button-medium-font-size': 'var(--text-medium-size)',
                                '--button-medium-icon-size': 'var(--icon-medium-size)',
                                '--button-medium-horizontal-padding': '16px',
                                '--button-medium-border-radius': '800px',
                                '--button-medium-minimal-icon-only-icon-size': 'var(--icon-large-size)',
                                '--button-small-font-size': 'var(--text-small-size)',
                                '--button-small-icon-size': 'var(--icon-small-size)',
                                '--button-small-horizontal-padding': '12px',
                                '--button-small-border-radius': '800px',
                                '--button-small-minimal-icon-only-icon-size': 'var(--icon-medium-size)',
                                '--category-option-font-weight': '600',
                                '--category-option-gap': '8px',
                                '--category-option-border-radius': '800px',
                                '--category-option-font-size': 'var(--text-medium-size)',
                                '--category-option-icon-size': 'var(--icon-medium-size)',
                                '--category-option-horizontal-padding': '16px',
                                '--category-selector-gap': '8px',
                                '--avatar-border-radius': '800px',
                                '--avatar-xxx-large-font-size': 'var(--text-xxx-large-size)',
                                '--avatar-xx-large-font-size': 'var(--text-xx-large-size)',
                                '--avatar-x-large-font-size': 'var(--text-x-large-size)',
                                '--avatar-large-font-size': 'var(--text-large-size)',
                                '--avatar-medium-font-size': 'var(--text-large-size)',
                                '--avatar-small-font-size': 'var(--text-small-size)',
                                '--avatar-x-small-font-size': 'var(--text-small-size)',
                                '--avatar-xx-small-font-size': 'var(--text-x-small-size)',
                                '--avatar-xxx-large-square-border-radius': '16px',
                                '--avatar-xx-large-square-border-radius': '16px',
                                '--avatar-x-large-square-border-radius': '12px',
                                '--avatar-large-square-border-radius': '12px',
                                '--avatar-medium-square-border-radius': '8px',
                                '--avatar-small-square-border-radius': '8px',
                                '--avatar-x-small-square-border-radius': '4px',
                                '--avatar-xx-small-square-border-radius': '2px',
                                '--avatar-group-gap': '4px',
                                '--input-gap': '8px',
                                '--input-horizontal-padding': '12px',
                                '--input-rounded-horizontal-padding': '16px',
                                '--input-rounded-with-suffix-right-padding': '12px',
                                '--input-border-radius': '4px',
                                '--input-large-font-size': 'var(--text-large-size)',
                                '--input-large-icon-size': 'var(--icon-large-size)',
                                '--input-medium-font-size': 'var(--text-medium-size)',
                                '--input-medium-icon-size': 'var(--icon-medium-size)',
                                '--select-options-gap': '2px',
                                '--select-option-gap': '8px',
                                '--select-option-padding-horizontal': '16px',
                                '--select-option-icon-size': 'var(--icon-medium-size)',
                                '--select-minimal-gap': '2px',
                                '--select-minimal-focused-opacity': '.6',
                                '--select-option-large-icon-size': 'var(--icon-x-large-size)',
                                '--form-field-gap': '4px',
                                '--dropdown-font-size': 'var(--text-medium-size)',
                                '--dropdown-height': '32px',
                                '--dropdown-border-radius': '4px',
                                '--dropdown-caret-size': 'var(--icon-medium-size)',
                                '--switch-height': '20px',
                                '--switch-width': '40px',
                                '--switch-border-radius': '800px',
                                '--switch-border-width': '1px',
                                '--switch-gap': '8px',
                                '--switch-handle-size': '12px',
                                '--switch-handle-border-radius': '800px',
                                '--checkbox-icon-size': 'var(--icon-small-size)',
                                '--checkbox-gap': '8px',
                                '--checkbox-border-radius': '4px',
                                '--rsvp-button-border-radius': '800px',
                                '--rsvp-button-border-width': '1px',
                                '--rsvp-button-active-ring-size-scale': '1.2',
                                '--rsvp-button-animation-duration': '.2s',
                                '--rsvp-button-large-size': '128px',
                                '--rsvp-button-medium-size': '104px',
                                '--rsvp-button-medium-narrow-size': '96px',
                                '--rsvp-button-medium-extra-narrow-size': '88px',
                                '--rsvp-button-small-size': '44px',
                                '--rsvp-button-small-gap': '8px',
                                '--rsvp-button-group-large-gap': '32px',
                                '--rsvp-button-group-medium-gap': '24px',
                                '--rsvp-button-group-small-gap': '12px',
                                '--box-border-radius': '8px',
                                '--box-padding': '12px',
                                '--box-button-horizontal-padding': '12px',
                                '--box-button-vertical-padding': '16px',
                                '--box-button-gap': '2px',
                                '--callout-border-radius': '4px',
                                '--callout-padding': '16px',
                                '--callout-gap': '12px',
                                '--link-font-weight': '600',
                                '--info-text-gap': '4px',
                                '--info-text-boxed-padding': '8px',
                                '--footer-hint-margin-bottom': '12px',
                                '--footer-actions-gap': '16px',
                                '--footer-primary-action-min-width': '104px',
                                '--badge-gap': '4px',
                                '--badge-border-radius': '800px',
                                '--badge-font-weight': '600',
                                '--badge-small-font-size': 'var(--text-x-small-size)',
                                '--badge-medium-padding-horizontal': '8px',
                                '--badge-medium-font-size': 'var(--text-small-size)',
                                '--badge-small-dot-height': '4px',
                                '--badge-medium-dot-height': '8px',
                                '--header-bar-gap': '16px',
                                '--header-bar-z-index': '2',
                                '--event-field-icon-size': 'var(--icon-medium-size)',
                                '--event-field-icon-margin-end': '8px',
                                '--editable-event-field-padding-vertical': '4px',
                                '--wysiwyg-offset': '8px',
                                '--wysiwyg-border-radius': '4px',
                                '--wysiwyg-select-min-width': '128px',
                                '--wysiwyg-hover-background-opacity': '.6',
                                '--menu-sections-gap': '16px',
                                '--menu-section-text-gap': '4px',
                                '--menu-section-border-radius': '4px',
                                '--menu-item-padding': '16px',
                                '--menu-item-height': '60px',
                                '--menu-item-label-font-weight': '600',
                                '--menu-item-gap': '8px',
                                '--menu-item-icon-size': 'var(--icon-large-size)',
                                '--menu-item-right-icon-size': 'var(--icon-small-size)',
                                '--menu-item-right-label-max-width': '120px',
                                '--menu-item-right-gap': '4px',
                                '--toast-border-radius': '12px',
                                '--toast-icon-size': 'var(--icon-large-size)',
                                '--toast-padding-horizontal': '16px',
                                '--toast-padding-vertical': '12px',
                                '--toast-z-index': 'calc(var(--modal-z-index) + 100)',
                                '--popover-border-radius': '4px',
                                '--popover-z-index': '3',
                                '--tooltip-max-width': '200px',
                                '--tooltip-padding-vertical': '8px',
                                '--tooltip-padding-horizontal': '12px',
                                '--modal-min-width': '320px',
                                '--modal-border-radius': '12px',
                                '--modal-z-index': '100',
                                '--modal-blur-radius': '100px',
                                '--modal-with-header-content-padding-top': '8px',
                                '--non-ideal-state-glyph-size': 'var(--icon-xxx-large-size)',
                                '--non-ideal-state-glyph-margin-bottom': '8px',
                                '--non-ideal-state-description-margin-top': '4px',
                                '--non-ideal-state-button-margin-top': '24px',
                                '--reaction-option-height': '32px',
                                '--reaction-option-min-width': '56px',
                                '--reaction-option-add-reaction-width': '48px',
                                '--reaction-option-border-radius': '800px',
                                '--reaction-option-horizontal-padding': '8px',
                                '--reaction-option-gap': '4px',
                                '--reaction-option-font-size': 'var(--text-medium-size)',
                                '--reaction-option-glyph-size': 'var(--icon-medium-size)',
                                '--reaction-option-font-weight': '600',
                                '--reaction-option-count-right-margin': 'var(--spacing-xx-small)',
                                '--reaction-selector-gap': '8px',
                                '--user-row-padding-horizontal': 'calc(var(--spacing-screen-margin-horizontal) - var(--user-row-margin-horizontal))',
                                '--user-row-padding-vertical': '12px',
                                '--user-row-column-gap': '12px',
                                '--user-row-row-gap': '2px',
                                '--user-row-metadata-item-gap': '4px',
                                '--user-row-dense-padding-vertical': '8px',
                                '--user-list-gap': 'var(--spacing-xx-small)',
                                '--image-grid-gap': 'var(--spacing-x-small)',
                                '--image-grid-default-image-width': '200px',
                                '--payment-button-padding': '16px',
                                '--payment-button-label-margin-left': '12px',
                                '--payment-button-cta-margin-left': '12px',
                                '--payment-button-side-margin': '16px',
                                '--guest-ticket-content-already-paid-margin-top': '24px',
                                '--guest-ticket-content-cost-margin-top': '8px',
                                '--card-image-width': '85%',
                                '--card-toolbar-max-width': '304px',
                                '--editable-card-image-rotation': '-6deg',
                                '--editable-card-image-width': '80%',
                                '--editable-card-image-envelope-aspect-ratio': '5/6',
                                '--editable-card-image-envelope-top-offset': '-10%',
                                '--editable-card-image-envelope-right-offset': '-5%',
                                '--editable-card-image-envelope-rotate-z': '16deg',
                                '--card-card-padding': '12px',
                                '--card-card-image-margin-bottom': '8px',
                                '--day-picker-day-small-size': '36px',
                                '--day-picker-day-medium-size': '40px',
                                '--day-picker-day-large-size': '44px',
                                '--day-picker-day-x-large-size': '48px',
                                '--post-it-border-radius': '12px',
                                '--post-it-padding-horizontal': '16px',
                                '--post-it-padding-vertical': '12px',
                                '--post-it-header-gap': '12px',
                                '--post-it-content-margin-top': '8px',
                                '--post-it-push-pin-size': '12px',
                                '--post-it-push-pin-size-shine': '8px',
                                '--post-it-push-pin-top-offset': '-4px',
                                '--post-it-list-left-rotate': '-4deg',
                                '--post-it-list-right-rotate': '4deg',
                                '--post-it-list-gap': '16px',
                                '--post-it-list-new-box-gap': '12px',
                                '--post-it-list-new-box-asset-height': '64px',
                                '--post-it-list-new-box-asset-width': '60px',
                                '--post-it-list-new-box-asset-rotate': '-4deg',
                                '--post-it-list-new-box-border-width': '2px',
                                '--shared-primary-color': '#fff',
                                '--shared-inverse-color': '#000',
                                '--shared-danger-color': '#fa304b',
                                '--shared-box-shadow-color': '#00000040',
                                '--shared-hover-background-color': '#ffffff1a',
                                '--scrollbar-background-color': '#fff6',
                                '--scrollbar-hover-background-color': '#fff9',
                                '--text-display-color': '#fff',
                                '--text-display-inverse-color': '#000',
                                '--text-header-color': '#fff',
                                '--text-header-inverse-color': '#000',
                                '--text-subheader-color': '#fff',
                                '--text-subheader-inverse-color': '#000',
                                '--text-body-color': '#fffc',
                                '--text-body-inverse-color': '#000c',
                                '--text-detail-color': '#fff9',
                                '--text-detail-inverse-color': '#0009',
                                '--text-inactive-color': '#fff6',
                                '--text-inactive-inverse-color': '#0006',
                                '--avatar-text-color': '#000c',
                                '--avatar-minimal-text-color': '#fffc',
                                '--avatar-minimal-background-color': '#ffffff40',
                                '--button-filled-label-color': '#000',
                                '--button-filled-background-color': '#fff',
                                '--button-filled-hover-label-color': '#000c',
                                '--button-filled-hover-background-color': '#fffc',
                                '--button-filled-active-label-color': '#0009',
                                '--button-filled-active-background-color': '#fff9',
                                '--button-filled-danger-label-color': '#fff',
                                '--button-filled-danger-background-color': '#fa304b',
                                '--button-filled-danger-hover-label-color': '#fffc',
                                '--button-filled-danger-hover-background-color': '#fa304bcc',
                                '--button-filled-danger-active-label-color': '#fff9',
                                '--button-filled-danger-active-background-color': '#fa304b99',
                                '--button-outlined-label-color': '#fff',
                                '--button-outlined-background-color': '#ffffff0d',
                                '--button-outlined-border-color': '#fff6',
                                '--button-outlined-hover-border-color': '#fff6',
                                '--button-outlined-hover-background-color': '#ffffff1a',
                                '--button-outlined-active-border-color': '#fff6',
                                '--button-outlined-active-background-color': '#ffffff40',
                                '--button-outlined-danger-label-color': '#fa304b',
                                '--button-outlined-danger-border-color': '#fa304b66',
                                '--button-outlined-danger-hover-border-color': '#fa304b66',
                                '--button-outlined-danger-hover-background-color': '#fa304b1a',
                                '--button-outlined-danger-active-border-color': '#fa304b99',
                                '--button-outlined-danger-active-background-color': '#fa304b33',
                                '--button-minimal-label-color': '#fff',
                                '--button-minimal-hover-background-color': '#ffffff1a',
                                '--button-minimal-active-background-color': '#ffffff40',
                                '--button-minimal-danger-label-color': '#fa304b',
                                '--button-minimal-danger-hover-background-color': '#fa304b1a',
                                '--button-minimal-danger-active-background-color': '#fa304b33',
                                '--category-option-label-color': '#fff',
                                '--category-option-suffix-color': '#fff9',
                                '--category-option-background-color': '#ffffff0d',
                                '--category-option-hover-border-color': '#ffffff40',
                                '--category-option-selected-background-color': '#ffffff26',
                                '--category-option-selected-border-color': '#fff9',
                                '--rsvp-button-background-color': 'transparent',
                                '--rsvp-button-border-color': '#ffffff40',
                                '--rsvp-button-glyph-color': '#fff',
                                '--rsvp-interested-button-group-background-color': '#000',
                                '--rsvp-interested-button-group-border-color': '#0000001a',
                                '--rsvp-interested-button-group-divider-background-color': '#fff9',
                                '--rsvp-interested-button-group-font-color': '#fff',
                                '--tag-label-color': '#fffc',
                                '--tag-detail-color': '#fff9',
                                '--tag-background-color': '#ffffff0d',
                                '--tag-hover-background-color': '#ffffff1a',
                                '--tag-active-background-color': '#ffffff40',
                                '--tag-selected-label-color': '#000',
                                '--tag-selected-detail-color': '#000c',
                                '--tag-selected-background-color': '#fff',
                                '--tag-selected-hover-background-color': '#fffc',
                                '--tag-selected-active-background-color': '#fff9',
                                '--tag-special-selected-label-color': '#000',
                                '--tag-special-selected-detail-color': '#000c',
                                '--input-placeholder-color': '#fff6',
                                '--input-value-color': '#fff',
                                '--input-icon-color': '#fff6',
                                '--input-hint-color': '#fff9',
                                '--input-border-color': '#ffffff1a',
                                '--input-background-color': '#ffffff0d',
                                '--input-hover-border-color': '#ffffff26',
                                '--input-hover-background-color': '#ffffff1a',
                                '--input-active-border-color': '#ffffff0d',
                                '--input-active-background-color': '#ffffff40',
                                '--input-focused-icon-color': '#fff',
                                '--input-focused-border-color': '#fff6',
                                '--input-focused-background-color': '#ffffff0d',
                                '--input-danger-border-color': '#fa304b',
                                '--select-option-icon-color': '#fffc',
                                '--select-option-label-color': '#fffc',
                                '--select-option-description-color': '#fff9',
                                '--select-option-hover-background-color': '#ffffff1a',
                                '--select-option-hover-border-color': '#ffffff08',
                                '--select-option-active-background-color': '#ffffff40',
                                '--select-option-active-border-color': '#ffffff08',
                                '--select-option-selected-background-color': '#ffffff0d',
                                '--select-option-selected-border-color': '#ffffff08',
                                '--select-option-selected-icon-color': '#fff',
                                '--select-option-selected-label-color': '#fff',
                                '--select-option-selected-description-color': '#fffc',
                                '--switch-checked-handle-color': '#000',
                                '--switch-unchecked-handle-color': '#fffc',
                                '--switch-checked-track-color': '#fff',
                                '--switch-track-border-color': '#ffffff40',
                                '--checkbox-icon-color': '#000',
                                '--checkbox-unchecked-border-color': '#fff9',
                                '--checkbox-unchecked-hover-border-color': '#fffc',
                                '--checkbox-unchecked-active-border-color': '#fff9',
                                '--checkbox-checked-background-color': '#fff',
                                '--checkbox-checked-hover-background-color': '#fffc',
                                '--checkbox-checked-active-background-color': '#fff9',
                                '--box-background-color': '#ffffff0d',
                                '--box-border-color': '#ffffff1a',
                                '--callout-background-color': '#ffffff0d',
                                '--callout-border-color': '#ffffff1a',
                                '--callout-special-background-color': '#000',
                                '--callout-special-border-color': '#ffffff26',
                                '--info-text-boxed-background-color': '#ffffff0d',
                                '--info-text-boxed-danger-background-color': '#fa304b1a',
                                '--footer-border-color': '#ffffff1a',
                                '--divider-border-color': '#ffffff1a',
                                '--badge-filled-label-color': '#000',
                                '--badge-filled-background-color': '#fff',
                                '--badge-filled-danger-label-color': '#fff',
                                '--badge-filled-danger-background-color': '#fa304b',
                                '--badge-filled-warning-label-color': '#fff',
                                '--badge-filled-warning-background-color': '#fb0',
                                '--badge-minimal-label-color': '#fff',
                                '--badge-minimal-background-color': '#ffffff1a',
                                '--badge-minimal-danger-label-color': '#fa304b',
                                '--event-field-icon-color': '#fffc',
                                '--wysiwyg-border-color': '#ffffff26',
                                '--wysiwyg-background-color': '#ffffff26',
                                '--wysiwyg-focused-border-color': '#fff9',
                                '--wysiwyg-focused-background-color': '#000c',
                                '--menu-item-label-color': '#fffc',
                                '--menu-item-active-label-color': '#fff',
                                '--menu-item-danger-label-color': '#fa304bcc',
                                '--menu-item-danger-active-label-color': '#fa304b',
                                '--menu-item-detail-color': '#fff9',
                                '--menu-item-active-detail-color': '#fffc',
                                '--menu-item-danger-detail-color': '#fa304b99',
                                '--menu-item-danger-active-detail-color': '#fa304bcc',
                                '--menu-item-background-color': '#ffffff0d',
                                '--menu-item-hover-background-color': '#ffffff1a',
                                '--menu-item-active-background-color': '#ffffff26',
                                '--theme-or-effect-option-background-color': '#ffffff26',
                                '--toast-background-color': '#000',
                                '--toast-border-color': '#ffffff1a',
                                '--popover-background-color': '#000',
                                '--popover-border-color': '#ffffff26',
                                '--popover-arrow-border-color': '#ffffff36',
                                '--modal-overlay-fade-color': '#ffffff0d',
                                '--reaction-option-background-color': '#ffffff26',
                                '--reaction-option-count-color': '#fff9',
                                '--reaction-option-hover-border-color': '#ffffff40',
                                '--reaction-option-selected-count-color': '#fff',
                                '--user-row-hover-background-color': '#ffffff1a',
                                '--user-row-hover-border-color': '#ffffff1a',
                                '--user-row-active-background-color': '#ffffff26',
                                '--user-row-active-border-color': '#ffffff26',
                                '--user-row-selected-background-color': '#ffffff1a',
                                '--user-row-selected-border-color': '#ffffff1a',
                                '--day-picker-week-day-header-color': '#fff6',
                                '--day-picker-day-color': '#fffc',
                                '--day-picker-day-hover-background-color': '#ffffff0d',
                                '--day-picker-day-hover-border-color': '#ffffff1a',
                                '--day-picker-day-outside-color': '#fff6',
                                '--day-picker-day-disabled-color': '#ffffff40',
                                '--day-picker-day-selected-background-color': '#fff',
                                '--day-picker-day-selected-color': '#000',
                                '--spacing-screen-margin-horizontal': '24px',
                                '--spacing-screen-margin-vertical': '24px',
                                '--text-xxxxx-large-size': '72px',
                                '--text-xxxx-large-size': '52px',
                                '--text-xxx-large-size': '32px',
                                '--text-xx-large-size': '28px',
                                '--text-x-large-size': '22px',
                                '--text-large-size': '18px',
                                '--text-medium-size': '16px',
                                '--text-small-size': '14px',
                                '--text-x-small-size': '12px',
                                '--icon-xxx-large-size': '72px',
                                '--icon-xx-large-size': '52px',
                                '--icon-x-large-size': '32px',
                                '--icon-large-size': '28px',
                                '--icon-medium-size': '24px',
                                '--icon-small-size': '20px',
                                '--icon-x-small-size': '16px',
                                '--avatar-xxx-large-size': '224px',
                                '--avatar-xx-large-size': '160px',
                                '--avatar-x-large-size': '96px',
                                '--avatar-large-size': '72px',
                                '--avatar-medium-size': '52px',
                                '--avatar-small-size': '40px',
                                '--avatar-x-small-size': '28px',
                                '--avatar-xx-small-size': '20px',
                                '--button-large-height': '52px',
                                '--button-medium-height': '40px',
                                '--button-small-height': '32px',
                                '--category-option-height': '40px',
                                '--input-large-height': '52px',
                                '--input-medium-height': '40px',
                                '--select-option-height': '52px',
                                '--select-option-large-height': '80px',
                                '--checkbox-size': '20px',
                                '--badge-small-height': '20px',
                                '--badge-small-padding-horizontal': '8px',
                                '--badge-medium-height': '24px',
                                '--toast-height': '52px',
                                '--header-bar-height': '64px',
                                '--header-bar-actions-with-title-max-width': '96px',
                                '--footer-padding-top': '24px',
                                '--user-row-margin-horizontal': '8px',
                                '--app-footer-padding-top': '40px',
                                '--progress-bar-height': '16px',
                                '--post-it-width': '224px',
                                '--post-it-height': '264px',
                                '--str-chat__theme-version': '2',
                                '--theme-colors-gradient-1': '#FF7A27',
                                '--theme-colors-gradient-3': '#FF6529',
                                '--theme-colors-gradient-4': '#FFAD33',
                                '--theme-colors-gradient-5': '#FE742F',
                                '--theme-colors-link': '#FFF3BF',
                                '--theme-colors-link-gradient-center': '#FFC184',
                                '--theme-colors-background-color': '#1C0606',
                                // @ts-ignore
                                textRendering: 'optimizeSpeed',
                                'lineHeight': '1.4',
                                'color': 'var(--text-color)',
                                'boxSizing': 'border-box',
                                'userSelect': 'none',
                                'minWidth': '100%',
                                'paddingBottom': 'var(--spacing-x-small)',
                                'cursor': 'pointer',
                                'flexDirection': 'column',
                                'alignItems': 'stretch',
                                'display': 'flex',
                                'position': 'relative'
                            } as React.CSSProperties}
                        />
                    </div>
                </div>
            </main>

            {/* ── Mobile Bottom Action Bar (visible only on < lg screens) ── */}
            {!isPreviewMode && (
                <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[80] bg-black/80 backdrop-blur-xl border-t border-white/10 px-4 py-3 flex items-center gap-3">
                    {/* Sidebar shortcut buttons */}
                    <button
                        onClick={() => handleSidebarClick("Theme")}
                        className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <Palette className="w-5 h-5 text-white/70" />
                        <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Theme</span>
                    </button>
                    <button
                        onClick={() => handleSidebarClick("Effect")}
                        className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <Sparkles className="w-5 h-5 text-white/70" />
                        <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Effect</span>
                    </button>
                    <button
                        onClick={() => handleSidebarClick("Settings")}
                        className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <Settings className="w-5 h-5 text-white/70" />
                        <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Settings</span>
                    </button>

                    {/* Publish / Sign in — full-width primary CTA */}
                    <button
                        onClick={() => handleSidebarClick(session ? "Publish" : "Sign in")}
                        disabled={isLoading}
                        className="flex-1 flex items-center justify-center gap-2 bg-white text-black font-black py-3 rounded-xl text-sm hover:bg-white/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Publishing…</span>
                            </>
                        ) : session ? (
                            <>
                                <CheckCircle className="w-4 h-4" />
                                <span>Publish</span>
                            </>
                        ) : (
                            <>
                                <LogIn className="w-4 h-4" />
                                <span>Sign in to Publish</span>
                            </>
                        )}
                    </button>
                </div>
            )}

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
                currentTheme={selectedTheme}
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
                currentTheme={selectedTheme}
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
            <EventSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                event={pendingData}
                settings={settings}
                onUpdate={(updatedData) => {
                    setPendingData(updatedData);
                    if (updatedData.theme?.settings) {
                        setSettings(updatedData.theme.settings);
                    }
                }}
                onStyleChange={setRSVPStyle}
                onToggleRSVP={setShowRSVP}
                guests={[]}
                primaryColor={pendingData?.theme?.primaryColor || primaryColor}
                selectedTheme={selectedTheme}
                isHost={true}
            />
        </div>
    );
}

export default function CreateEventPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#252464] flex items-center justify-center text-white"><Loader2 className="w-8 h-8 animate-spin text-white/50" /></div>}>
            <CreateEventContent />
        </Suspense>
    );
}
