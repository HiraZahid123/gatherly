"use client";

import { useState } from "react";
import { Mail, Send, CheckCircle2, MessageSquare, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
    const [status, setStatus] = useState<"idle" | "sending" | "success">("idle");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("sending");
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        setStatus("success");
    };

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white selection:bg-green-500/30">
            {/* Background Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full" />
            </div>

            <div className="container mx-auto px-6 py-20 relative z-10">
                {/* Back Button */}
                <Link 
                    href="/help"
                    className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-12 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-bold uppercase tracking-widest">Back to Help Center</span>
                </Link>

                <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-20">
                    {/* Left: Content */}
                    <div className="flex-1 space-y-8">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Contact Support</span>
                            </div>
                            <h1 className="text-5xl lg:text-7xl font-black tracking-tight leading-[0.9]">
                                How can we <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-yellow-400 to-orange-400">help you?</span>
                            </h1>
                            <p className="text-lg text-white/40 max-w-md leading-relaxed">
                                Our team is here to help you create unforgettable events. Send us a message and we'll get back to you within 24 hours.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8">
                            <div className="p-8 bg-white/[0.03] border border-white/10 rounded-3xl space-y-4 hover:bg-white/[0.05] transition-colors">
                                <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center">
                                    <Mail className="w-6 h-6 text-green-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">Email us</h3>
                                    <p className="text-sm text-white/40">support@JollyWitMe.app</p>
                                </div>
                            </div>
                            <div className="p-8 bg-white/[0.03] border border-white/10 rounded-3xl space-y-4 hover:bg-white/[0.05] transition-colors">
                                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                                    <MessageSquare className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">Live Chat</h3>
                                    <p className="text-sm text-white/40">Coming soon</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Form */}
                    <div className="flex-1">
                        <div className="bg-white/[0.02] border border-white/10 rounded-[40px] p-8 lg:p-12 backdrop-blur-3xl relative overflow-hidden group">
                            {/* Form Accent Glow */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                            {status === "success" ? (
                                <div className="py-20 text-center space-y-6 animate-in zoom-in duration-500">
                                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto text-green-400">
                                        <CheckCircle2 className="w-10 h-10" />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-black uppercase italic">Message Sent!</h2>
                                        <p className="text-white/40 text-sm">We've received your inquiry and will be in touch shortly.</p>
                                    </div>
                                    <button 
                                        onClick={() => setStatus("idle")}
                                        className="text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
                                    >
                                        Send another message
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Full Name</label>
                                            <input 
                                                required
                                                type="text" 
                                                placeholder="e.g. Alex Rivera"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/10 outline-none focus:border-green-500/50 focus:bg-white/[0.08] transition-all"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Email Address</label>
                                            <input 
                                                required
                                                type="email" 
                                                placeholder="alex@example.com"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/10 outline-none focus:border-green-500/50 focus:bg-white/[0.08] transition-all"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Your Message</label>
                                            <textarea 
                                                required
                                                rows={4}
                                                placeholder="How can we help?"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/10 outline-none focus:border-green-500/50 focus:bg-white/[0.08] transition-all resize-none"
                                            />
                                        </div>
                                    </div>

                                    <button 
                                        type="submit"
                                        disabled={status === "sending"}
                                        className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 group/btn disabled:opacity-50"
                                    >
                                        {status === "sending" ? (
                                            <span className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <span>Send Message</span>
                                                <Send className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
