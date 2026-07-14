"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    X, CheckCircle2, QrCode, Calendar, Mail, ArrowRight, User, 
    Loader2, Info, Ticket, Sparkles, MapPin, Clock, Share2, 
    Plus, Users, ShieldCheck, AlarmClock, Check, HelpCircle, ChevronLeft,
    Download
} from "lucide-react";
import { VIBE_THEMES } from "@/lib/theme";
import { getCalendarLinks } from "@/lib/calendar";
import { Turnstile } from "@marsidev/react-turnstile";

interface RSVPModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: any;
    user?: any; // Current logged in user from session
    onRSVPSuccess?: (data: any) => void;
    myRSVP?: any;
    initialStatus?: "ACCEPTED" | "MAYBE" | "DECLINED" | null;
}

type Step = "INTENT" | "DETAILS" | "VERIFY" | "SUCCESS";

export default function RSVPModal({ isOpen, onClose, event, user, onRSVPSuccess, myRSVP, initialStatus }: RSVPModalProps) {
    const [step, setStep] = useState<Step>("INTENT");
    const [direction, setDirection] = useState(1); // 1 for forward, -1 for back
    const [status, setStatus] = useState<"ACCEPTED" | "MAYBE" | "DECLINED" | "WAITLISTED" | "PENDING" | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        name: user?.name || "",
        email: user?.email || "",
        otp: "",
        captchaToken: ""
    });

    const [rsvpResult, setRsvpResult] = useState<any>(null);
    const isDeadlinePassed = event.rsvpDeadline && new Date() > new Date(event.rsvpDeadline);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setStatus(null);
            setError("");
            setLoading(false);
            setRsvpResult(null);

            if (myRSVP) {
                setStep("SUCCESS");
                setStatus(myRSVP.status);
                setRsvpResult(myRSVP);
            } else if (initialStatus) {
                setStatus(initialStatus);
                if (user) {
                    // Auto-submit for authenticated users
                    const submitImmediate = async () => {
                        setLoading(true);
                        try {
                            const response = await fetch(`/api/events/${event.id}/rsvp`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    status: initialStatus,
                                    guestName: user.name || "",
                                    guestEmail: user.email || "",
                                }),
                            });
                            const data = await response.json();
                            if (data.success) {
                                setRsvpResult(data.rsvp);
                                setStatus(data.rsvp.status);
                                setStep("SUCCESS");
                                onRSVPSuccess?.(data);
                            } else {
                                setError(data.error || "Failed to submit RSVP");
                                setStep("INTENT");
                            }
                        } catch (err) {
                            setError("Network error. Please try again.");
                            setStep("INTENT");
                        } finally {
                            setLoading(false);
                        }
                    };
                    submitImmediate();
                } else if (initialStatus === "DECLINED") {
                    // For unauthenticated, they still need to provide details? 
                    // Actually, even declined needs a name/email usually to track.
                    // But if it's external, maybe we just want details.
                    setStep("DETAILS");
                } else {
                    setStep("DETAILS");
                }
            } else {
                setStep("INTENT");
            }
            if (user) {
                setFormData(prev => ({ ...prev, name: user.name || "", email: user.email || "" }));
            }
        }
    }, [isOpen, user, myRSVP, initialStatus, event.id]);

    const nextStep = (next: Step) => {
        setDirection(1);
        setStep(next);
    };

    const prevStep = (prev: Step) => {
        setDirection(-1);
        setStep(prev);
    };

    const cancelRSVP = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await fetch(`/api/events/${event.id}/rsvp`, {
                method: "DELETE"
            });
            const data = await response.json();
            if (data.success) {
                setStatus(null);
                setRsvpResult(null);
                onRSVPSuccess?.(data);
            } else {
                setError(data.error || "Failed to remove RSVP");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadQR = async () => {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${rsvpResult?.qrToken}`;
        try {
            const response = await fetch(qrUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Ticket-${event.title.replace(/\s+/g, '-')}.png`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error("Download failed:", err);
        }
    };

    const handleIntent = (selectedStatus: "ACCEPTED" | "MAYBE" | "DECLINED" | "PENDING") => {
        // 🔒 LOCK: Prevent changes if checked in
        if (myRSVP?.checkedIn) {
            setError("You have already checked in. Your RSVP status is now locked.");
            return;
        }

        const backendStatus = selectedStatus === "MAYBE" ? "PENDING" : selectedStatus;
        
        if (status === backendStatus) {
            if (user) {
                cancelRSVP();
            } else {
                setStatus(null);
            }
            return;
        }

        setStatus(backendStatus as any);
        if (selectedStatus === "DECLINED") {
            submitRSVP(selectedStatus);
        } else if (user) {
            submitRSVP(backendStatus);
        } else {
            nextStep("DETAILS");
        }
    };

    const sendVerification = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await fetch(`/api/events/${event.id}/rsvp/verify/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ guestEmail: formData.email }),
            });
            const data = await response.json();
            if (data.success) {
                nextStep("VERIFY");
            } else {
                setError(data.error || "Failed to send verification code");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const verifyOTP = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await fetch(`/api/events/${event.id}/rsvp/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    guestEmail: formData.email,
                    otp: formData.otp,
                    status: status,
                    guestName: formData.name,
                    captchaToken: formData.captchaToken
                }),
            });
            const data = await response.json();
            if (data.success) {
                setRsvpResult(data.rsvp);
                setStatus(data.rsvp.status);
                nextStep("SUCCESS");
                onRSVPSuccess?.(data);
            } else {
                setError(data.error || "Invalid verification code");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const submitRSVP = async (finalStatus: any) => {
        setLoading(true);
        setError("");
        try {
            const response = await fetch(`/api/events/${event.id}/rsvp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: finalStatus,
                    guestName: formData.name,
                    guestEmail: formData.email,
                    captchaToken: formData.captchaToken
                }),
            });
            const data = await response.json();
            if (data.success) {
                setRsvpResult(data.rsvp);
                setStatus(data.rsvp.status);
                nextStep("SUCCESS");
                onRSVPSuccess?.(data);
            } else {
                setError(data.error || "Failed to submit RSVP");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleDetailsSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email) {
            setError("Name and email are required");
            return;
        }
        sendVerification();
    };

    const handleCopyToken = () => {
        if (!rsvpResult?.qrToken) return;
        navigator.clipboard.writeText(rsvpResult.qrToken);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 50 : -50,
            opacity: 0
        }),
        center: {
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            x: direction < 0 ? 50 : -50,
            opacity: 0
        })
    };

    const theme = event?.theme || {};
    const primaryColor = theme.primaryColor || "#3b82f6";

    const calendarLinks = React.useMemo(() => {
        if (!event || (status !== "ACCEPTED" && status !== "MAYBE")) return null;
        try {
            return getCalendarLinks({
                title: event.title,
                description: event.description || `Event by ${event.host?.name || 'the host'}`,
                location: event.location || 'See event page for location',
                startDate: event.startDate,
                endDate: event.endDate
            });
        } catch (e) {
            console.error("Failed to generate calendar links", e);
            return null;
        }
    }, [event, status]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-[420px] bg-[#0a0a0b] border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] relative"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    aria-label="Close modal"
                    className="absolute top-6 right-6 z-20 text-white/40 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-6 relative z-10 flex flex-col justify-center">
                    <AnimatePresence mode="wait" custom={direction}>
                        {step === "INTENT" && (
                            <motion.div
                                key="intent"
                                custom={direction}
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="space-y-10"
                            >
                                {/* Deadline Warning */}
                                {isDeadlinePassed && !myRSVP && (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3 mb-6">
                                        <AlarmClock className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                        <div className="space-y-1 text-left">
                                            <p className="text-sm font-bold text-red-500">RSVP Deadline Passed</p>
                                            <p className="text-[11px] text-red-500/60 leading-relaxed uppercase tracking-[0.05em]">
                                                The deadline was {new Date(event.rsvpDeadline).toLocaleString()}. Your RSVP may not be accepted.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="text-center space-y-4">
                                    <h2 className="text-4xl sm:text-5xl font-[900] tracking-tight text-white uppercase leading-none">
                                        You're Invited
                                    </h2>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
                                        Reply to {event?.host?.name || "The Host"}
                                    </p>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => handleIntent("ACCEPTED")}
                                        className={`w-full h-14 rounded-xl border flex items-center px-6 transition-all active:scale-[0.98] group ${
                                            status === "ACCEPTED" 
                                                ? "bg-white text-black border-white" 
                                                : "bg-white/5 border-white/10 hover:border-white/20"
                                        }`}
                                    >
                                        <div className={`w-2 h-2 rounded-full mr-4 ${status === "ACCEPTED" ? "bg-black" : "bg-green-500"}`} />
                                        <span className="font-bold uppercase tracking-widest text-[10px]">I'm Going</span>
                                        <Check className={`ml-auto w-4 h-4 ${status === "ACCEPTED" ? "text-black" : "text-white/20"}`} />
                                    </button>

                                    <button
                                        onClick={() => handleIntent("MAYBE")}
                                        className={`w-full h-14 rounded-xl border flex items-center px-6 transition-all active:scale-[0.98] group ${
                                            status === "MAYBE" 
                                                ? "bg-white text-black border-white" 
                                                : "bg-white/5 border-white/10 hover:border-white/20"
                                        }`}
                                    >
                                        <div className={`w-2 h-2 rounded-full mr-4 ${status === "MAYBE" ? "bg-black" : "bg-amber-500"}`} />
                                        <span className="font-bold uppercase tracking-widest text-[10px]">Maybe</span>
                                        <HelpCircle className={`ml-auto w-4 h-4 ${status === "MAYBE" ? "text-black" : "text-white/20"}`} />
                                    </button>

                                    <button
                                        onClick={() => handleIntent("DECLINED")}
                                        className={`w-full h-14 rounded-xl border flex items-center px-6 transition-all active:scale-[0.98] group ${
                                            status === "DECLINED" 
                                                ? "bg-white text-black border-white" 
                                                : "bg-white/5 border-white/10 hover:border-white/20"
                                        }`}
                                    >
                                        <div className={`w-2 h-2 rounded-full mr-4 ${status === "DECLINED" ? "bg-black" : "bg-rose-500"}`} />
                                        <span className="font-bold uppercase tracking-widest text-[10px]">Can't Make It</span>
                                        <X className={`ml-auto w-4 h-4 ${status === "DECLINED" ? "text-black" : "text-white/20"}`} />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === "DETAILS" && (
                            <motion.div
                                key="details"
                                custom={direction}
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="space-y-10"
                            >
                                <div className="space-y-1">
                                    <h2 className="text-xl font-bold tracking-tight text-white uppercase">
                                        Your Details
                                    </h2>
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/20">Finalize your RSVP</p>
                                </div>

                                <form onSubmit={handleDetailsSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 px-1">Your Name</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-white/60 transition-colors" />
                                            <input
                                                autoFocus
                                                type="text"
                                                required
                                                placeholder="Full Name"
                                                value={formData.name}
                                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 focus:bg-white/10 focus:border-white/20 outline-none text-white text-sm transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 px-1">Email Address</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-white/60 transition-colors" />
                                            <input
                                                type="email"
                                                required
                                                placeholder="email@example.com"
                                                value={formData.email}
                                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 focus:bg-white/10 focus:border-white/20 outline-none text-white text-sm transition-all"
                                            />
                                        </div>
                                    </div>

                                    {error && <p className="text-rose-500 text-sm font-bold text-center">{error}</p>}

                                    <div className="flex justify-center py-2">
                                        <Turnstile
                                            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"}
                                            onSuccess={(token) => setFormData(prev => ({ ...prev, captchaToken: token }))}
                                            options={{ theme: 'dark' }}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || (!user && !formData.captchaToken)}
                                        className="w-full h-12 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-white/90 active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue"}
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {step === "VERIFY" && (
                            <motion.div
                                key="verify"
                                custom={direction}
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="space-y-10"
                            >
                                <div className="text-center space-y-2">
                                    <h2 className="text-xl font-bold tracking-tight text-white uppercase">
                                        Verify Email
                                    </h2>
                                    <p className="text-white/40 font-medium text-[10px] uppercase tracking-widest leading-loose">
                                        Check <span className="text-white">{formData.email}</span>
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex justify-center">
                                        <input
                                            autoFocus
                                            type="text"
                                            maxLength={6}
                                            placeholder="000000"
                                            value={formData.otp}
                                            onChange={(e) => setFormData(prev => ({ ...prev, otp: e.target.value.replace(/\D/g, '') }))}
                                            className="w-40 h-16 bg-white/5 border border-white/10 rounded-xl text-center text-3xl font-bold tracking-[0.2em] outline-none focus:bg-white/10 focus:border-white/20 transition-all text-white placeholder:text-white/10"
                                        />
                                    </div>

                                    {error && <p className="text-rose-500 text-sm font-bold text-center">{error}</p>}

                                    <button
                                        onClick={verifyOTP}
                                        disabled={loading || formData.otp.length !== 6}
                                        className="w-full h-12 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-white/90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & RSVP"}
                                    </button>

                                    <p className="text-center">
                                        <button
                                            onClick={sendVerification}
                                            className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                                        >
                                            Didn't get the code? Resend
                                        </button>
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {step === "SUCCESS" && (
                            <motion.div
                                key="success"
                                custom={direction}
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="text-center space-y-8"
                            >
                                <div className="space-y-6">
                                    {/* Status & Message */}
                                    <div className="space-y-2">
                                        <div className="flex items-baseline justify-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${
                                                status === "ACCEPTED" ? "bg-green-500" :
                                                status === "MAYBE" ? "bg-amber-500" :
                                                status === "WAITLISTED" ? "bg-emerald-500" :
                                                "bg-white"
                                            }`} />
                                            <h2 className="text-2xl font-bold tracking-tight text-white uppercase">
                                                {status === "ACCEPTED" ? "You're In!" :
                                                 status === "MAYBE" || status === "PENDING" ? "Sorted!" :
                                                 status === "WAITLISTED" ? "Waitlisted" : "Done!"}
                                            </h2>
                                        </div>
                                        
                                        <p className="text-white/40 font-medium max-w-[240px] mx-auto text-[10px] leading-[1.4]">
                                            {status === "ACCEPTED" ? (
                                                <>Ticket sent to <span className="text-white font-bold">{formData.email}</span></>
                                            ) : status === "MAYBE" || status === "PENDING" ? (
                                                <>Provisional ticket sent to <span className="text-white font-bold">{formData.email}</span></>
                                            ) : status === "WAITLISTED" ? (
                                                <>Position <span className="text-white font-bold">#{rsvpResult?.waitlistPosition || "1"}</span> on the list.</>
                                            ) : (
                                                "Thanks for letting us know."
                                            )}
                                        </p>
                                    </div>

                                    {/* Simple QR Area */}
                                    {(status === "ACCEPTED" || status === "MAYBE" || status === "PENDING") && (
                                        <div className="pt-0 flex flex-col items-center gap-4">
                                            <div className="bg-white p-2.5 rounded-2xl shadow-2xl">
                                                <img
                                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${rsvpResult?.qrToken}`}
                                                    alt="Entry QR"
                                                    className="w-44 h-44 sm:w-48 sm:h-48"
                                                />
                                            </div>

                                            <button
                                                onClick={handleDownloadQR}
                                                className="flex items-center gap-2 px-3.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[9px] font-bold uppercase tracking-widest text-white/60 hover:text-white transition-all"
                                            >
                                                <Download className="w-3 h-3" />
                                                Download Ticket
                                            </button>

                                            <div className="flex justify-center items-center gap-4 text-[9px] font-black uppercase tracking-widest text-white/20">
                                                <a href={calendarLinks?.google} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Google</a>
                                                <a href={calendarLinks?.ics} className="hover:text-white transition-colors">Apple</a>
                                                <a href={calendarLinks?.outlook} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Outlook</a>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-3 pt-2">
                                        <button
                                            onClick={onClose}
                                            className="w-full h-12 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold uppercase tracking-widest text-white text-[10px] transition-all"
                                        >
                                            Dismiss
                                        </button>

                                        <button
                                            onClick={() => setStep("INTENT")}
                                            className="text-[9px] font-bold uppercase tracking-widest text-white/10 hover:text-white/40 transition-colors mx-auto block"
                                        >
                                            Change Status
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
