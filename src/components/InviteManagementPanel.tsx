"use client";

import { useState, useEffect } from "react";
import { Mail, Phone, Trash2, RefreshCw, Loader2, Send, Copy, Check, MessageSquare, AlertCircle, CheckCircle2 } from "lucide-react";

interface Invitation {
    id: string;
    email: string | null;
    phone: string | null;
    token?: string;
    status: "PENDING" | "ACCEPTED" | "EXPIRED";
    sentAt: string | null;
    createdAt: string;
}

interface InviteManagementPanelProps {
    eventId?: string;
}

export default function InviteManagementPanel({ eventId }: InviteManagementPanelProps) {
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [eventInfo, setEventInfo] = useState<{ slug?: string; title?: string } | null>(null);
    const [activeTab, setActiveTab] = useState<"email" | "phone">("email");
    const [emailInput, setEmailInput] = useState("");
    const [phoneInput, setPhoneInput] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [resendingId, setResendingId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ type: "success" | "warning" | "error"; message: string } | null>(null);

    const fetchInvitations = async () => {
        try {
            const response = await fetch(`/api/events/${eventId}/invitations`);
            const data = await response.json();
            if (response.ok) {
                setInvitations(data.invitations || []);
                if (data.event) {
                    setEventInfo({ slug: data.event.slug, title: data.event.title });
                }
            }
        } catch (err) {
            console.error("Failed to fetch invitations", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (eventId) {
            fetchInvitations();
        }
    }, [eventId]);

    if (!eventId) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white/[0.02] rounded-3xl border border-dashed border-white/10 text-center space-y-4 animate-in fade-in duration-700">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-white/20" />
                </div>
                <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white/60">Ready to invite guests?</h4>
                    <p className="text-[10px] text-white/20 font-medium max-w-[200px] leading-relaxed uppercase tracking-widest">
                        Save your event as a draft or publish it first to enable invitations
                    </p>
                </div>
            </div>
        );
    }

    const getInviteUrl = (token?: string) => {
        if (!token) return "";
        let origin = typeof window !== "undefined" ? window.location.origin : "https://jollywitme.com";
        if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
            origin = "https://jollywitme.com";
        }
        const slug = eventInfo?.slug || "";
        return `${origin}/e/${slug}?invite=${token}`;
    };

    const handleCopyLink = async (invite: Invitation) => {
        const url = getInviteUrl(invite.token);
        if (!url) return;
        try {
            await navigator.clipboard.writeText(url);
            setCopiedId(invite.id);
            setTimeout(() => setCopiedId(null), 2000);
            setFeedback({ type: "success", message: `Personal invite link copied to clipboard!` });
        } catch (err) {
            console.error("Failed to copy link", err);
        }
    };

    const handleWhatsAppShare = (invite: Invitation) => {
        const url = getInviteUrl(invite.token);
        const cleanPhone = (invite.phone || "").replace(/\D/g, "");
        const title = eventInfo?.title || "this exclusive event";
        const text = encodeURIComponent(`Hi! You're invited to attend *${title}*! 🎉\n\nClick below to view the private event and RSVP:\n${url}`);
        const waUrl = cleanPhone
            ? `https://wa.me/${cleanPhone}?text=${text}`
            : `https://api.whatsapp.com/send?text=${text}`;
        window.open(waUrl, "_blank");
    };

    const handleSendInvites = async () => {
        const isEmail = activeTab === "email";
        const rawInput = isEmail ? emailInput : phoneInput;
        if (!rawInput.trim()) return;

        setIsSending(true);
        setFeedback(null);

        const items = rawInput.split(",").map(e => e.trim()).filter(Boolean);

        try {
            const body = isEmail
                ? { emails: items, phones: [] }
                : { emails: [], phones: items };

            const response = await fetch(`/api/events/${eventId}/invitations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (response.ok) {
                isEmail ? setEmailInput("") : setPhoneInput("");
                await fetchInvitations();

                const results: any[] = data.results || [];
                const alreadyInvited = results.filter(r => r.message === "Already invited");
                const successes = results.filter(r => r.status === "success" || r.status === "partial");

                if (alreadyInvited.length > 0 && successes.length === 0) {
                    setFeedback({
                        type: "warning",
                        message: `Already on the list: ${alreadyInvited.map(r => r.contact).join(", ")}. Use the copy link or resend button below.`
                    });
                } else if (alreadyInvited.length > 0) {
                    setFeedback({
                        type: "warning",
                        message: `Sent ${successes.length} new invite(s). Note: ${alreadyInvited.map(r => r.contact).join(", ")} was already invited.`
                    });
                } else {
                    setFeedback({
                        type: "success",
                        message: `Successfully created and sent ${successes.length} invitation(s)!`
                    });
                }
            } else {
                setFeedback({ type: "error", message: data.error || "Failed to send invitations" });
            }
        } catch (err) {
            setFeedback({ type: "error", message: "Connection error. Please try again." });
        } finally {
            setIsSending(false);
        }
    };

    const handleDelete = async (inviteId: string) => {
        if (!confirm("Are you sure you want to remove this invitation?")) return;

        try {
            const response = await fetch(`/api/events/${eventId}/invitations/${inviteId}`, {
                method: "DELETE"
            });

            if (response.ok) {
                setInvitations(prev => prev.filter(i => i.id !== inviteId));
                setFeedback({ type: "success", message: "Invitation removed." });
            }
        } catch (err) {
            console.error("Failed to delete invitation", err);
        }
    };

    const handleResend = async (inviteId: string) => {
        setResendingId(inviteId);
        setFeedback(null);
        try {
            const response = await fetch(`/api/events/${eventId}/invitations/${inviteId}/resend`, {
                method: "POST"
            });
            const data = await response.json();

            if (response.ok) {
                await fetchInvitations();
                setFeedback({ type: "success", message: "Invite resent successfully!" });
            } else {
                setFeedback({ type: "error", message: data.error || "Failed to resend invite" });
            }
        } catch (err) {
            console.error("Failed to resend invitation", err);
            setFeedback({ type: "error", message: "Failed to resend. Please try again." });
        } finally {
            setResendingId(null);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header info */}
            <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Invitations</h3>
                <p className="text-white/40 text-xs mt-1 leading-relaxed">
                    Private events can only be accessed with a personal invitation link. Invite your guests directly below.
                </p>
            </div>

            {/* Tab Toggle */}
            <div className="space-y-4">
                <div className="flex items-center gap-1 p-1 bg-white/[0.03] border border-white/10 rounded-xl w-fit">
                    <button
                        onClick={() => { setActiveTab("email"); setFeedback(null); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "email" ? "bg-white text-black shadow" : "text-white/40 hover:text-white"}`}
                    >
                        <Mail className="w-3.5 h-3.5" />
                        By Email
                    </button>
                    <button
                        onClick={() => { setActiveTab("phone"); setFeedback(null); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "phone" ? "bg-white text-black shadow" : "text-white/40 hover:text-white"}`}
                    >
                        <Phone className="w-3.5 h-3.5" />
                        By Phone / WhatsApp
                    </button>
                </div>

                {/* Input Row */}
                <div className="flex flex-col sm:flex-row gap-3">
                    {activeTab === "email" ? (
                        <input
                            type="text"
                            placeholder="guest@example.com, another@guest.com"
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSendInvites()}
                            className="flex-1 bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-sm outline-none focus:border-white/20 transition-all placeholder:text-white/20 text-white"
                        />
                    ) : (
                        <input
                            type="text"
                            placeholder="+1 555 000 1234, +234 801 234 5678"
                            value={phoneInput}
                            onChange={(e) => setPhoneInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSendInvites()}
                            className="flex-1 bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-sm outline-none focus:border-white/20 transition-all placeholder:text-white/20 text-white"
                        />
                    )}
                    <button
                        onClick={handleSendInvites}
                        disabled={isSending || !(activeTab === "email" ? emailInput : phoneInput).trim()}
                        className="px-6 py-3 bg-white text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/90 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center min-w-[150px]"
                    >
                        {isSending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <Send className="w-3.5 h-3.5 mr-2" />
                                <span>Send Invites</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Feedback Banner */}
                {feedback && (
                    <div className={`p-3 rounded-xl text-xs flex items-center gap-2.5 ${
                        feedback.type === "success" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" :
                        feedback.type === "warning" ? "bg-amber-500/10 border border-amber-500/20 text-amber-400" :
                        "bg-red-500/10 border border-red-500/20 text-red-400"
                    }`}>
                        {feedback.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                        <span>{feedback.message}</span>
                    </div>
                )}

                <p className="text-[10px] text-white/30 font-medium">
                    {activeTab === "email"
                        ? "Separate multiple emails with commas · Invitation emails are dispatched automatically."
                        : "Separate multiple numbers with commas · include country code e.g. +234 or +92"}
                </p>
            </div>

            {/* Guest List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Sent Invitations ({invitations.length})</h4>
                    <span className="text-[10px] text-white/30">Personal link attached to each invite</span>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="w-6 h-6 animate-spin text-white/10" />
                    </div>
                ) : invitations.length === 0 ? (
                    <div className="text-center py-10 bg-white/[0.02] rounded-2xl border border-dashed border-white/5">
                        <p className="text-xs text-white/20 font-bold uppercase tracking-widest">No invitations sent yet</p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
                        {invitations.map((invite) => (
                            <div
                                key={invite.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-white/[0.03] border border-white/5 rounded-2xl gap-3 group hover:bg-white/[0.05] transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                                        {invite.phone && !invite.email
                                            ? <Phone className="w-3.5 h-3.5 text-white/40" />
                                            : <Mail className="w-3.5 h-3.5 text-white/40" />
                                        }
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-white/90 truncate">
                                            {invite.email ?? invite.phone}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${
                                                invite.status === "ACCEPTED" ? "text-emerald-400" :
                                                invite.status === "EXPIRED" ? "text-red-400" : "text-amber-400/70"
                                            }`}>
                                                {invite.status}
                                            </span>
                                            <span className="text-[9px] text-white/30 font-medium uppercase tracking-wider">
                                                {invite.phone && !invite.email ? "SMS / WhatsApp" : "Email"}
                                            </span>
                                            {invite.sentAt && (
                                                <span className="text-[9px] text-white/20 font-medium">
                                                    · Sent {new Date(invite.sentAt).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 self-end sm:self-center">
                                    {/* Copy Personal Link */}
                                    {invite.token && (
                                        <button
                                            onClick={() => handleCopyLink(invite)}
                                            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5"
                                            title="Copy personal invite link"
                                        >
                                            {copiedId === invite.id ? (
                                                <>
                                                    <Check className="w-3 h-3 text-emerald-400" />
                                                    <span className="text-[10px] text-emerald-400">Copied</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-3 h-3 text-white/50" />
                                                    <span className="text-[10px]">Copy Link</span>
                                                </>
                                            )}
                                        </button>
                                    )}

                                    {/* Direct WhatsApp Share */}
                                    {invite.token && (
                                        <button
                                            onClick={() => handleWhatsAppShare(invite)}
                                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition-all flex items-center gap-1"
                                            title="Send via WhatsApp"
                                        >
                                            <MessageSquare className="w-3 h-3" />
                                            <span className="text-[10px]">WhatsApp</span>
                                        </button>
                                    )}

                                    {/* Resend button */}
                                    <button
                                        onClick={() => handleResend(invite.id)}
                                        disabled={resendingId === invite.id}
                                        className="p-2 text-white/30 hover:text-white hover:bg-white/5 rounded-lg transition-all disabled:opacity-50"
                                        title="Resend Invite"
                                    >
                                        {resendingId === invite.id ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin text-white/60" />
                                        ) : (
                                            <RefreshCw className="w-3.5 h-3.5" />
                                        )}
                                    </button>

                                    {/* Delete button */}
                                    <button
                                        onClick={() => handleDelete(invite.id)}
                                        className="p-2 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                        title="Remove Invite"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
