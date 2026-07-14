"use client";
import { useState, useEffect } from "react";
import { Check, HelpCircle, X, Settings, Loader2 } from "lucide-react";
import { VIBE_THEMES } from "@/lib/theme";

export const RSVP_STYLES: Record<string, { icon: any, label: string, emojiset: [string, string, string] | null }> = {
    standard: { label: "Standard", icon: Check, emojiset: null },
    emojis: { label: "Emojis", icon: "👍", emojiset: ["👍", "🤔", "👎"] },
    bloom: { label: "Bloom", icon: "🌷", emojiset: ["🌷", "🌸", "🥀"] },
    flirty: { label: "Flirty", icon: "💋", emojiset: ["💋", "😉", "💔"] },
    hearts: { label: "Hearts", icon: "❤️", emojiset: ["❤️", "💖", "🖤"] },
    modern_dating: { label: "Modern dating", icon: "👻", emojiset: ["👻", "🤳", "🚩"] },
    sweaty: { label: "Sweaty", icon: "🥵", emojiset: ["🥵", "😰", "🤢"] },
    spooky: { label: "Spooky", icon: "🎃", emojiset: ["🎃", "👻", "⚰️"] },
    turkey: { label: "Turkey", icon: "🦃", emojiset: ["🦃", "🥧", "🍗"] },
    frosty: { label: "Frosty", icon: "☃️", emojiset: ["☃️", "❄️", "☕"] },
    milk_cookies: { label: "Milk & cookies", icon: "🎅", emojiset: ["🎅", "🍪", "🥛"] },
};

interface RSVPOptionsProps {
    labels?: {
        going?: string;
        maybe?: string;
        notGoing?: string;
    };
    onRSVP?: (status: "ACCEPTED" | "PENDING" | "DECLINED") => void;
    activeStatus?: "ACCEPTED" | "PENDING" | "DECLINED" | null;
    isLoading?: boolean;
    isReadOnly?: boolean;
    style?: string;
    showRSVP?: boolean;
    isEditable?: boolean;
    onLabelsChange?: (labels: { going?: string, maybe?: string, notGoing?: string }) => void;
    onStyleChange?: (style: string) => void;
    onToggleRSVP?: (show: boolean) => void;
    vibeId?: string;
    containerStyle?: React.CSSProperties;
    containerClassName?: string;
}

