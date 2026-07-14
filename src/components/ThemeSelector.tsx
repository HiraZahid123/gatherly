"use client";

import { X, Check, Palette, Search } from "lucide-react";
import { useState } from "react";

interface ThemeSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (theme: string, primaryColor?: string) => void;
    currentTheme: string;
}

const CATEGORIES = ["All", "Dark", "Minimal"];

export const THEMES = [
    {
        id: "streak",
        label: "Streak",
        category: "Dark",
        emoji: "▬",
        description: "3D Ribbed Curtain",
        preview: (
            <div className="absolute inset-0 bg-[#1a1a1a] flex justify-around">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="w-[1px] h-full bg-black/60 shadow-[1px_0_1px_rgba(255,255,255,0.05)]" />
                ))}
            </div>
        ),
        accentColor: "#888899",
    },
    {
        id: "meadow",
        label: "Meadow",
        category: "Minimal",
        emoji: "🌿",
        description: "3D Ethereal Particles",
        preview: (
            <div className="absolute inset-0 bg-emerald-950/40 overflow-hidden">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-emerald-400/20 rounded-full"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            filter: 'blur(1px)'
                        }}
                    />
                ))}
            </div>
        ),
    },
    {
        id: "crystal",
        label: "Crystal",
        category: "Minimal",
        emoji: "💎",
        description: "3D Floating Gemstones",
        preview: (
            <div className="absolute inset-0 bg-black overflow-hidden flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-purple-500/50 rotate-45 rounded-sm shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
            </div>
        ),
        accentColor: "#a855f7",
    },
    {
        id: "waves",
        label: "Waves",
        category: "Dark",
        emoji: "🌊",
        description: "3D Undulating Ocean",
        preview: (
            <div className="absolute inset-0 bg-sky-950/40 overflow-hidden flex flex-col justify-end">
                <div className="w-full h-1/2 bg-gradient-to-t from-sky-500/20 to-transparent border-t border-sky-400/20 rounded-[100%]" style={{ transform: 'scaleX(1.5)' }} />
            </div>
        ),
        accentColor: "#0ea5e9",
    },
];

export default function ThemeSelector({ isOpen, onClose, onSelect, currentTheme }: ThemeSelectorProps) {
    const [activeCategory, setActiveCategory] = useState("All");

    if (!isOpen) return null;

    const isCustom = currentTheme.startsWith('custom-gradient:');
    const customColor = isCustom ? currentTheme.split(':')[1] : "#7c3aed";

    const filteredThemes = activeCategory === "All"
        ? THEMES
        : THEMES.filter(t => t.category === activeCategory);

    return (
        <div className="fixed inset-0 z-[100] flex justify-end p-4 items-center pr-20">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-500" onClick={onClose} />

            {/* Side Panel (Animate from right) */}
            <div className="relative w-full max-w-[340px] bg-[#0a0a0a]/90 backdrop-blur-3xl border border-white/10 rounded-[2rem] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] animate-in slide-in-from-right-8 duration-500">
                {/* Header */}
                <div className="px-6 pt-6 pb-2">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="text-xl font-bold text-white tracking-tight">Background</h3>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                            <X className="w-5 h-5 text-white/40" />
                        </button>
                    </div>
                </div>

                {/* Categories */}
                <div className="px-6 mb-4">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === cat
                                    ? "bg-white text-black shadow-lg shadow-white/10"
                                    : "bg-white/5 text-white/40 hover:bg-white/10"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Theme Grid */}
                <div className="px-6 pb-8 max-h-[450px] overflow-y-auto no-scrollbar">
                    <div className="grid grid-cols-3 gap-y-6 gap-x-4">
                        {/* None / Custom option */}
                        <div className="flex flex-col items-center gap-2">
                            <button
                                onClick={() => { onSelect(""); onClose(); }}
                                className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all overflow-hidden ${!currentTheme ? "border-white scale-110" : "border-white/5 hover:border-white/20"
                                    }`}
                            >
                                <div className="w-full h-full bg-gradient-to-br from-emerald-500 via-green-500 to-yellow-500 p-0.5 opacity-40">
                                    <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
                                        <Search className="w-5 h-5 text-white/20" />
                                    </div>
                                </div>
                            </button>
                            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">None</span>
                        </div>

                        {filteredThemes.map((theme) => (
                            <div key={theme.id} className="flex flex-col items-center gap-2">
                                <button
                                    onClick={() => { onSelect(theme.id); onClose(); }}
                                    className={`w-14 h-14 rounded-full relative transition-all overflow-hidden border-2 ${currentTheme === theme.id
                                        ? "border-white scale-110 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                                        : "border-transparent hover:scale-105 hover:border-white/20"
                                        }`}
                                >
                                    {theme.preview}
                                    {currentTheme === theme.id && (
                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                            <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center text-black shadow-lg">
                                                <Check className="w-3 h-3" />
                                            </div>
                                        </div>
                                    )}
                                </button>
                                <span className={`text-[9px] font-black uppercase tracking-widest ${currentTheme === theme.id ? "text-white" : "text-white/40"}`}>
                                    {theme.label}
                                </span>
                            </div>
                        ))}

                        {/* Custom Gradient Picker */}
                        {(activeCategory === "All" || activeCategory === "Minimal") && (
                            <div className="flex flex-col items-center gap-2">
                                <div className="relative">
                                    <button
                                        onClick={() => document.getElementById('custom-theme-color')?.click()}
                                        className={`w-14 h-14 rounded-full relative transition-all overflow-hidden border-2 flex items-center justify-center ${isCustom
                                            ? "border-white scale-110 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                                            : "border-white/5 hover:border-white/20"
                                            }`}
                                        style={{
                                            background: isCustom
                                                ? 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)'
                                                : `linear-gradient(90deg, ${customColor} 0%, #ffffff 50%, ${customColor} 100%)`
                                        }}
                                    >
                                        <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
                                            {!isCustom && <Palette className="w-5 h-5 text-white/40" />}
                                        </div>
                                        {isCustom && (
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center text-black shadow-lg">
                                                    <Check className="w-3 h-3" />
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                    <input
                                        id="custom-theme-color"
                                        type="color"
                                        className="absolute bottom-0 right-0 w-0 h-0 opacity-0 cursor-pointer"
                                        value={customColor}
                                        onChange={(e) => {
                                            const color = e.target.value;
                                            onSelect(`custom-gradient:${color}`, color);
                                        }}
                                    />
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-widest ${isCustom ? "text-white" : "text-white/40"}`}>
                                    Custom
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer hint */}
                <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5 flex items-center gap-2">
                    <Palette className="w-3 h-3 text-white/20" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/20">
                        GPU-Rendered Shaders
                    </span>
                </div>
            </div>
        </div>
    );
}

