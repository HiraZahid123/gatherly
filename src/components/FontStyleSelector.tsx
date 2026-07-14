"use client";

import { X } from "lucide-react";
import { useState } from "react";

export const FONT_STYLES = [
    { id: "sans", label: "Sans Serif", fontClass: "font-sans", preview: "Modern & Clean" },
    { id: "playfair", label: "Playfair", fontClass: "font-playfair", preview: "Elegant & Serif" },
    { id: "cursive", label: "Cursive", fontClass: "font-cursive", preview: "Fancy & Script" },
    { id: "mono", label: "Monospace", fontClass: "font-mono", preview: "Digital & Tech" },
    { id: "playfair-bold", label: "Playfair Bold", fontClass: "font-playfair font-black", preview: "Bold & Regal" },
    { id: "mono-upper", label: "Mono Uppercase", fontClass: "font-mono uppercase tracking-wider", preview: "FUTURISTIC" },
];

interface FontStyleSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (id: string) => void;
    currentStyle: string;
}

export default function FontStyleSelector({ isOpen, onClose, onSelect, currentStyle }: FontStyleSelectorProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>

            {/* Modal */}
            <div className="relative bg-[#1a1a1a] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Choose Font Style</h2>
                        <p className="text-sm text-white/60 mt-1">Select a font style for your event title</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-white/60" />
                    </button>
                </div>

                {/* Font Grid */}
                <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {FONT_STYLES.map((style) => (
                            <button
                                key={style.id}
                                onClick={() => {
                                    onSelect(style.id);
                                    onClose();
                                }}
                                className={`
                                    relative p-6 rounded-xl border-2 transition-all text-left
                                    ${currentStyle === style.id
                                        ? 'border-white bg-white/5'
                                        : 'border-white/10 hover:border-white/30 hover:bg-white/5'
                                    }
                                `}
                            >
                                <div className="space-y-2">
                                    <div className="text-sm font-semibold text-white/60 uppercase tracking-wider">
                                        {style.label}
                                    </div>
                                    <div className={`text-2xl text-white ${style.fontClass}`}>
                                        {style.preview}
                                    </div>
                                </div>
                                {currentStyle === style.id && (
                                    <div className="absolute top-3 right-3 w-2 h-2 bg-white rounded-full"></div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
