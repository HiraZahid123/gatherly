"use client";

import { Palette, Sparkles, Settings, CheckCircle, LogIn, Type, Plus, Loader2 } from "lucide-react";

interface CreateEventSidebarProps {
    onItemClick: (label: string) => void;
    activeItem?: string;
    isAuthenticated?: boolean;
    /** Currently selected background theme id (e.g. 'meadow', 'streak') */
    selectedTheme?: string;
    /** Currently selected foreground effect id (e.g. 'skiing') */
    selectedEffect?: string;
    mode?: 'event' | 'card';
    isLoading?: boolean;
}

// Preview look-ups must stay in sync with ThemeSelector.tsx and EffectSelector.tsx
const THEME_PREVIEWS: Record<string, string> = {
    streak: "linear-gradient(to bottom, #2a2a2e, #1c1c20, #0a0a0c)",
};

const EFFECT_PREVIEWS: Record<string, string> = {};

export default function CreateEventSidebar({
    onItemClick,
    activeItem,
    isAuthenticated,
    selectedTheme,
    selectedEffect,
    mode = 'event',
    isLoading = false
}: CreateEventSidebarProps) {
    const items = mode === 'card' ? [
        { icon: Palette, label: "Theme" },
        { icon: Type, label: "Font" },
        { icon: Sparkles, label: "Effect", badge: "NEW" },
        {
            icon: isLoading ? Loader2 : CheckCircle,
            label: "Next",
            isAction: true,
        },
    ] : [
        { icon: Palette, label: "Theme" },
        { icon: Sparkles, label: "Effect", badge: "NEW" },
        { icon: Settings, label: "Settings" },
        {
            icon: isLoading ? Loader2 : (isAuthenticated ? CheckCircle : LogIn),
            label: isAuthenticated ? "Publish" : "Sign in",
            isAction: true,
        },
    ];

    // Resolve the preview background for the icon circle
    const getIconBg = (label: string): React.ReactNode => {
        if (label === "Theme" && selectedTheme) {
            if (selectedTheme === 'streak') {
                return (
                    <div className="absolute inset-0 bg-[#2a2a2a] flex justify-around">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="w-[1px] h-full bg-black/40" />
                        ))}
                    </div>
                );
            }
            if (selectedTheme.startsWith('custom-gradient:')) {
                return (
                    <div className="absolute inset-0" style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }} />
                );
            }
        }

        // Effects previews (if any)
        if (label === "Effect" && selectedEffect && selectedEffect !== "none") {
            // ... handle effects if needed
        }

        return null;
    };

    // Calculate adaptive sidebar background
    const getSidebarBaseStyle = () => {
        let tint = "rgba(10, 10, 10, 0.7)"; // Default
        if (selectedTheme === 'streak') {
            tint = "rgba(10, 15, 30, 0.75)"; // Subtle emerald-indigo tint
        } else if (selectedTheme?.startsWith('custom-gradient:')) {
            const color = selectedTheme.split(':')[1];
            tint = `${color}15`; // 15 is hex for ~8% opacity
        }

        return {
            backgroundColor: tint,
            backdropFilter: "blur(40px)",
        };
    };

    return (
        <div
            className="flex flex-col items-center py-6 px-0 border-l border-white/10 rounded-l-[2.5rem] shadow-[-20px_0_50px_rgba(0,0,0,0.5)] relative w-20 overflow-visible min-h-[380px] justify-center transition-all duration-700"
            style={getSidebarBaseStyle()}
        >
            <div className="flex flex-col gap-6 items-center relative z-10 w-full">
                {items.map((item, index) => {
                    const iconNode = getIconBg(item.label);
                    const isActive = activeItem === item.label;

                    return (
                        <button
                            key={index}
                            onClick={() => onItemClick(item.label)}
                            className="flex flex-col items-center gap-1.5 group relative outline-none w-full"
                        >
                            {item.badge && (
                                <span className="absolute -left-4 top-1 bg-gradient-to-br from-[#ff1f40] to-[#d90429] text-[8px] font-black px-1.2 py-0.4 rounded-sm text-white z-20 shadow-[0_4px_10px_rgba(255,31,64,0.4)] -rotate-[15deg] border border-white/20 uppercase tracking-tighter">
                                    {item.badge}
                                </span>
                            )}

                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 relative overflow-hidden ${isActive
                                    ? "ring-2 ring-white ring-offset-2 ring-offset-black/20 scale-105 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                                    : "hover:scale-105"
                                    } ${item.isAction ? "bg-white !w-12 !h-12 shadow-xl hover:!scale-110 !ring-0 !ring-offset-0" : ""}`}
                            >
                                {/* Icon background / preview */}
                                <div className={`absolute inset-0 transition-opacity duration-500 ${isActive ? "opacity-100" : "opacity-70"}`}>
                                    {iconNode ? (
                                        iconNode
                                    ) : item.label === "Theme" ? (
                                        // Default theme icon: warm gradient
                                        <div className="absolute inset-0 bg-gradient-to-br from-[#dcd683] via-[#c2d66e] to-[#88aa00]" />
                                    ) : item.label === "Effect" ? (
                                        // Default effect icon: subtle shimmer
                                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.15)_0%,transparent_70%)]" />
                                    ) : (
                                        <div className={`absolute inset-0 ${isActive ? "bg-white/20" : item.isAction ? "bg-white" : "bg-white/[0.05]"}`} />
                                    )}
                                </div>

                                {/* Overlay dot indicator when a selection is active */}
                                {iconNode && !isActive && (
                                    <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-white border border-black/30 z-20" />
                                )}

                                <item.icon
                                    size={item.isAction ? 24 : 20}
                                    strokeWidth={isActive ? 2.5 : 2}
                                    className={`relative z-10 ${item.isAction ? "text-black" : "text-white"} ${isActive ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" : "opacity-80"} ${isLoading && item.isAction ? "animate-spin" : ""}`}
                                />

                                {/* Active glow overlay */}
                                {isActive && (
                                    <div className="absolute inset-0 bg-white/10 animate-pulse" />
                                )}
                            </div>

                            <span className={`text-[8px] font-bold tracking-tight transition-all duration-300 ${isActive ? "text-white opacity-100" : "text-white/40 opacity-70 group-hover:text-white/90"}`}>
                                {item.label}
                            </span>

                            {/* Right side indicator bar */}
                            {isActive && (
                                <div className="absolute -right-0 top-1/2 -translate-y-1/2 w-[2px] h-6 bg-white rounded-l-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
