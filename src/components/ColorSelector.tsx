"use client";

import { X } from "lucide-react";

export const COLOR_PALETTES = [
    { id: "blue", label: "Ocean Blue", primaryColor: "#3b82f6", secondaryColor: "#6366f1" },
    { id: "rose", label: "Rose Garden", primaryColor: "#f43f5e", secondaryColor: "#f97316" },
    { id: "pink", label: "Pink Dream", primaryColor: "#ec4899", secondaryColor: "#a855f7" },
    { id: "amber", label: "Golden Amber", primaryColor: "#f59e0b", secondaryColor: "#57534e" },
    { id: "green", label: "Fresh Green", primaryColor: "#22c55e", secondaryColor: "#84cc16" },
    { id: "gold", label: "Elegant Gold", primaryColor: "#eab308", secondaryColor: "#1a1a1a" },
    { id: "cyan", label: "Cyber Cyan", primaryColor: "#06b6d4", secondaryColor: "#3b82f6" },
    { id: "purple", label: "Royal Purple", primaryColor: "#a855f7", secondaryColor: "#d946ef" },
    { id: "orange", label: "Retro Orange", primaryColor: "#f97316", secondaryColor: "#f43f5e" },
];

interface ColorSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (id: string) => void;
    currentPalette: string;
}

export default function ColorSelector({ isOpen, onClose, onSelect, currentPalette }: ColorSelectorProps) {
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
                        <h2 className="text-2xl font-bold text-white">Choose Color Palette</h2>
                        <p className="text-sm text-white/60 mt-1">Select colors for your event background</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-white/60" />
                    </button>
                </div>

                {/* Color Grid */}
                <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {COLOR_PALETTES.map((palette) => (
                            <button
                                key={palette.id}
                                onClick={() => {
                                    onSelect(palette.id);
                                    onClose();
                                }}
                                className={`
                                    relative p-6 rounded-xl border-2 transition-all text-left overflow-hidden
                                    ${currentPalette === palette.id
                                        ? 'border-white'
                                        : 'border-white/10 hover:border-white/30'
                                    }
                                `}
                            >
                                {/* Gradient Preview */}
                                <div
                                    className="absolute inset-0 opacity-20"
                                    style={{
                                        background: `radial-gradient(circle at 50% 50%, ${palette.primaryColor} 0%, ${palette.secondaryColor} 100%)`
                                    }}
                                ></div>

                                <div className="relative space-y-3">
                                    <div className="text-lg font-semibold text-white">
                                        {palette.label}
                                    </div>
                                    <div className="flex gap-2">
                                        <div
                                            className="w-12 h-12 rounded-lg border border-white/20"
                                            style={{ backgroundColor: palette.primaryColor }}
                                        ></div>
                                        <div
                                            className="w-12 h-12 rounded-lg border border-white/20"
                                            style={{ backgroundColor: palette.secondaryColor }}
                                        ></div>
                                    </div>
                                </div>
                                {currentPalette === palette.id && (
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
