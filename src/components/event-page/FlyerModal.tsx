"use client";

import { useEffect, useRef, useState } from "react";
import { X, Download } from "lucide-react";
import { toPng } from "html-to-image";
import download from "downloadjs";
import FloatingParticles from "@/components/FloatingParticles"; // Reusing particles for background effect
import { VIBE_THEMES } from "@/lib/theme";

interface FlyerModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: {
        title: string;
        coverImage: string;
        host?: {
            name?: string;
            image?: string;
        };
        theme?: any;
    };
}

export default function FlyerModal({ isOpen, onClose, event }: FlyerModalProps) {
    const flyerRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    const handleDownload = async () => {
        if (!flyerRef.current) return;
        setIsGenerating(true);

        try {
            // Wait for images to load (simplified by waiting a bit or ensuring loaded)
            // Using a small delay to ensure rendering is stabilized
            await new Promise(resolve => setTimeout(resolve, 500));

            const dataUrl = await toPng(flyerRef.current, { cacheBust: true, pixelRatio: 2 });
            download(dataUrl, `${event.title.replace(/\s+/g, '-').toLowerCase()} -flyer.png`);
        } catch (err) {
            console.error("Failed to generate flyer:", err);
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isOpen) return null;

    // Derived theme values
    const vibeId = event.theme?.vibeId || "classic";
    const activeTheme = VIBE_THEMES.find(t => t.id === vibeId) || VIBE_THEMES[0];
    const primaryColor = event.theme?.primaryColor || activeTheme.primaryColor;
    const secondaryColor = event.theme?.secondaryColor || activeTheme.secondaryColor;
    const effect = event.theme?.effect || "none";
    const fontClass = activeTheme.fontClass;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative w-full max-w-lg bg-[#121212] rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <h2 className="text-xl font-bold text-white">Share Flyer</h2>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content - Scrollable if screen is small */}
                <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center gap-8">

                    {/* Flyer Preview Container */}
                    <div className="relative shadow-2xl group">
                        {/* The Actual Flyer Node to Capture */}
                        <div
                            ref={flyerRef}
                            className={`w-[320px] h-[400px] sm:w-[360px] sm:h-[450px] relative bg-black overflow-hidden flex flex-col items-center justify-center shrink-0 ${fontClass}`}
                        >
                            {/* Background Elements */}
                            <div
                                className="absolute inset-0 z-0 opacity-40"
                                style={{
                                    background: `radial-gradient(circle at center, ${primaryColor}, #000000)`
                                }}
                            ></div>

                            {/* Effects */}
                            <div className="absolute inset-0 z-0">
                                {effect === 'particles' && <FloatingParticles />}
                                {effect === 'grid' && (
                                    <div className="absolute inset-0 opacity-[0.1]"
                                        style={{ backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
                                    ></div>
                                )}
                                {effect === 'aurora' && (
                                    <div className="absolute inset-0 opacity-30">
                                        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] blur-[100px] rounded-full" style={{ background: primaryColor }}></div>
                                        <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] blur-[100px] rounded-full" style={{ background: secondaryColor }}></div>
                                    </div>
                                )}
                            </div>

                            {/* Side Strips */}
                            <div className="absolute left-0 top-0 bottom-0 w-8 bg-black/40 backdrop-blur-sm border-r border-white/10 flex flex-col items-center justify-center z-20">
                                <span className="text-[10px] font-black text-white/40 tracking-[0.2em] transform -rotate-180 whitespace-nowrap" style={{ writingMode: 'vertical-rl' }}>
                                    RSVP ON JollyWitMe • RSVP ON JollyWitMe • RSVP
                                </span>
                            </div>
                            <div className="absolute right-0 top-0 bottom-0 w-8 bg-black/40 backdrop-blur-sm border-l border-white/10 flex flex-col items-center justify-center z-20">
                                <span className="text-[10px] font-black text-white/40 tracking-[0.2em] transform -rotate-180 whitespace-nowrap" style={{ writingMode: 'vertical-rl' }}>
                                    RSVP ON JollyWitMe • RSVP ON JollyWitMe • RSVP
                                </span>
                            </div>

                            {/* Main Content Area */}
                            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-12">

                                {/* Cover Image Container */}
                                <div className="relative w-48 h-48 mb-6 transform rotate-[-2deg] border-4 border-white shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-[#1a1a1a]">
                                    {event.coverImage ? (
                                        <img
                                            src={event.coverImage}
                                            alt="Cover"
                                            className="w-full h-full object-cover grayscale contrast-125"
                                            crossOrigin="anonymous"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white/20 font-bold text-4xl" style={{ backgroundColor: secondaryColor }}>
                                            {event.title[0]}
                                        </div>
                                    )}

                                    {/* Text Overlay on Image */}
                                    <h1 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full px-2 text-3xl font-black text-white uppercase tracking-tighter leading-none drop-shadow-[0_4px_4px_rgba(0,0,0,1)] mix-blend-overlay opacity-80 break-words font-display">
                                        {event.title}
                                    </h1>
                                    <h1 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full px-2 text-3xl font-black text-white uppercase tracking-tighter leading-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] break-words font-display">
                                        {event.title}
                                    </h1>
                                </div>

                                {/* Host Name */}
                                <div className="text-center space-y-1 relative">
                                    <p className="text-2xl font-bold text-white tracking-tight drop-shadow-lg">{event.host?.name || "Host"}</p>
                                </div>

                                {/* Footer Logo */}
                                <div className="absolute bottom-6 flex items-center gap-1.5 opacity-80">
                                    <div className="w-4 h-4 rounded-full border-2 border-white"></div>
                                    <span className="text-[10px] font-bold text-white tracking-widest lowercase">jollywitme</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="text-center text-white/40 text-sm max-w-sm">
                        Post this flyer on your socials and tag JollyWitMe to get featured!
                    </p>
                </div>

                {/* Footer Actions */}
                <div className="p-6 pt-0">
                    <button
                        onClick={handleDownload}
                        disabled={isGenerating}
                        className="w-full py-4 bg-white hover:bg-white/90 active:scale-[0.98] text-black rounded-2xl font-bold flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                    >
                        {isGenerating ? (
                            <>
                                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                <span>Generating...</span>
                            </>
                        ) : (
                            <>
                                <Download className="w-5 h-5" />
                                <span>Download Flyer</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
