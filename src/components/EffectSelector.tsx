"use client";

import { X, Check, Sparkles } from "lucide-react";

interface EffectSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (effect: string) => void;
    currentEffect: string;
}

interface Effect {
    id: string;
    label: string;
    emoji: string;
    description: string;
    previewGradient: string;
    accentColor: string;
}

// Only graphic 3D effects — no generic CSS-only effects
export const EFFECTS: Effect[] = [
    {
        id: "particles",
        label: "Particles",
        emoji: "✨",
        description: "Floating Light Orbs",
        previewGradient: "bg-gradient-to-t from-emerald-500/30 to-transparent",
        accentColor: "#10b981",
    },
    {
        id: "confetti",
        label: "Confetti",
        emoji: "🎉",
        description: "3D Party Confetti",
        previewGradient: "bg-gradient-to-r from-pink-500/40 via-purple-500/40 to-blue-500/40",
        accentColor: "#ec4899",
    },
    {
        id: "aurora",
        label: "Aurora",
        emoji: "🌌",
        description: "Pulsing Glow",
        previewGradient: "bg-gradient-to-br from-cyan-500/40 via-green-500/20 to-rose-500/40",
        accentColor: "#06b6d4",
    },
    {
        id: "glow",
        label: "Glow",
        emoji: "💡",
        description: "Atmospheric Pulse",
        previewGradient: "bg-gradient-to-b from-rose-500/30 to-emerald-500/30",
        accentColor: "#f43f5e",
    },
    {
        id: "rain",
        label: "Rain",
        emoji: "🌧️",
        description: "Moody Atmospheric Rain",
        previewGradient: "bg-gradient-to-b from-slate-500/20 to-slate-900/60",
        accentColor: "#64748b",
    },
    {
        id: "grid",
        label: "Grid",
        emoji: "🚦",
        description: "Cyberpunk Laser Grid",
        previewGradient: "bg-[linear-gradient(to_right,#ffffff20_1px,transparent_1px),linear-gradient(to_bottom,#ffffff20_1px,transparent_1px)] bg-[size:10px_10px]",
        accentColor: "#ffffff",
    },
    {
        id: "floral",
        label: "Floral",
        emoji: "🌸",
        description: "Cinematic Orchid Branches",
        previewGradient: "bg-gradient-to-br from-white via-neutral-100 to-transparent opacity-60",
        accentColor: "#ffffff",
    },
    {
        id: "vignette",
        label: "Vignette",
        emoji: "🌑",
        description: "Cinematic Dark Borders",
        previewGradient: "shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] bg-transparent",
        accentColor: "#000000",
    },
];

export const IMAGE_VFX_PRESETS = [
    {
        id: "money",
        label: "Money",
        imageUrl: "/effects/money.svg",
    },
    {
        id: "heart",
        label: "Hearts",
        imageUrl: "/effects/heart.svg",
    },
    {
        id: "snow",
        label: "Snow",
        imageUrl: "/effects/snow.svg",
    },
    {
        id: "star",
        label: "Stars",
        imageUrl: "/effects/star.svg",
    },
];