export default function RSVPOptions({
    labels = { going: "Going", maybe: "Maybe", notGoing: "Can't Go" },
    onRSVP,
    activeStatus: activeStatusProp,
    isLoading,
    isReadOnly = false,
    style = "standard",
    showRSVP = true,
    isEditable = false,
    onLabelsChange,
    onStyleChange,
    onToggleRSVP,
    vibeId = "classic",
    containerStyle,
    containerClassName,
}: RSVPOptionsProps) {
    const [localActiveStatus, setLocalActiveStatus] = useState<"ACCEPTED" | "PENDING" | "DECLINED" | null>(null);
    const activeStatus = isEditable ? localActiveStatus : activeStatusProp;

    if (!showRSVP && isReadOnly && !isEditable) return null;

    const currentStyle = RSVP_STYLES[style] || RSVP_STYLES.standard;

    const getIcon = (id: string, defIcon: any, index: number) => {
        const Icon = defIcon;
        const emoji = currentStyle.emojiset ? currentStyle.emojiset[index] : null;

        return (
            <div className="flex flex-col items-center justify-center gap-1">
                {emoji && <span className="text-3xl sm:text-4xl leading-none mb-1">{emoji}</span>}
                <Icon className={`transition-all duration-500 ${emoji ? 'w-5 h-5 sm:w-6 sm:h-6' : 'w-8 h-8 sm:w-10 sm:h-10'} ${activeStatus === id ? "text-white scale-110" : `text-current opacity-70 group-hover:opacity-100 group-hover:scale-110`
                    }`} />
            </div>
        );
    };

    const options = [
        {
            id: "ACCEPTED" as const,
            label: labels.going || "Going",
            icon: Check,
            color: "from-green-500/20 to-emerald-500/5",
            activeColor: "bg-green-500 text-white shadow-[0_0_30px_rgba(34,197,94,0.3)]",
            hoverColor: "group-hover:border-green-500/30",
            iconColor: "text-green-500",
        },
        {
            id: "PENDING" as const,
            label: labels.maybe || "Maybe",
            icon: HelpCircle,
            color: "from-amber-500/20 to-orange-500/5",
            activeColor: "bg-amber-500 text-white shadow-[0_0_30px_rgba(245,158,11,0.3)]",
            hoverColor: "group-hover:border-amber-500/30",
            iconColor: "text-amber-500",
        },
        {
            id: "DECLINED" as const,
            label: labels.notGoing || "Can't Go",
            icon: X,
            color: "from-rose-500/20 to-red-500/5",
            activeColor: "bg-rose-500 text-white shadow-[0_0_30px_rgba(244,63,94,0.3)]",
            hoverColor: "group-hover:border-rose-500/30",
            iconColor: "text-rose-500",
        },
    ];

    return (
        <div
            className={`bg-white/[0.03] backdrop-blur-2xl rounded-none p-8 border border-white/5 shadow-2xl space-y-8 relative overflow-hidden transition-all duration-500 ${!showRSVP ? 'opacity-40 grayscale blur-[2px]' : ''} ${containerClassName || ""}`}
            style={containerStyle}
        >
            {isLoading && (
                <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] z-10 flex items-center justify-center animate-in fade-in duration-300">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
            )}

            {/* Integrated Header and Controls */}
            {(isEditable || !isReadOnly) && (
                <div className="flex justify-between items-center mb-0">
                    <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4 text-white/40" />
                        <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">RSVP Options</span>
                    </div>
                    {isEditable && (
                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 cursor-pointer bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full transition-all group">
                                <input
                                    type="checkbox"
                                    checked={showRSVP}
                                    onChange={(e) => onToggleRSVP?.(e.target.checked)}
                                    className="w-3 h-3 rounded bg-transparent border-white/20 checked:bg-emerald-500 cursor-pointer"
                                />
                                <span className="text-[9px] font-black text-white/40 group-hover:text-white uppercase tracking-widest transition-colors">Enabled</span>
                            </label>
                            <div className="relative group/style">
                                <select
                                    value={style}
                                    onChange={(e) => onStyleChange?.(e.target.value)}
                                    className="appearance-none bg-white/5 border border-white/10 px-4 py-1.5 pr-8 rounded-full text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer outline-none"
                                >
                                    {Object.entries(RSVP_STYLES).map(([id, info]) => (
                                        <option key={id} value={id} className="bg-[#0a0a0b] text-white py-2">
                                            {info.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-2.5 h-2.5">
                                        <path d="m6 9 6 6 6-6" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="flex justify-between items-center px-2 sm:px-4 gap-4">
                {options.map((opt, idx) => (
                    <div
                        key={opt.id}
                        onClick={() => {
                            if (isEditable) {
                                setLocalActiveStatus(prev => prev === opt.id ? null : opt.id);
                            } else {
                                onRSVP?.(opt.id);
                            }
                        }}
                        className={`flex flex-col items-center gap-4 group transition-all duration-500 ${(isReadOnly && !isEditable) ? 'cursor-default' : 'cursor-pointer active:scale-95'}`}
                    >
                        <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border flex items-center justify-center relative transition-all duration-500 shadow-inner ${activeStatus === opt.id
                            ? opt.activeColor + " border-transparent"
                            : `bg-gradient-to-br ${opt.color} border-white/10 ${opt.hoverColor}`
                            }`}>
                            {getIcon(opt.id, opt.icon, idx)}
                        </div>
                        {isEditable ? (
                            <input
                                type="text"
                                value={opt.label}
                                onChange={(e) => {
                                    const field = opt.id === "ACCEPTED" ? "going" : opt.id === "PENDING" ? "maybe" : "notGoing";
                                    onLabelsChange?.({ ...labels, [field]: e.target.value });
                                }}
                                className={`bg-transparent border-none outline-none text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-center text-white/40 focus:text-white hover:text-white/70 transition-colors w-full p-0 ${VIBE_THEMES.find(v => v.id === vibeId)?.fontClass || ""}`}
                            />
                        ) : (
                            <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${activeStatus === opt.id ? "text-white opacity-100" : "text-white/40 group-hover:text-white/70"} ${VIBE_THEMES.find(v => v.id === vibeId)?.fontClass || ""}`}>
                                {opt.label}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
