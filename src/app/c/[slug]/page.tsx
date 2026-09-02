"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { applyTheme } from "@/lib/theme"; // Reuse theme logic
import EnvelopeView from "@/components/cards/EnvelopeView";
import ShareEventModal from "@/components/event-page/ShareEventModal";
import { Share2, ArrowLeft } from "lucide-react";
import FloatingParticles from "@/components/FloatingParticles";
import { ANIMATED_THEME_PRESETS } from "@/components/ThemeSelector";
import { IMAGE_VFX_PRESETS, VIDEO_VFX_PRESETS } from "@/components/EffectSelector";
import Confetti from "@/components/vfx/Confetti";
import Rain from "@/components/vfx/Rain";
import SafeLottiePlayer from "@/components/SafeLottiePlayer";
import { BackgroundVideo } from "@/components/BackgroundVideo";

const InteractiveBackground = dynamic(
    () => import("@/components/InteractiveBackground"),
    { ssr: false }
);

const VfxCanvas = dynamic(
    () => import("@/components/vfx/VfxCanvas"),
    { ssr: false }
);

const CustomFloatingVfx = dynamic(
    () => import("@/components/vfx/CustomFloatingVfx"),
    { ssr: false }
);

const INTERACTIVE_THEMES = ['streak', 'meadow', 'crystal', 'waves'];

export default function CardPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { data: session } = useSession();

    const [card, setCard] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [isEnvelopeOpen, setIsEnvelopeOpen] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);

    useEffect(() => {
        if (searchParams.get("created") === "true" || searchParams.get("share") === "true") {
            setIsShareOpen(true);
        }
    }, [searchParams]);

    useEffect(() => {
        const fetchCard = async () => {
            try {
                const response = await fetch(`/api/events/by-slug?slug=${params.slug}`);
                const data = await response.json();

                if (!response.ok) throw new Error(data.error || "Failed to fetch card");

                let theme = data.event.theme;
                if (theme && typeof theme === 'string') {
                    try { theme = JSON.parse(theme); } catch (e) { console.error("Theme parse error", e); }
                }

                data.event.theme = theme;

                // If it's not a CARD type, maybe redirect to /e/? 
                // Flexible for now, but strictly we should check data.event.type === 'CARD'

                setCard(data.event);
                if (theme) applyTheme(theme);

            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        if (params.slug) {
            fetchCard();
        }
    }, [params.slug]);

    if (isLoading) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-bold tracking-widest animate-pulse">LOADING CARD...</div>;
    if (error || !card) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Card not found</div>;

    // Theme & Effect Logic (Reused)
    const backgroundTheme = card.theme?.backgroundTheme || "";
    const has3DTheme = backgroundTheme && INTERACTIVE_THEMES.includes(backgroundTheme);
    const font = card.theme?.font || "var(--font-inter)";
    const effect = card.theme?.effect || "none";

    // Background Style
    const primaryColor = card.theme?.primaryColor || "#3b82f6";
    let bgStyle: any = has3DTheme ? {} : {
        background: `radial-gradient(circle at 50% 50%, ${primaryColor} 0%, #000000 100%)`
    };
    if (backgroundTheme.startsWith("custom-gradient:")) {
        const color = backgroundTheme.split(":")[1];
        bgStyle = { background: `linear-gradient(90deg, ${color} 0%, #ffffff 50%, ${color} 100%)` };
    }

    return (
        <div className="min-h-screen pt-24 text-white font-sans antialiased overflow-hidden relative flex flex-col items-center justify-center transition-colors duration-1000" style={bgStyle}>
            {/* Top Navigation & Share Bar */}
            <div className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-4 backdrop-blur-md bg-black/20 border-b border-white/5">
                <button
                    onClick={() => router.push("/cards/create")}
                    className="flex items-center gap-2 text-white/60 hover:text-white text-xs font-bold transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Create Card</span>
                </button>
                <button
                    onClick={() => setIsShareOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-black text-xs rounded-full shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share Card</span>
                </button>
            </div>

            {/* Dark Ribbed Texture Overlay */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.4] z-0 mix-blend-multiply"
                style={{
                    backgroundImage: `repeating-linear-gradient(90deg, rgba(0,0,0,0.8) 0px, rgba(0,0,0,0.8) 2px, transparent 2px, transparent 6px)`,
                    backgroundSize: '6px 100%'
                }}
            />

            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-950/5 blur-[150px] rounded-full"></div>
                
                {/* Preset Video Theme Background */}
                {backgroundTheme?.startsWith('preset-video:') && (() => {
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

            {/* 3D Backgrounds & Core Effects */}
            {(INTERACTIVE_THEMES.includes(backgroundTheme) || effect === 'skiing' || has3DTheme) && (
                <InteractiveBackground currentTheme={backgroundTheme} currentEffect={effect} />
            )}

            {/* Effects Layer */}
            <div className="fixed inset-0 pointer-events-none z-[5]">
                {effect === 'particles' && <FloatingParticles />}

                {effect === 'confetti' && <Confetti />}
                {effect === 'rain' && <Rain />}
                {effect?.startsWith('custom-uploaded:') && (
                    <CustomFloatingVfx imageUrl={effect.split(':')[1]} />
                )}

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

                {/* Texture Overlay */}
                <div className={`fixed inset-0 pointer-events-none z-[70] mix-blend-overlay ${effect === 'grain' ? 'opacity-[0.15]' : 'opacity-[0.05]'}`}
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
                </div>
            </div>

            {/* Main Card Content */}
            <main className="relative z-10 w-full max-w-4xl p-6 flex flex-col items-center justify-center min-h-[80vh]">

                <EnvelopeView
                    title={card.title}
                    description={card.description}
                    coverImage={card.coverImage}
                    senderName={card.host?.name || card.hostName}
                    isOpen={isEnvelopeOpen}
                    onOpen={() => setIsEnvelopeOpen(true)}
                    font={font} // Pass selected font
                    autoOpen={true} // Auto-open on load
                />

                {/* Footer / Branding */}
                <div className={`mt-12 transition-opacity duration-1000 ${isEnvelopeOpen ? 'opacity-100' : 'opacity-0 delay-500'}`}>
                    <div className="flex flex-col items-center gap-4">
                        <button
                            onClick={() => setIsShareOpen(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-black text-xs tracking-wider uppercase rounded-full shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
                        >
                            <Share2 className="w-4 h-4" />
                            <span>Share this card</span>
                        </button>
                        <div className="text-[10px] text-white/30 font-black tracking-widest uppercase">
                            Sent via JollyWitMe
                        </div>
                    </div>
                </div>

            </main>

            {/* Mobile Sticky Floating Share Bar */}
            <div className="fixed bottom-4 left-4 right-4 z-40 sm:hidden">
                <button
                    onClick={() => setIsShareOpen(true)}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(16,185,129,0.35)] active:scale-95 transition-all"
                >
                    <Share2 className="w-4 h-4" />
                    <span>Share Card (WhatsApp, Link, SMS)</span>
                </button>
            </div>

            {/* Rich Share Sheet */}
            {card && (
                <ShareEventModal
                    isOpen={isShareOpen}
                    onClose={() => setIsShareOpen(false)}
                    event={{
                        ...card,
                        isCard: true,
                    }}
                />
            )}
        </div>
    );
}
