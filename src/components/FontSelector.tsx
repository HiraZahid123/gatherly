"use client";

import { Check, X, Type } from "lucide-react";

interface FontSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    currentFont: string;
    onSelect: (font: string) => void;
}

const FONTS = [
    { id: "inter", name: "Modern", variable: "var(--font-inter)", class: "font-sans" },
    { id: "montserrat", name: "Clean", variable: "var(--font-montserrat)", class: "font-sans" },
    { id: "playfair", name: "Elegant", variable: "var(--font-playfair)", class: "font-serif" },
    { id: "cinzel", name: "Classic", variable: "var(--font-cinzel)", class: "font-serif" },
    { id: "jetbrains-mono", name: "Technical", variable: "var(--font-jetbrains-mono)", class: "font-mono" },
    { id: "oswald", name: "Bold", variable: "var(--font-oswald)", class: "font-sans" },
    { id: "great-vibes", name: "Handwritten", variable: "var(--font-great-vibes)", class: "font-handwriting" },
    { id: "caveat", name: "Playful", variable: "var(--font-caveat)", class: "font-handwriting" },
    { id: "dancing-script", name: "Cursive", variable: "var(--font-dancing-script)", class: "font-handwriting" },
];

export default function FontSelector({ isOpen, onClose, currentFont, onSelect }: FontSelectorProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end p-4 items-center pr-20">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-500"
                onClick={onClose}
            />

            {/* Side Panel */}
            <div className="relative w-full max-w-[340px] bg-[#0a0a0a]/90 backdrop-blur-3xl border border-white/10 rounded-[2rem] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] animate-in slide-in-from-right-8 duration-500">
                {/* Header */}
                <div className="px-6 pt-6 pb-2">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="text-xl font-bold text-white tracking-tight">Typography</h3>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                            <X className="w-5 h-5 text-white/40" />
                        </button>
                    </div>
                </div>

                {/* Font List */}
                <div className="px-6 pb-8 max-h-[450px] overflow-y-auto no-scrollbar space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                        {FONTS.map((font) => (
                            <button
                                key={font.id}
                                onClick={() => { onSelect(font.variable); onClose(); }}
                                className={`group relative h-16 rounded-xl overflow-hidden border transition-all duration-300 ${currentFont === font.variable
                                    ? "border-white bg-white/10 scale-[1.02] shadow-xl shadow-white/5"
                                    : "border-white/5 bg-white/5 hover:border-white/40 hover:bg-white/10"
                                    }`}
                            >
                                <div className="absolute inset-0 flex items-center justify-center p-4">
                                    <span className="text-xl text-white group-hover:scale-110 transition-transform duration-300" style={{ fontFamily: font.variable }}>
                                        {font.name}
                                    </span>
                                </div>

                                {currentFont === font.variable && (
                                    <div className="absolute top-2 right-2 bg-white text-black rounded-full p-0.5 shadow-lg">
                                        <Check className="w-3 h-3" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer hint */}
                <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5 flex items-center gap-2">
                    <Type className="w-3 h-3 text-white/20" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/20">
                        Dynamic Font Engine
                    </span>
                </div>
            </div>
        </div>
    );
}
