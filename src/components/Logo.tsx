import React from "react";
import { Sparkles, Wine, PartyPopper } from "lucide-react";

interface LogoProps {
    className?: string;
    variant?: "default" | "neon" | "elegant";
    lightMode?: boolean;
}

export function Logo({ className = "", variant = "default", lightMode = false }: LogoProps) {
    if (variant === "neon") {
        const textGradient = lightMode 
            ? "from-green-700 via-green-500 to-green-700" 
            : "from-green-400 via-white to-green-400";
            
        const ringGradient = "from-green-500 via-white to-green-500";
        
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <div className={`relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr ${ringGradient} p-[2px] shadow-[0_0_15px_rgba(34,197,94,0.4)]`}>
                    <div className="w-full h-full bg-[#0a0a0b] rounded-full flex items-center justify-center">
                        <PartyPopper className="w-4 h-4 text-green-400" />
                    </div>
                </div>
                <span className={`text-2xl font-black tracking-tighter bg-gradient-to-r ${textGradient} bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]`}>
                    JollyWitMe
                </span>
            </div>
        );
    }

    if (variant === "elegant") {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <Wine className={`w-6 h-6 ${lightMode ? 'text-black' : 'text-amber-400'}`} strokeWidth={1.5} />
                <span className={`text-2xl font-serif italic font-bold tracking-tight ${lightMode ? 'text-black' : 'text-white'}`}>
                    JollyWitMe
                </span>
            </div>
        );
    }

    // Default variant
    return (
        <div className={`flex items-center gap-1.5 ${className}`}>
            <Sparkles className="w-6 h-6 text-green-400" />
            <span className={`text-2xl font-extrabold tracking-tight ${lightMode ? 'text-black' : 'text-white'}`}>
                JollyWitMe
            </span>
        </div>
    );
}

export default Logo;