export default function EffectSelector({ isOpen, onClose, onSelect, currentEffect }: EffectSelectorProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end p-4 items-center pr-20">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-500" onClick={onClose} />

            {/* Side Panel (Animate from right) */}
            <div className="relative w-full max-w-[340px] bg-[#0a0a0a]/90 backdrop-blur-3xl border border-white/10 rounded-[2rem] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] animate-in slide-in-from-right-8 duration-500">
                {/* Header */}
                <div className="px-6 pt-6 pb-2">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="text-xl font-bold text-white tracking-tight">Foreground</h3>
                        <button type="button" onClick={onClose} aria-label="Close" className="p-2 hover:bg-white/5 rounded-full transition-colors">
                            <X className="w-5 h-5 text-white/40" />
                        </button>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-3 gap-y-6 gap-x-4">
                    {/* None option */}
                    <div className="flex flex-col items-center gap-2">
                        <button
                            type="button"
                            aria-label="No effect"
                            onClick={() => { onSelect("none"); onClose(); }}
                            className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all bg-black ${!currentEffect || currentEffect === "none" ? "border-white scale-110" : "border-white/5 hover:border-white/20"}`}
                        >
                            <span className="text-lg opacity-30 text-white">✕</span>
                        </button>
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">None</span>
                    </div>

                    {/* Custom Upload Option */}
                    <div className="flex flex-col items-center gap-2">
                        <button
                            type="button"
                            aria-label="Upload custom effect"
                            onClick={() => document.getElementById('custom-effect-upload')?.click()}
                            className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all bg-white/5 hover:bg-white/10 ${currentEffect?.startsWith("custom-uploaded:") ? "border-white scale-110 shadow-xl" : "border-white/5"}`}
                        >
                            {currentEffect?.startsWith("custom-uploaded:") ? (
                                <img src={currentEffect.split(":")[1]} alt="Custom" className="w-8 h-8 object-contain" />
                            ) : (
                                <span className="text-lg opacity-30 text-white font-black">+</span>
                            )}
                        </button>
                        <input
                            id="custom-effect-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            aria-label="Upload custom effect file"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                console.log("File selected:", file.name, file.size, file.type);

                                const formData = new FormData();
                                formData.append('file', file);

                                try {
                                    console.log("Starting upload to /api/upload/cover...");
                                    const res = await fetch('/api/upload/cover', {
                                        method: 'POST',
                                        body: formData,
                                    });
                                    console.log("Response status:", res.status);

                                    const data = await res.json();
                                    console.log("Response data:", data);

                                    if (data.imageUrl) {
                                        console.log("Upload successful! Applying effect:", `custom-uploaded:${data.imageUrl}`);
                                        onSelect(`custom-uploaded:${data.imageUrl}`);
                                        onClose();
                                    } else if (data.error) {
                                        console.error("Server error:", data.error);
                                        alert(data.error);
                                    }
                                } catch (err) {
                                    console.error("Upload failed", err);
                                    alert("Failed to upload custom effect image.");
                                }
                            }}
                        />
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest text-center px-1">Upload Custom</span>
                    </div>

                    {EFFECTS.map((effect) => (
                        <div key={effect.id} className="flex flex-col items-center gap-2">
                            <button
                                key={effect.id}
                                type="button"
                                aria-label={`Select ${effect.label} effect`}
                                onClick={() => { onSelect(effect.id); onClose(); }}
                                className={`w-14 h-14 rounded-full relative transition-all overflow-hidden border-2 ${currentEffect === effect.id ? "border-white scale-110 shadow-xl" : "border-transparent hover:scale-105"}`}
                            >
                                {/* Visual preview */}
                                <div className={`absolute inset-0 ${effect.previewGradient}`} />

                                {currentEffect === effect.id && (
                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                        <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center text-black shadow-lg">
                                            <Check className="w-3 h-3" />
                                        </div>
                                    </div>
                                )}
                            </button>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${currentEffect === effect.id ? "text-white" : "text-white/40"}`}>
                                {effect.label}
                            </span>
                        </div>
                    ))}

                    {/* Image Preset Effects */}
                    {IMAGE_VFX_PRESETS.map((preset) => {
                        const effectId = `preset-image:${preset.id}`;
                        const isSelected = currentEffect === effectId;
                        return (
                            <div key={effectId} className="flex flex-col items-center gap-2">
                                <button
                                    type="button"
                                    aria-label={`Select ${preset.label} effect`}
                                    onClick={() => { onSelect(effectId); onClose(); }}
                                    className={`w-14 h-14 rounded-full relative transition-all overflow-hidden border-2 bg-white/5 ${isSelected ? "border-white scale-110 shadow-xl" : "border-transparent hover:scale-105 hover:bg-white/10"}`}
                                >
                                    {/* Visual preview */}
                                    <div className="absolute inset-0 flex items-center justify-center p-2 opacity-50">
                                        <img src={preset.imageUrl} alt={preset.label} className="w-full h-full object-contain" />
                                    </div>

                                    {isSelected && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                            <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center text-black shadow-lg">
                                                <Check className="w-3 h-3" />
                                            </div>
                                        </div>
                                    )}
                                </button>
                                <span className={`text-[9px] font-black uppercase tracking-widest ${isSelected ? "text-white" : "text-white/40"}`}>
                                    {preset.label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                <div className="px-6 py-4 border-t border-white/5 bg-white/[0.02] flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-white/20" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/20">More effects coming soon</span>
                </div>
            </div>
        </div>
    );
}

