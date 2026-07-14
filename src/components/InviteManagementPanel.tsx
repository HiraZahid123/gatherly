"use client";

import { useState, useEffect } from "react";
import { Mail, Phone, Plus, Trash2, RefreshCw, Loader2, Send, Info } from "lucide-react";

interface Invitation {
    id: string;
    email: string | null;
    phone: string | null;
    status: "PENDING" | "ACCEPTED" | "EXPIRED";
    sentAt: string | null;
    createdAt: string;
}

interface InviteManagementPanelProps {
    eventId?: string;
}

export default function InviteManagementPanel({ eventId }: InviteManagementPanelProps) {
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [activeTab, setActiveTab] = useState<"email" | "phone">("email");
    const [emailInput, setEmailInput] = useState("");
    const [phoneInput, setPhoneInput] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPaid, setIsPaid] = useState(false);
    const [stripeConnected, setStripeConnected] = useState(true);
    const [isConnectingStripe, setIsConnectingStripe] = useState(false);

    const fetchInvitations = async () => {
        try {
            const response = await fetch(`/api/events/${eventId}/invitations`);
            const data = await response.json();
            if (response.ok) {
                setInvitations(data.invitations);
                if (data.event) {
                    setIsPaid(!!data.event.isPaid);
                    setStripeConnected(!!data.event.stripeConnected);
                }
            }
        } catch (err) {
            console.error("Failed to fetch invitations", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnectStripe = async () => {
        setIsConnectingStripe(true);
        try {
            const res = await fetch("/api/stripe/connect/onboard", { method: "POST" });
            const { url, error: err } = await res.json();
            if (url) {
                window.location.href = url;
            } else {
                setError(err || "Failed to start Stripe Connect onboarding.");
            }
        } catch (err) {
            setError("Connection error during Stripe Connect onboarding.");
        } finally {
            setIsConnectingStripe(false);
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

    const handleSendInvites = async () => {
        const isEmail = activeTab === "email";
        const rawInput = isEmail ? emailInput : phoneInput;
        if (!rawInput.trim()) return;

        setIsSending(true);
        setError(null);

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
                fetchInvitations();
            } else {
                setError(data.error || "Failed to send invitations");
            }
        } catch (err) {
            setError("Connection error");
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
            }
        } catch (err) {
            console.error("Failed to delete invitation", err);
        }
    };

    const handleResend = async (inviteId: string) => {
        try {
            const response = await fetch(`/api/events/${eventId}/invitations/${inviteId}/resend`, {
                method: "POST"
            });

            if (response.ok) {
                fetchInvitations();
                alert("Invite resent successfully!");
            }
        } catch (err) {
            console.error("Failed to resend invitation", err);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {isPaid && !stripeConnected && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                            <Info className="w-5 h-5 text-red-400" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-xs font-black uppercase tracking-widest text-red-400">Stripe Setup Required</h4>
                            <p className="text-white/60 text-[11px] leading-relaxed max-w-xl">
                                This is a paid event. To invite guests and sell tickets, you must first connect your Stripe account so you can accept payments and receive payouts.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleConnectStripe}
                        disabled={isConnectingStripe}
                        className="px-5 py-2.5 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all active:scale-95 disabled:opacity-50 shrink-0 self-start md:self-auto flex items-center gap-1.5"
                    >
                        {isConnectingStripe ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <>Connect Stripe</>
                        )}
                    </button>
                </div>
            )}

            {/* Tab Toggle */}
            <div className="space-y-4">
                <div className="flex items-center gap-1 p-1 bg-white/[0.03] border border-white/10 rounded-xl w-fit">
                    <button
                        onClick={() => { setActiveTab("email"); setError(null); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "email" ? "bg-white text-black shadow" : "text-white/40 hover:text-white"}`}
                    >
                        <Mail className="w-3.5 h-3.5" />
                        By Email
                    </button>
                    <button
                        onClick={() => { setActiveTab("phone"); setError(null); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "phone" ? "bg-white text-black shadow" : "text-white/40 hover:text-white"}`}
                    >
                        <Phone className="w-3.5 h-3.5" />
                        By Phone
                    </button>
                </div>

                {/* Input Row */}
                <div className="flex flex-col sm:flex-row gap-3">
                    {activeTab === "email" ? (
                        <input
                            type="text"
                            placeholder={isPaid && !stripeConnected ? "Stripe setup required to invite guests" : "guest@example.com, another@guest.com"}
                            value={emailInput}
                            disabled={isPaid && !stripeConnected}
                            onChange={(e) => setEmailInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSendInvites()}
                            className="flex-1 bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-sm outline-none focus:border-white/20 transition-all placeholder:text-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    ) : (
                        <input
                            type="text"
                            placeholder={isPaid && !stripeConnected ? "Stripe setup required to invite guests" : "+1 555 000 1234, +44 7700 900123"}
                            value={phoneInput}
                            disabled={isPaid && !stripeConnected}
                            onChange={(e) => setPhoneInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSendInvites()}
                            className="flex-1 bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-sm outline-none focus:border-white/20 transition-all placeholder:text-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    )}
                    <button
                        onClick={handleSendInvites}
                        disabled={isSending || isPaid && !stripeConnected || !(activeTab === "email" ? emailInput : phoneInput).trim()}
                        className="px-6 py-3 bg-white text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/90 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center min-w-[140px]"
                    >
                        {isSending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <Send className="w-3.5 h-3.5 mr-2" />
                                {activeTab === "email" ? "Send Invites" : "Send SMS"}
                            </>
                        )}
                    </button>
                </div>

                {error && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest">{error}</p>}
                <p className="text-[10px] text-white/20 font-medium">
                    {activeTab === "email"
                        ? "Separate multiple emails with commas"
                        : "Separate multiple numbers with commas · include country code e.g. +1"}
                </p>
            </div>

            {/* Guest List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Sent Invitations ({invitations.length})</h4>
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
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {invitations.map((invite) => (
                            <div
                                key={invite.id}
                                className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-2xl group hover:bg-white/[0.05] transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                                        {invite.phone && !invite.email
                                            ? <Phone className="w-3.5 h-3.5 text-white/20" />
                                            : <Mail className="w-3.5 h-3.5 text-white/20" />
                                        }
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white/80">
                                            {invite.email ?? invite.phone}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${invite.status === "ACCEPTED" ? "text-green-500" :
                                                invite.status === "EXPIRED" ? "text-red-500" : "text-white/30"
                                                }`}>
                                                {invite.status}
                                            </span>
                                            <span className="text-[9px] text-white/20 font-medium uppercase tracking-wider">
                                                {invite.phone && !invite.email ? "SMS" : "Email"}
                                            </span>
                                            {invite.sentAt && (
                                                <span className="text-[9px] text-white/10 font-medium">
                                                    Sent {new Date(invite.sentAt).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleResend(invite.id)}
                                        className="p-2 text-white/20 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                                        title="Resend Invite"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(invite.id)}
                                        className="p-2 text-white/20 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all"
                                        title="Remove Invite"
                                    >
                                        <Trash2 className="w-4 h-4" />
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
