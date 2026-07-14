"use client";

import { motion } from "framer-motion";
import { Lock, Home, LogIn } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamically import InteractiveBackground (Three.js — client only)
const InteractiveBackground = dynamic(
    () => import("@/components/InteractiveBackground"),
    { ssr: false }
);

interface EventRestrictedProps {
    theme?: any;
}

export default function EventRestricted({ theme }: EventRestrictedProps) {
    const backgroundTheme = theme?.backgroundTheme || "";
    const primaryColor = theme?.primaryColor || "#3b82f6";

    const INTERACTIVE_THEMES = ['streak', 'meadow', 'crystal', 'waves'];
    const has3DTheme = backgroundTheme && INTERACTIVE_THEMES.includes(backgroundTheme);

    let bgStyle = has3DTheme ? {} : {
        background: `radial-gradient(circle at 50% 50%, ${primaryColor} 0%, #000000 100%)`
    };

    if (backgroundTheme.startsWith("custom-gradient:")) {
        const color = backgroundTheme.split(":")[1];
        bgStyle = {
            background: `linear-gradient(90deg, ${color} 0%, #ffffff 50%, ${color} 100%)`
        };
    }

    return (
        <div
            className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6 relative overflow-hidden"
            style={bgStyle}
        >
            {has3DTheme && (
                <InteractiveBackground
                    currentTheme={backgroundTheme}
                    currentEffect={theme?.effect}
                />
            )}

            {/* Glassmorphism Card */}
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-full max-w-lg bg-black/40 backdrop-blur-2xl rounded-[2.5rem] p-10 border border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] text-center overflow-hidden"
            >
                {/* Background Glow */}
                <div
                    className="absolute -top-24 -left-24 w-48 h-48 rounded-full blur-[80px] opacity-20 pointer-events-none"
                    style={{ backgroundColor: primaryColor }}
                />

                <div className="flex justify-center mb-10">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 15 }}
                        className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center border border-white/10 relative"
                    >
                        <Lock className="w-10 h-10 text-white/80" />
                        <motion.div
                            animate={{ opacity: [0, 0.5, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 rounded-full border-2 border-white/20"
                        />
                    </motion.div>
                </div>

                <h1 className="text-3xl font-black uppercase tracking-[0.2em] mb-4 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
                    Invite Only
                </h1>

                <p className="text-white/60 text-lg mb-10 font-medium leading-relaxed">
                    This event is private. You need an invitation to join. If you've been invited via email, please sign in.
                </p>

                <div className="flex flex-col gap-4">
                    <Link
                        href="/auth/signin"
                        className="group relative flex items-center justify-center gap-3 px-8 py-4 bg-white text-black rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
                    >
                        <LogIn className="w-5 h-5" />
                        <span>Sign In to Access</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    </Link>

                    <Link
                        href="/"
                        className="flex items-center justify-center gap-3 px-8 py-4 bg-white/5 text-white/80 border border-white/10 rounded-2xl font-bold transition-all hover:bg-white/10 hover:text-white"
                    >
                        <Home className="w-5 h-5" />
                        <span>Back to Home</span>
                    </Link>
                </div>
            </motion.div>

            {/* Subtle floating particles or grain can also be added here if desired */}
            <div className={`fixed inset-0 pointer-events-none z-[5] mix-blend-overlay opacity-[0.03] transition-opacity duration-1000`}>
                <div
                    className="absolute inset-0"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
                />
            </div>
        </div>
    );
}
