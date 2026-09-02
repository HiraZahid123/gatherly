"use client";

import React, { useState, useEffect } from "react";
import {
    X,
    Copy,
    Check,
    Share2,
    MessageCircle,
    Mail,
    Smartphone,
    QrCode,
    Sparkles,
    Calendar,
    MapPin,
    ExternalLink,
    Send,
} from "lucide-react";

interface ShareEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: {
        id?: string;
        title: string;
        slug: string;
        type?: string;
        isCard?: boolean;
        startDate?: string | Date;
        location?: string;
        hostName?: string;
        coverImage?: string;
    };
}

export default function ShareEventModal({ isOpen, onClose, event }: ShareEventModalProps) {
    const [copied, setCopied] = useState(false);
    const [showQr, setShowQr] = useState(false);
    const [eventUrl, setEventUrl] = useState("");
    const [hasNativeShare, setHasNativeShare] = useState(false);

    const isCard = event.type === "CARD" || (event as any).isCard;

    useEffect(() => {
        if (typeof window !== "undefined") {
            const origin = window.location.origin;
            const path = isCard ? `/c/${event.slug}` : `/e/${event.slug}`;
            setEventUrl(`${origin}${path}`);
            setHasNativeShare(typeof navigator !== "undefined" && !!navigator.share);
        }
    }, [event.slug, isCard]);

    if (!isOpen) return null;

    const formattedDate = event.startDate
        ? new Date(event.startDate).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
          })
        : "Date & Time TBD";

    const inviteText = isCard
        ? `💌 ${event.hostName ? `${event.hostName} sent you a special greeting card` : "You've received a special greeting card"}!\n\n"${event.title}"\n\n👉 Open your card here:\n${eventUrl}`
        : `🎉 You're invited to ${event.title}!\n\n📅 ${formattedDate}\n📍 ${event.location || "Location on event page"}\n\n👉 RSVP & view event details here:\n${eventUrl}`;

    const handleCopy = async () => {
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(eventUrl);
            } else {
                const textarea = document.createElement("textarea");
                textarea.value = eventUrl;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand("copy");
                document.body.removeChild(textarea);
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch (err) {
            console.error("Copy failed", err);
        }
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: event.title,
                    text: `You're invited to ${event.title}!`,
                    url: eventUrl,
                });
            } catch (err) {
                // User cancelled or share failed
                console.log("Share dismissed");
            }
        }
    };

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(inviteText)}`;
    const emailSubject = encodeURIComponent(`Invitation: ${event.title}`);
    const emailBody = encodeURIComponent(
        `Hi,\n\nYou're invited to ${event.title}!\n\nEvent details:\n📅 Date: ${formattedDate}\n📍 Location: ${event.location || "Specified in link"}\n\nRSVP & see who's coming here:\n${eventUrl}\n\nHope to see you there!`
    );
    const emailUrl = `mailto:?subject=${emailSubject}&body=${emailBody}`;
    const smsUrl = `sms:?&body=${encodeURIComponent(`You're invited to ${event.title}! RSVP here: ${eventUrl}`)}`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(eventUrl)}`;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/80 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal Dialog */}
            <div className="relative w-full max-w-lg bg-[#111114] border border-white/15 rounded-[32px] p-6 sm:p-8 shadow-2xl overflow-hidden z-10 text-white space-y-6 max-h-[90vh] overflow-y-auto">
                {/* Top Glowing Ambient */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-emerald-500/15 blur-3xl pointer-events-none rounded-full" />

                {/* Header */}
                <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                            <Share2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight text-white">{isCard ? "Share Card" : "Share Event"}</h2>
                            <p className="text-xs text-gray-400">{isCard ? "Send your card to friends & family" : "Invite your guests and friends"}</p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Event / Card Snapshot Card */}
                <div className="bg-[#18181c] border border-white/10 rounded-2xl p-4 space-y-2 relative z-10">
                    <h3 className="font-extrabold text-base text-white truncate">{event.title}</h3>
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-gray-400 font-medium">
                        {isCard ? (
                            <span className="flex items-center gap-1 text-emerald-400">
                                💌 Digital Greeting Card
                            </span>
                        ) : (
                            <>
                                <span className="flex items-center gap-1 text-emerald-400">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {formattedDate}
                                </span>
                                {event.location && (
                                    <span className="flex items-center gap-1 text-gray-300 truncate max-w-[200px]">
                                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                        {event.location}
                                    </span>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Native Share Button (if supported on mobile) */}
                {hasNativeShare && (
                    <button
                        onClick={handleNativeShare}
                        className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-black text-sm rounded-2xl flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all relative z-10"
                    >
                        <Share2 className="w-4 h-4" />
                        <span>Share via Mobile Apps...</span>
                    </button>
                )}

                {/* Share Channels Grid */}
                <div className="space-y-3 relative z-10">
                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">
                        Share Directly To:
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {/* WhatsApp */}
                        <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-4 bg-[#1a1a1e] hover:bg-[#25D366]/20 border border-white/5 hover:border-[#25D366]/40 rounded-2xl flex flex-col items-center justify-center gap-2 text-center group transition-all"
                        >
                            <div className="w-11 h-11 rounded-2xl bg-[#25D366]/20 text-[#25D366] flex items-center justify-center group-hover:scale-110 transition-transform">
                                <MessageCircle className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold text-gray-200 group-hover:text-[#25D366]">
                                WhatsApp
                            </span>
                        </a>

                        {/* Email */}
                        <a
                            href={emailUrl}
                            className="p-4 bg-[#1a1a1e] hover:bg-blue-500/20 border border-white/5 hover:border-blue-500/40 rounded-2xl flex flex-col items-center justify-center gap-2 text-center group transition-all"
                        >
                            <div className="w-11 h-11 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Mail className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold text-gray-200 group-hover:text-blue-300">
                                Email
                            </span>
                        </a>

                        {/* SMS / Messages */}
                        <a
                            href={smsUrl}
                            className="p-4 bg-[#1a1a1e] hover:bg-purple-500/20 border border-white/5 hover:border-purple-500/40 rounded-2xl flex flex-col items-center justify-center gap-2 text-center group transition-all"
                        >
                            <div className="w-11 h-11 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Smartphone className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold text-gray-200 group-hover:text-purple-300">
                                SMS Text
                            </span>
                        </a>

                        {/* QR Code Toggle */}
                        <button
                            type="button"
                            onClick={() => setShowQr(!showQr)}
                            className={`p-4 border rounded-2xl flex flex-col items-center justify-center gap-2 text-center transition-all ${
                                showQr
                                    ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                                    : "bg-[#1a1a1e] hover:bg-amber-500/20 border-white/5 hover:border-amber-500/40 text-gray-200 hover:text-amber-300"
                            }`}
                        >
                            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                                <QrCode className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold">QR Code</span>
                        </button>
                    </div>
                </div>

                {/* QR Code Display Drawer */}
                {showQr && (
                    <div className="p-6 bg-white rounded-3xl text-center space-y-3 animate-in zoom-in-95 duration-200">
                        <img
                            src={qrImageUrl}
                            alt="Event QR Code"
                            className="w-48 h-48 mx-auto object-contain rounded-xl"
                        />
                        <p className="text-xs text-black font-extrabold uppercase tracking-wider">
                            Scan to Open Event Page
                        </p>
                    </div>
                )}

                {/* Copy Link Section */}
                <div className="space-y-2 relative z-10">
                    <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400">
                        Event Link
                    </label>
                    <div className="flex items-center gap-2 bg-[#18181c] border border-white/10 rounded-2xl p-1.5 pl-4">
                        <input
                            type="text"
                            readOnly
                            value={eventUrl}
                            className="flex-1 bg-transparent text-xs font-mono text-gray-300 focus:outline-none truncate"
                        />
                        <button
                            onClick={handleCopy}
                            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                                copied
                                    ? "bg-emerald-500 text-black font-extrabold"
                                    : "bg-white/10 hover:bg-white/20 text-white"
                            }`}
                        >
                            {copied ? (
                                <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Copied!</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copy Link</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
