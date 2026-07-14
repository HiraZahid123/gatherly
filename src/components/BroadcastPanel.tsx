"use client";

import React, { useState } from "react";
import { Send, Users, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface BroadcastPanelProps {
    eventId: string;
    eventTitle: string;
}

export default function BroadcastPanel({ eventId, eventTitle }: BroadcastPanelProps) {
    const [message, setMessage] = useState("");
    const [audience, setAudience] = useState<"ALL" | "ACCEPTED" | "WAITLISTED">("ALL");
    const [isSending, setIsSending] = useState(false);
    const [lastSentCount, setLastSentCount] = useState<number | null>(null);

    const handleSend = async () => {
        if (!message.trim() || message.length < 10) {
            toast.error("Message must be at least 10 characters long");
            return;
        }

        setIsSending(true);
        try {
            const res = await fetch(`/api/events/${eventId}/broadcast`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message, audience })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to send broadcast");
            }

            toast.success(`Message sent to ${data.recipientCount} guests!`);
            setLastSentCount(data.recipientCount);
            setMessage(""); // Clear message after success
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
                <div className="flex items-start gap-3 text-white/80">
                    <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-sm space-y-1">
                        <p className="font-semibold text-white">Broadcast via Email + SMS</p>
                        <p>Your message will be sent by <strong>email</strong> to all chosen guests. Guests who provided a phone number will also receive an <strong>SMS</strong>.</p>
                    </div>
                </div>
            </div>


            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-white/60">Choose Audience</label>
                    <div className="grid grid-cols-3 gap-2">
                        {(["ALL", "ACCEPTED", "WAITLISTED"] as const).map((opt) => (
                            <button
                                key={opt}
                                onClick={() => setAudience(opt)}
                                className={`px-4 py-2.5 rounded-xl border text-sm font-bold transition-all ${audience === opt
                                        ? "bg-white border-white text-black shadow-lg shadow-white/10"
                                        : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
                                    }`}
                            >
                                {opt === "ALL" ? "All Guests" : opt === "ACCEPTED" ? "Going" : "Waitlisted"}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-white/60">Message</label>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${message.length < 10 ? "text-yellow-400 border-yellow-400/30 bg-yellow-400/5" : "text-green-400 border-green-400/30 bg-green-400/5"
                            }`}>
                            {message.length} chars
                        </span>
                    </div>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Hello everyone! Just a reminder that the event starts at 7 PM..."
                        className="w-full h-40 bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all resize-none"
                    />
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-400/5 border border-yellow-400/10">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
                    <p className="text-xs text-yellow-100/70 leading-relaxed">
                        <span className="font-bold text-yellow-400">Policy:</span> To prevent spam, you can send at most <span className="text-white font-bold">2 broadcasts per day</span>.
                    </p>
                </div>

                <button
                    onClick={handleSend}
                    disabled={isSending || message.length < 10}
                    className="w-full py-4 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 group shadow-xl shadow-white/5"
                >
                    {isSending ? (
                        <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    ) : (
                        <>
                            <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            Send Broadcast
                        </>
                    )}
                </button>

                {lastSentCount !== null && (
                    <div className="flex items-center justify-center gap-2 text-green-400 text-sm font-medium animate-in fade-in slide-in-from-bottom-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Success! Last send reached {lastSentCount} recipients.
                    </div>
                )}
            </div>
        </div>
    );
}
