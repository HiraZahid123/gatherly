"use client";

import { useState } from "react";
import {
    Mail,
    Send,
    CheckCircle2,
    MessageSquare,
    ArrowLeft,
    Clock,
    Sparkles,
    Shield,
    HelpCircle,
    ChevronDown,
    Phone,
    User,
    PartyPopper,
    Zap,
    ExternalLink,
    AlertCircle,
    Loader2,
} from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
    { id: "events", label: "Event Creation & Themes", icon: "🎉" },
    { id: "whatsapp", label: "WhatsApp & Invites", icon: "📲" },
    { id: "billing", label: "Billing & Tickets", icon: "💳" },
    { id: "tech", label: "Technical Support", icon: "🛠️" },
    { id: "partner", label: "Partnerships", icon: "🤝" },
    { id: "general", label: "General Inquiries", icon: "💬" },
];

const FAQS = [
    {
        q: "How fast will I receive a reply from support?",
        a: "Our dedicated support team reviews inquiries around the clock. You will typically receive a detailed reply within 2 to 4 hours, and guaranteed within 24 hours.",
    },
    {
        q: "How does the WhatsApp automated RSVP bot work?",
        a: "JollyWitMe connects directly to WhatsApp so your guests receive beautiful instant RSVP confirmations, calendar reminders, and broadcast updates without downloading any app.",
    },
    {
        q: "Can I customize templates with my own music, vibe, and poster?",
        a: "Yes! Every template in our Trending library allows you to upload custom posters, choose 3D dynamic atmospheric effects (balloons, confetti, neon glow), and select tailored vibe presets.",
    },
    {
        q: "Where can I find tutorials on managing guest lists?",
        a: "Check out our Help Center at /help for step-by-step guides on collecting guest RSVPs, approving attendee lists, ticket tiers, and exporting guest CSV spreadsheets.",
    },
];

