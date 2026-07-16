"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import CreateEventSidebar from "@/components/CreateEventSidebar";
import ThemeSelector from "@/components/ThemeSelector";
import EffectSelector, { IMAGE_VFX_PRESETS, VIDEO_VFX_PRESETS } from "@/components/EffectSelector";
import { ANIMATED_THEME_PRESETS } from "@/components/ThemeSelector";
import FontSelector from "@/components/FontSelector"; // New
import CoverImageGallery from "@/components/CoverImageGallery"; // New
import FloatingParticles from "@/components/FloatingParticles";
import InteractiveBackground from "@/components/InteractiveBackground";
import VfxCanvas from "@/components/vfx/VfxCanvas";
import CustomFloatingVfx from "@/components/vfx/CustomFloatingVfx";
import Confetti from "@/components/vfx/Confetti";
import Rain from "@/components/vfx/Rain";
import EnvelopeView from "@/components/cards/EnvelopeView";
import {
    Image as ImageIcon,
    Palette,
    Sparkles,
    Type,
    HelpCircle,
    Plus
} from "lucide-react";
import Image from "next/image";

// Interactive themes list (reused from events page)
const INTERACTIVE_THEMES = ['streak', 'meadow', 'crystal', 'waves'];

export default function CreateCardPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const [isLoading, setIsLoading] = useState(false);

    // UI State
    const [isThemeOpen, setIsThemeOpen] = useState(false);
    const [isEffectOpen, setIsEffectOpen] = useState(false);
    const [isFontOpen, setIsFontOpen] = useState(false); // New
    const [isGalleryOpen, setIsGalleryOpen] = useState(false); // New

    // Card Data
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [coverImage, setCoverImage] = useState("/partiful/Aquarius.avif");
    const [selectedTheme, setSelectedTheme] = useState("dark");
    const [effect, setEffect] = useState<string>("particles");
    const [selectedFont, setSelectedFont] = useState("var(--font-inter)"); // New
    const [primaryColor, setPrimaryColor] = useState("#3b82f6"); // New

    // Load persisted data
    useEffect(() => {
        const savedData = localStorage.getItem("pending_card_data");
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                if (parsed.title) setTitle(parsed.title);
                if (parsed.description) setDescription(parsed.description);
                if (parsed.coverImage) setCoverImage(parsed.coverImage);
                if (parsed.selectedTheme) setSelectedTheme(parsed.selectedTheme);
                if (parsed.effect) setEffect(parsed.effect);
                if (parsed.selectedFont) setSelectedFont(parsed.selectedFont);
                if (parsed.primaryColor) setPrimaryColor(parsed.primaryColor);
            } catch (err) {
                console.error("Failed to parse pending card data", err);
            }
        }
    }, []);

    // Persist data
    useEffect(() => {
        const data = { title, description, coverImage, selectedTheme, effect, selectedFont, primaryColor };
        localStorage.setItem("pending_card_data", JSON.stringify(data));
    }, [title, description, coverImage, selectedTheme, effect, selectedFont, primaryColor]);

    const handleSubmit = async () => {
        if (!session) {
            router.push("/api/auth/signin?callbackUrl=/cards/create");
            return;
        }

        if (!title.trim()) {
            alert("Please enter a title for your card.");
            return;
        }

        setIsLoading(true);

        const submitData = {
            title,
            description,
            coverImage,
            startDate: new Date().toISOString(),
            type: "CARD",
            status: "PUBLISHED",
            theme: {
                backgroundTheme: selectedTheme,
                effect,
                primaryColor: primaryColor,
                secondaryColor: "#000000",
                font: selectedFont // Save font preference
            }
        };

        try {
            const response = await fetch("/api/events/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(submitData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to create card");
            }

            localStorage.removeItem("pending_card_data");
            router.push(`/c/${result.event.slug}`);
        } catch (error: any) {
            console.error("Failed to create card:", error);
            alert(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Background style calculation
    const has3DTheme = selectedTheme && INTERACTIVE_THEMES.includes(selectedTheme);
    let bgStyle = has3DTheme ? {} : {
        background: `radial-gradient(circle at 50% 50%, ${primaryColor} 0%, #000000 100%)`
    };
    if (selectedTheme?.startsWith('custom-gradient:')) {
        const color = selectedTheme.split(':')[1];
        bgStyle = { background: `linear-gradient(90deg, ${color} 0%, #ffffff 50%, ${color} 100%)` };
    }

    return (
        <div className="min-h-screen text-white font-sans antialiased overflow-hidden relative transition-colors duration-700" style={bgStyle}>
            {/* Texture Overlay */}
            <div className={`fixed inset-0 pointer-events-none z-[70] mix-blend-overlay ${effect === 'grain' ? 'opacity-[0.15]' : 'opacity-[0.05]'}`}
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
            </div>

            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-950/5 blur-[150px] rounded-full"></div>
                
                {/* Preset Video Theme Background */}
                {selectedTheme?.startsWith('preset-video:') && (() => {
                    const presetId = selectedTheme.split(':')[1];
                    const preset = ANIMATED_THEME_PRESETS.find(p => p.id === presetId);
                    if (preset && preset.type === 'video') {
                        return (
                            <video 
                                src={preset.url} 
                                autoPlay 
                                loop 
                                muted 
                                playsInline 
                                className="absolute inset-0 w-full h-full object-cover opacity-80"
                            />
                        );
                    }
                    return null;
                })()}
            </div>

            {/* Visual Effects Layer (Overlaps background, behind UI) */}
            <div className="fixed inset-0 pointer-events-none z-[8]">
                {effect === 'particles' && <FloatingParticles />}
                {(INTERACTIVE_THEMES.includes(selectedTheme || '') || effect === 'skiing') && (
                    <InteractiveBackground currentTheme={selectedTheme} currentEffect={effect} />
                )}
                {effect === 'floral' && <VfxCanvas type="floral" count={1} speed={1} />}
                {effect === 'confetti' && <Confetti />}
                {effect === 'rain' && <Rain />}
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

                {/* Preset WebM Video FX */}
                {effect?.startsWith('preset-webm:') && (() => {
                    const presetId = effect.split(':')[1];
                    const preset = VIDEO_VFX_PRESETS.find(p => p.id === presetId);
                    if (preset) {
                        return (
                            <video 
                                src={preset.videoUrl} 
                                autoPlay 
                                loop 
                                muted 
                                playsInline 
                                className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-90"
                            />
                        );
                    }
                    return null;
                })()}
            </div>

            {/* Main Layout - Single Column Centered */}
            <main className="relative z-10 min-h-screen flex flex-col items-center justify-center pt-8 pb-12">

                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 flex flex-col items-center w-full max-w-lg">

                    {/* From User Label */}
                    <div className="flex items-center gap-2 mb-6 bg-black/30 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/10 shadow-xl">
                        <span className="text-white/60 text-[10px] font-bold uppercase tracking-wider">From</span>
                        {session?.user?.image && (
                            <Image src={session.user.image} alt="User" width={16} height={16} className="rounded-full ring-1 ring-white/20" />
                        )}
                        <span className="text-white font-bold text-xs">{session?.user?.name || "You"}</span>
                    </div>

                    {/* Envelope / Card Area - Signficantly Reduced Scale for Realism */}
                    <div className="relative mb-8 group perspective-1000">
                        {/* Card Wrapper */}
                        <div className="transform scale-75 md:scale-90 transition-transform duration-500 hover:scale-[0.77] md:hover:scale-[0.92] ease-out-expo">
                            <EnvelopeView
                                title={title || "Card Title"}
                                description={description || "Card message..."}
                                coverImage={coverImage}
                                isPreview={true}
                                isOpen={true}
                                senderName={session?.user?.name || "You"}
                                font={selectedFont}
                                onChangeImage={() => setIsGalleryOpen(true)}
                                showTextContent={false} // Hide redundant text in creation mode
                            />
                        </div>
                    </div>

                    {/* Input Fields - Glassmorphic Realism */}
                    <div className="w-full max-w-[340px] space-y-3 text-center mt-6">
                        <div className="relative group">
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Add a title"
                                style={{ fontFamily: selectedFont }}
                                className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 text-2xl font-black text-white placeholder:text-white/20 text-center outline-none transition-all focus:bg-white/10 focus:border-white/20 shadow-lg"
                            />
                        </div>

                        <div className="relative group">
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Add a note"
                                rows={1}
                                style={{ fontFamily: selectedFont }}
                                className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 text-base font-medium text-white placeholder:text-white/20 text-center outline-none resize-none transition-all focus:bg-white/10 focus:border-white/20 shadow-lg min-h-[50px]"
                                onInput={(e) => {
                                    const target = e.target as HTMLTextAreaElement;
                                    target.style.height = 'auto';
                                    target.style.height = target.scrollHeight + 'px';
                                }}
                            />
                        </div>
                    </div>

                </div>

            </main>

            {/* Unified Sidebar using Shared Component */}
            <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50 hidden md:block">
                <CreateEventSidebar
                    mode="card"
                    isAuthenticated={!!session}
                    isLoading={isLoading}
                    activeItem={isThemeOpen ? "Theme" : isFontOpen ? "Font" : isEffectOpen ? "Effect" : undefined}
                    selectedTheme={selectedTheme}
                    selectedEffect={effect}
                    onItemClick={(label: string) => {
                        if (label === "Theme") { setIsThemeOpen(true); setIsEffectOpen(false); setIsFontOpen(false); }
                        if (label === "Font") { setIsFontOpen(true); setIsThemeOpen(false); setIsEffectOpen(false); }
                        if (label === "Effect") { setIsEffectOpen(true); setIsThemeOpen(false); setIsFontOpen(false); }
                        if (label === "Next") { handleSubmit(); }
                    }}
                />
            </div>

            {/* Mobile Bottom Action Bar (Unchanged) */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/80 backdrop-blur-xl border-t border-white/10 flex justify-between items-center md:hidden z-50">
                <button type="button" onClick={() => setIsThemeOpen(true)} aria-label="Open theme selector" className="flex flex-col items-center gap-1 text-xs font-bold text-white/60">
                    <Palette className="w-5 h-5" />
                </button>
                <button type="button" onClick={() => setIsFontOpen(true)} aria-label="Open font selector" className="flex flex-col items-center gap-1 text-xs font-bold text-white/60">
                    <Type className="w-5 h-5" />
                </button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="px-8 py-2 bg-white text-black font-bold rounded-full shadow-lg text-sm"
                >
                    {isLoading ? "..." : "Next"}
                </button>
                <button type="button" onClick={() => setIsEffectOpen(true)} aria-label="Open effect selector" className="flex flex-col items-center gap-1 text-xs font-bold text-white/60">
                    <Sparkles className="w-5 h-5" />
                </button>
            </div>

            {/* Slide-out Panels */}
            <ThemeSelector
                isOpen={isThemeOpen}
                onClose={() => setIsThemeOpen(false)}
                currentTheme={selectedTheme}
                onSelect={(themeId, color) => {
                    setSelectedTheme(themeId);
                    if (color) setPrimaryColor(color);
                }}
            />
            <EffectSelector
                isOpen={isEffectOpen}
                onClose={() => setIsEffectOpen(false)}
                currentEffect={effect}
                onSelect={setEffect}
            />
            <FontSelector
                isOpen={isFontOpen}
                onClose={() => setIsFontOpen(false)}
                currentFont={selectedFont}
                onSelect={setSelectedFont}
            />
            <CoverImageGallery
                isOpen={isGalleryOpen}
                onClose={() => setIsGalleryOpen(false)}
                onSelect={setCoverImage}
                currentImage={coverImage}
            />
        </div>
    );
}
