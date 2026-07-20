"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Palette, Type, Wand2, Image as ImageIcon } from "lucide-react";
import InteractiveBackground from "@/components/InteractiveBackground";
import FloatingParticles from "@/components/FloatingParticles";
import VfxCanvas from "@/components/vfx/VfxCanvas";
import Confetti from "@/components/vfx/Confetti";
import Rain from "@/components/vfx/Rain";
import { VIBE_THEMES } from "@/lib/theme";
import SafeLottiePlayer from "@/components/SafeLottiePlayer";
import { VIDEO_VFX_PRESETS } from "@/components/EffectSelector";

export default function InteractiveShowcase() {
    const [themeIdx, setThemeIdx] = useState(0);
    const [effectIdx, setEffectIdx] = useState(0);
    const [fontIdx, setFontIdx] = useState(0);
    const [posterIdx, setPosterIdx] = useState(0);

    const themes = ["dark", "meadow", "streak", "crystal", "waves"];
    const effects = ["none", "particles", "aurora", "glow", "confetti", "rain", "balloons", "doge", "ghosts", "graduation"];
    const posters = [
        "/partiful/Aquarius.avif",
        "/partiful/disco-pride.avif",
        "/partiful/awards-night.avif",
        "/partiful/mocktail-party.avif"
    ];
    // Select a few distinct fonts from the platform
    const vibes = ["classic", "fancy", "digital", "royal"];
    
    const currentTheme = themes[themeIdx];
    const currentEffect = effects[effectIdx];
    const currentPoster = posters[posterIdx];
    const currentVibeId = vibes[fontIdx];
    
    // Auto-cycle state
    const [activeTab, setActiveTab] = useState<string>("Backgrounds");

    useEffect(() => {
        if (!activeTab) return;
        const interval = setInterval(() => {
            if (activeTab === "Backgrounds") setThemeIdx((prev) => (prev + 1) % themes.length);
            if (activeTab === "Fonts") setFontIdx((prev) => (prev + 1) % vibes.length);
            if (activeTab === "Animations") setEffectIdx((prev) => (prev + 1) % effects.length);
            if (activeTab === "Posters") setPosterIdx((prev) => (prev + 1) % posters.length);
        }, 3500);
        return () => clearInterval(interval);
    }, [activeTab, themes.length, vibes.length, effects.length, posters.length]);
    
    // Get the actual font class from the platform's theme engine
    const activeVibe = VIBE_THEMES.find(v => v.id === currentVibeId) || VIBE_THEMES[0];
    const activeFont = activeVibe.fontClass;

    const handleTabClick = (tab: string) => {
        setActiveTab(tab);
        // Immediate cycle on click
        if (tab === "Backgrounds") setThemeIdx((prev) => (prev + 1) % themes.length);
        if (tab === "Fonts") setFontIdx((prev) => (prev + 1) % vibes.length);
        if (tab === "Animations") setEffectIdx((prev) => (prev + 1) % effects.length);
        if (tab === "Posters") setPosterIdx((prev) => (prev + 1) % posters.length);
    };

    return (
        <section className="relative py-24 min-h-screen flex items-center bg-[#041a10]">
            <div className="container mx-auto px-4 max-w-6xl text-center relative z-10">
                <h2 className="text-4xl md:text-5xl font-black mb-4 text-white drop-shadow-md">
                    Fun, modern invites in 1-click
                </h2>
                <p className="text-xl text-white/80 mb-12 drop-shadow-sm">
                    100% free, no paywalls. Customize the perfect invite.
                </p>

                {/* Tabs */}
                <div className="flex flex-wrap justify-center gap-4 mb-12">
                    {[
                        { id: "Backgrounds", icon: Palette },
                        { id: "Fonts", icon: Type },
                        { id: "Animations", icon: Wand2 },
                        { id: "Posters", icon: ImageIcon }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabClick(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all shadow-lg border backdrop-blur-md ${
                                activeTab === tab.id
                                    ? 'bg-white text-gray-900 border-white scale-105'
                                    : 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.id}
                        </button>
                    ))}
                </div>

                {/* Demo Card - Mimicking the event create preview */}
                <div className={`relative max-w-4xl mx-auto rounded-3xl p-8 md:p-12 shadow-2xl transition-all duration-700 bg-black/40 backdrop-blur-xl border border-white/10 overflow-hidden`}>
                    
                    {/* Card Backgrounds */}
                    <div className="absolute inset-0 -z-10 pointer-events-none">
                        {['meadow', 'streak', 'crystal', 'waves'].includes(currentTheme) && (
                            <InteractiveBackground currentTheme={currentTheme} currentEffect={currentEffect} />
                        )}
                        {currentTheme === 'dark' && (
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 to-black transition-opacity duration-700"></div>
                        )}

                        {/* Card Animations */}
                        {currentEffect === 'particles' && <FloatingParticles />}
                        {currentEffect === 'confetti' && <Confetti />}
                        {currentEffect === 'rain' && <Rain />}
                        
                        {(() => {
                            const preset = VIDEO_VFX_PRESETS.find(p => p.id === currentEffect);
                            if (preset) {
                                if (preset.type === 'video') return <video src={preset.videoUrl} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none mix-blend-screen" />;
                                if (preset.type === 'lottie') return <SafeLottiePlayer src={preset.videoUrl} className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-80" />;
                            }
                            return null;
                        })()}
                        
                        {currentEffect === 'aurora' && (
                            <div className="absolute inset-0 opacity-60 mix-blend-screen">
                                <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-cyan-500/50 blur-[120px] rounded-full animate-pulse"></div>
                                <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-green-500/50 blur-[120px] rounded-full animate-pulse delay-700"></div>
                                <div className="absolute top-1/2 left-1/2 w-[50%] h-[50%] bg-rose-500/50 blur-[120px] rounded-full animate-pulse delay-1000"></div>
                            </div>
                        )}
                        {currentEffect === 'glow' && (
                            <div className="absolute inset-0 mix-blend-screen animate-pulse">
                                <div className="absolute top-1/4 left-1/4 w-[40rem] h-[40rem] bg-rose-500/30 blur-[120px] rounded-full"></div>
                                <div className="absolute bottom-1/4 right-1/4 w-[40rem] h-[40rem] bg-emerald-500/30 blur-[120px] rounded-full"></div>
                            </div>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center text-left">
                        {/* Text Content */}
                        <div className={`space-y-6 ${activeFont} text-white`}>
                            <h3 className="text-5xl md:text-6xl font-extrabold leading-tight">
                                26th Birthday Bash
                            </h3>
                            <div className="space-y-1 text-white/80">
                                <p className="font-bold text-lg">Friday, April 5</p>
                                <p>6:00pm</p>
                            </div>
                            
                            <div className="pt-4 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden relative border border-white/20">
                                         <Image src="/guests/mikdog.webp" alt="Host" fill className="object-cover" />
                                    </div>
                                    <span className="text-sm text-white/80">Hosted by <span className="font-bold text-white">You</span></span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-white/80">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    RSVP to see location
                                </div>
                            </div>

                            <p className="text-sm pt-4 text-white/60">
                                Celebrate the end of being on my parents health insurance!
                            </p>

                            {/* Guest List Preview */}
                            <div className="pt-8">
                                <p className="text-xs font-bold uppercase tracking-wider mb-3 text-white/50">Guest List (16 Going)</p>
                                <div className="flex -space-x-3">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div key={i} className="w-10 h-10 rounded-full bg-white/10 border-2 border-transparent overflow-hidden relative shadow-sm">
                                            <Image src={`/guests/antico.webp`} alt="Guest" fill className="object-cover" />
                                        </div>
                                    ))}
                                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border-2 border-transparent flex items-center justify-center text-xs font-bold text-white shadow-sm">
                                        +11
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Poster Image */}
                        <div className="relative aspect-square w-full max-w-sm mx-auto shadow-2xl rounded-2xl overflow-hidden transform rotate-2 hover:rotate-0 transition-transform duration-500 border border-white/10">
                            <Image 
                                src={currentPoster}
                                alt="Event Poster"
                                fill
                                className="object-cover"
                            />
                        </div>
                    </div>

                    {/* Action Buttons Float */}
                    <div className="flex flex-wrap justify-center gap-4 mt-8 w-full col-span-1 md:col-span-2">
                        {['👍 Going', '🤔 Maybe', '😢 Can\'t go'].map((text, i) => (
                            <button key={i} className="w-20 h-20 rounded-full flex flex-col items-center justify-center gap-1 shadow-xl hover:-translate-y-1 transition-all font-bold text-xs bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/20">
                                <span className="text-xl">{text.split(' ')[0]}</span>
                                <span>{text.split(' ').slice(1).join(' ')}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