export default function ContactPage() {
    const [selectedCategory, setSelectedCategory] = useState("Event Creation & Themes");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
    });
    const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        if (status === "error") setStatus("idle");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("sending");
        setErrorMessage("");

        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    category: selectedCategory,
                    subject: formData.subject || `${selectedCategory} Inquiry`,
                    message: formData.message,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to send your message. Please try again.");
            }

            setStatus("success");
            setFormData({
                name: "",
                email: "",
                phone: "",
                subject: "",
                message: "",
            });
        } catch (err: any) {
            console.error("Contact Form Submission Error:", err);
            setStatus("error");
            setErrorMessage(err.message || "An unexpected error occurred. Please try again or email us directly.");
        }
    };

    return (
        <main className="min-h-screen bg-[#070709] text-white selection:bg-emerald-500/30 relative overflow-hidden font-sans">
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-600/10 blur-[150px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-green-600/10 blur-[150px] rounded-full" />
                <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-teal-500/5 blur-[180px] rounded-full" />
            </div>

            <div className="container mx-auto px-6 pt-28 pb-24 relative z-10 max-w-7xl">
                {/* Back Link */}
                <div className="mb-10">
                    <Link
                        href="/help"
                        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 group"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                        <span>Help Center & Guides</span>
                    </Link>
                </div>

                {/* Hero Header */}
                <div className="max-w-3xl mb-16 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-bold uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        We're Here to Help
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.05] text-white">
                        Get in touch with the <br />
                        <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400 bg-clip-text text-transparent">
                            JollyWitMe Team
                        </span>
                    </h1>
                    <p className="text-gray-400 text-base sm:text-lg leading-relaxed max-w-2xl">
                        Have a question about hosting an event, custom themes, or technical assistance? Send us a message and our team will get back to you within 24 hours.
                    </p>
                </div>

                {/* Main Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
                    {/* Left Column: Direct Support Cards & FAQs */}
                    <div className="lg:col-span-5 space-y-8">
                        {/* Direct Channel Cards */}
                        <div className="space-y-4">
                            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">
                                Direct Channels
                            </h2>

                            {/* Email Support Card */}
                            <a
                                href="mailto:support@jollywitme.com"
                                className="p-6 bg-[#111114] border border-white/10 rounded-3xl flex items-start gap-4 hover:border-emerald-500/40 hover:bg-[#151518] transition-all group block shadow-xl"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 text-emerald-400 group-hover:scale-110 transition-transform">
                                    <Mail className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-base text-white">Email Support</h3>
                                        <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-emerald-400 transition-colors" />
                                    </div>
                                    <p className="text-sm font-mono text-emerald-400 font-semibold mt-0.5">
                                        support@jollywitme.com
                                    </p>
                                    <p className="text-xs text-gray-400 mt-2">
                                        Direct inbox for event inquiries, troubleshooting, and enterprise partnerships.
                                    </p>
                                </div>
                            </a>

                            {/* Response Guarantee Card */}
                            <div className="p-6 bg-[#111114] border border-white/10 rounded-3xl flex items-start gap-4 shadow-xl">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 text-blue-400">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base text-white">Fast Response Window</h3>
                                    <p className="text-xs text-blue-300 font-semibold mt-0.5">Usually under 2–4 hours</p>
                                    <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                                        Our support staff operates 7 days a week to ensure your events run without a hitch.
                                    </p>
                                </div>
                            </div>

                            {/* Self-Serve Help Center Card */}
                            <Link
                                href="/help"
                                className="p-6 bg-[#111114] border border-white/10 rounded-3xl flex items-start gap-4 hover:border-white/20 hover:bg-[#151518] transition-all group block shadow-xl"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0 text-purple-400 group-hover:scale-110 transition-transform">
                                    <HelpCircle className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-base text-white">Help Center & Articles</h3>
                                        <ArrowLeft className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors rotate-180" />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Browse step-by-step guides on templates, RSVP tracking, custom themes, and guest list exports.
                                    </p>
                                </div>
                            </Link>
                        </div>

                        {/* Quick FAQs */}
                        <div className="space-y-4 pt-4">
                            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">
                                Frequently Asked Questions
                            </h2>

                            <div className="space-y-3">
                                {FAQS.map((faq, index) => {
                                    const isOpen = openFaq === index;
                                    return (
                                        <div
                                            key={index}
                                            className="bg-[#111114] border border-white/5 rounded-2xl overflow-hidden transition-colors hover:border-white/10"
                                        >
                                            <button
                                                type="button"
                                                onClick={() => setOpenFaq(isOpen ? null : index)}
                                                className="w-full p-4 text-left flex items-center justify-between gap-3 text-sm font-bold text-gray-200 hover:text-white"
                                            >
                                                <span>{faq.q}</span>
                                                <ChevronDown
                                                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
                                                        isOpen ? "rotate-180 text-emerald-400" : ""
                                                    }`}
                                                />
                                            </button>
                                            {isOpen && (
                                                <div className="px-4 pb-4 text-xs text-gray-400 leading-relaxed border-t border-white/5 pt-3 animate-in fade-in duration-200">
                                                    {faq.a}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Interactive Contact Form */}
                    <div className="lg:col-span-7">
                        <div className="bg-[#111114]/90 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 sm:p-12 shadow-2xl relative overflow-hidden">
                            {/* Accent Spotlight */}
                            <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                            {status === "success" ? (
                                <div className="py-16 text-center space-y-6 animate-in zoom-in-95 duration-500">
                                    <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400 border border-emerald-500/40 animate-pulse">
                                        <CheckCircle2 className="w-12 h-12" />
                                    </div>
                                    <div className="space-y-3 max-w-md mx-auto">
                                        <h2 className="text-3xl font-black text-white tracking-tight">
                                            Message Received! 🎉
                                        </h2>
                                        <p className="text-gray-400 text-sm leading-relaxed">
                                            Thank you for reaching out. We have sent a confirmation receipt to your inbox and our support team at{" "}
                                            <strong className="text-emerald-400">support@jollywitme.com</strong> will respond within 24 hours.
                                        </p>
                                    </div>
                                    <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setStatus("idle")}
                                            className="px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl text-xs font-bold uppercase tracking-wider text-white transition-all"
                                        >
                                            Send Another Message
                                        </button>
                                        <Link
                                            href="/explore"
                                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-2xl text-xs font-bold uppercase tracking-wider text-white transition-all shadow-lg shadow-emerald-600/20"
                                        >
                                            Explore Trending Events
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-7 relative z-10">
                                    <div>
                                        <h2 className="text-2xl font-black text-white tracking-tight">Send Us a Message</h2>
                                        <p className="text-gray-400 text-xs mt-1">
                                            Fill out the form below and we'll route your ticket to the right specialist.
                                        </p>
                                    </div>

                                    {/* Topic / Category Chips */}
                                    <div className="space-y-2.5">
                                        <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400">
                                            Select Topic / Category
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {CATEGORIES.map((cat) => {
                                                const isSelected = selectedCategory === cat.label;
                                                return (
                                                    <button
                                                        key={cat.id}
                                                        type="button"
                                                        onClick={() => setSelectedCategory(cat.label)}
                                                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                                                            isSelected
                                                                ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 font-extrabold"
                                                                : "bg-white/5 text-gray-300 border border-white/5 hover:bg-white/10 hover:text-white"
                                                        }`}
                                                    >
                                                        <span>{cat.icon}</span>
                                                        <span>{cat.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Inputs Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        {/* Full Name */}
                                        <div className="space-y-2">
                                            <label htmlFor="name" className="block text-[11px] font-bold uppercase tracking-widest text-gray-400">
                                                Your Full Name <span className="text-emerald-400">*</span>
                                            </label>
                                            <div className="relative">
                                                <User className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                                                <input
                                                    id="name"
                                                    name="name"
                                                    type="text"
                                                    required
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    placeholder="Alex Carter"
                                                    className="w-full bg-[#18181b] border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all font-medium"
                                                />
                                            </div>
                                        </div>

                                        {/* Email */}
                                        <div className="space-y-2">
                                            <label htmlFor="email" className="block text-[11px] font-bold uppercase tracking-widest text-gray-400">
                                                Email Address <span className="text-emerald-400">*</span>
                                            </label>
                                            <div className="relative">
                                                <Mail className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                                                <input
                                                    id="email"
                                                    name="email"
                                                    type="email"
                                                    required
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    placeholder="alex@example.com"
                                                    className="w-full bg-[#18181b] border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all font-medium"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Phone (Optional) & Subject */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        {/* Phone Number */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label htmlFor="phone" className="block text-[11px] font-bold uppercase tracking-widest text-gray-400">
                                                    Phone / WhatsApp
                                                </label>
                                                <span className="text-[10px] text-gray-500 uppercase font-semibold">Optional</span>
                                            </div>
                                            <div className="relative">
                                                <Phone className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                                                <input
                                                    id="phone"
                                                    name="phone"
                                                    type="tel"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    placeholder="+1 (555) 000-0000"
                                                    className="w-full bg-[#18181b] border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all font-medium"
                                                />
                                            </div>
                                        </div>

                                        {/* Subject */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label htmlFor="subject" className="block text-[11px] font-bold uppercase tracking-widest text-gray-400">
                                                    Subject
                                                </label>
                                                <span className="text-[10px] text-gray-500 uppercase font-semibold">Optional</span>
                                            </div>
                                            <input
                                                id="subject"
                                                name="subject"
                                                type="text"
                                                value={formData.subject}
                                                onChange={handleChange}
                                                placeholder="e.g. Help setting up custom theme"
                                                className="w-full bg-[#18181b] border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all font-medium"
                                            />
                                        </div>
                                    </div>

                                    {/* Message */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label htmlFor="message" className="block text-[11px] font-bold uppercase tracking-widest text-gray-400">
                                                How can we help? <span className="text-emerald-400">*</span>
                                            </label>
                                            <span className="text-[10px] text-gray-500 font-mono">
                                                {formData.message.length} chars
                                            </span>
                                        </div>
                                        <textarea
                                            id="message"
                                            name="message"
                                            required
                                            rows={5}
                                            value={formData.message}
                                            onChange={handleChange}
                                            placeholder="Please describe your question or issue in detail so we can help you as quickly as possible..."
                                            className="w-full bg-[#18181b] border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all font-medium resize-y min-h-[120px]"
                                        />
                                    </div>

                                    {/* Error Banner */}
                                    {status === "error" && (
                                        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs flex items-center gap-3 animate-shake">
                                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                            <span>{errorMessage}</span>
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={status === "sending" || !formData.name || !formData.email || !formData.message}
                                        className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-extrabold py-4 rounded-2xl text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed group"
                                    >
                                        {status === "sending" ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin text-black" />
                                                <span>Sending to support@jollywitme.com...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                                <span>Send Message to Support</span>
                                            </>
                                        )}
                                    </button>

                                    {/* Security & Privacy Note */}
                                    <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500 pt-1">
                                        <Shield className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>Your information is protected and never shared with third parties.</span>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
