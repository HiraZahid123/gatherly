"use client";

import { motion } from "framer-motion";
import { Lock, Home, LogIn, Mail, ShieldAlert, UserCheck } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamically import InteractiveBackground (Three.js — client only)
const InteractiveBackground = dynamic(
    () => import("@/components/InteractiveBackground"),
    { ssr: false }
);

interface EventRestrictedProps {
    theme?: any;
    eventTitle?: string;
    userEmail?: string | null;
    isLoggedIn?: boolean;
    slug?: string;
}

export default function EventRestricted({
    theme,
    eventTitle,
    userEmail,
    isLoggedIn = false,
    slug = "",
}: EventRestrictedProps) {
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

    const hostSigninUrl = slug
        ? `/auth/signin?callbackUrl=${encodeURIComponent(`/e/${slug}`)}`
        : "/auth/signin";

    return (
        <div
            className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4 sm:p-6 relative overflow-hidden"
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
                className="relative z-10 w-full max-w-lg bg-black/60 backdrop-blur-2xl rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-10 border border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] text-center overflow-hidden"
            >
                {/* Background Glow */}
                <div
                    className="absolute -top-24 -left-24 w-48 h-48 rounded-full blur-[80px] opacity-20 pointer-events-none"
                    style={{ backgroundColor: primaryColor }}
                />

                {/* Lock Icon */}
                <div className="flex justify-center mb-6">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                        className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10 relative"
                    >
                        <Lock className="w-9 h-9 text-amber-400/90" />
                        <motion.div
                            animate={{ opacity: [0, 0.5, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 rounded-full border-2 border-amber-400/30"
                        />
                    </motion.div>
                </div>

                {/* Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/50 text-[10px] font-bold uppercase tracking-widest mb-4">
                    <ShieldAlert className="w-3 h-3 text-amber-400" />
                    <span>Private Event</span>
                </div>

                {/* Title */}
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mb-3 text-white">
                    This is a private event, you need to be invited to RSVP
                </h1>

                {/* Event Name Subhead */}
                {eventTitle && (
                    <p className="text-sm font-semibold text-white/40 mb-4 truncate">
                        {eventTitle}
                    </p>
                )}

                {/* Explanatory Message */}
                <p className="text-white/70 text-sm sm:text-base mb-6 font-normal leading-relaxed">
                    This event is strictly private. Only guests who have received a direct invitation from the host can view details and RSVP. Invitations are non-transferable and cannot be accessed simply by sharing the link.
                </p>

                {/* Info Callout Box */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left text-xs text-white/70 space-y-2 mb-6">
                    <div className="flex items-start gap-2.5">
                        <Mail className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <span className="font-bold text-white block mb-0.5">Were you invited by the host?</span>
                            <span>Please click the personal invitation link sent directly to your email or WhatsApp/SMS to access this event.</span>
                        </div>
                    </div>

                    {isLoggedIn && userEmail && (
                        <div className="pt-2 border-t border-white/5 flex items-start gap-2.5">
                            <UserCheck className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />
                            <div>
                                <span className="text-white/40 block">Currently signed in as:</span>
                                <span className="font-medium text-white/90">{userEmail}</span>
                                <p className="text-[11px] text-white/40 mt-0.5">
                                    This account is not on the invited guest list. If you were invited under a different address, please switch accounts.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                    <Link
                        href="/"
                        className="group relative flex items-center justify-center gap-2.5 px-6 py-3.5 bg-white text-black rounded-xl font-bold text-sm transition-all hover:bg-white/90 active:scale-[0.98]"
                    >
                        <Home className="w-4 h-4" />
                        <span>Back to Home</span>
                    </Link>

                    {isLoggedIn ? (
                        <Link
                            href={hostSigninUrl}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10 rounded-xl font-medium text-xs transition-all"
                        >
                            <LogIn className="w-3.5 h-3.5" />
                            <span>Switch Account or Host Sign In</span>
                        </Link>
                    ) : (
                        <Link
                            href={hostSigninUrl}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10 rounded-xl font-medium text-xs transition-all"
                        >
                            <LogIn className="w-3.5 h-3.5" />
                            <span>Host Sign In</span>
                        </Link>
                    )}
                </div>

                <p className="text-[10px] text-white/30 text-center mt-5">
                    Hosts: To invite guests to a private event, use the "Invite Guests" option inside your event settings.
                </p>
            </motion.div>

            {/* Subtle overlay */}
            <div className="fixed inset-0 pointer-events-none z-[5] mix-blend-overlay opacity-[0.03]">
                <div
                    className="absolute inset-0"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
                />
            </div>
        </div>
    );
}
