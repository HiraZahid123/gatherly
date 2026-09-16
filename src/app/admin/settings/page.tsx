"use client";

import React, { useState, useEffect } from "react";
import { 
    Percent, 
    DollarSign, 
    Layers, 
    Save, 
    CheckCircle2, 
    AlertCircle, 
    Calculator, 
    ShieldCheck, 
    RefreshCw,
    TrendingUp,
    KeyRound,
    Eye,
    EyeOff,
    Zap,
    Copy,
    Check,
    Lock,
    ExternalLink,
    Server
} from "lucide-react";
import { PlatformCommissionSettings, CommissionType } from "@/lib/platformSettings";

interface ExtendedSettings extends PlatformCommissionSettings {
    hasCustomKeys?: boolean;
    hasEnvKeys?: boolean;
    isConfigured?: boolean;
    isLive?: boolean;
}

export default function AdminSettingsPage() {
    const [activeTab, setActiveTab] = useState<"COMMISSION" | "STRIPE">("COMMISSION");
    const [settings, setSettings] = useState<ExtendedSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Commission Form state
    const [commissionType, setCommissionType] = useState<CommissionType>("PERCENTAGE");
    const [percentageRate, setPercentageRate] = useState<number>(3.0);
    const [fixedAmount, setFixedAmount] = useState<number>(0);
    const [currency, setCurrency] = useState<string>("ngn");
    const [payoutScheduleNote, setPayoutScheduleNote] = useState<string>("");

    // Stripe Gateway Form state
    const [stripePublishableKey, setStripePublishableKey] = useState<string>("");
    const [stripeSecretKey, setStripeSecretKey] = useState<string>("");
    const [stripeWebhookSecret, setStripeWebhookSecret] = useState<string>("");
    const [showSecretKey, setShowSecretKey] = useState<boolean>(false);
    const [showWebhookSecret, setShowWebhookSecret] = useState<boolean>(false);

    // Testing Stripe Connection
    const [testingConnection, setTestingConnection] = useState<boolean>(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [copiedWebhook, setCopiedWebhook] = useState<boolean>(false);

    // Live Simulator state
    const [samplePrice, setSamplePrice] = useState<number>(10000); // ₦10,000
    const [sampleQuantity, setSampleQuantity] = useState<number>(2);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/commission");
            const data = await res.json();
            if (data.success && data.settings) {
                const s: ExtendedSettings = data.settings;
                setSettings(s);
                setCommissionType(s.commissionType || "PERCENTAGE");
                setPercentageRate(s.percentageRate ?? 3.0);
                setFixedAmount(s.fixedAmount ?? 0);
                setCurrency(s.currency || "ngn");
                setPayoutScheduleNote(s.payoutScheduleNote || "");

                // Stripe keys (masked from backend)
                setStripePublishableKey(s.stripePublishableKey || "");
                setStripeSecretKey(s.stripeSecretKey || "");
                setStripeWebhookSecret(s.stripeWebhookSecret || "");
            }
        } catch (err) {
            console.error("Failed to load settings:", err);
            setStatusMessage({ type: "error", text: "Failed to load current settings" });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveCommission = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setStatusMessage(null);

        try {
            const res = await fetch("/api/admin/commission", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    commissionType,
                    percentageRate: Number(percentageRate),
                    fixedAmount: Number(fixedAmount),
                    currency,
                    payoutScheduleNote,
                }),
            });

            const data = await res.json();
            if (data.success) {
                setSettings(data.settings);
                setStatusMessage({ type: "success", text: "Commission rules updated and active in checkout!" });
                setTimeout(() => setStatusMessage(null), 5000);
            } else {
                setStatusMessage({ type: "error", text: data.error || "Failed to save commission settings" });
            }
        } catch (err: any) {
            setStatusMessage({ type: "error", text: err.message || "An unexpected error occurred" });
        } finally {
            setSaving(false);
        }
    };

    const handleSaveStripe = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setStatusMessage(null);
        setTestResult(null);

        try {
            const res = await fetch("/api/admin/commission", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    stripePublishableKey: stripePublishableKey.trim(),
                    stripeSecretKey: stripeSecretKey.trim(),
                    stripeWebhookSecret: stripeWebhookSecret.trim(),
                }),
            });

            const data = await res.json();
            if (data.success) {
                setSettings(data.settings);
                setStripePublishableKey(data.settings.stripePublishableKey || "");
                setStripeSecretKey(data.settings.stripeSecretKey || "");
                setStripeWebhookSecret(data.settings.stripeWebhookSecret || "");
                setStatusMessage({ type: "success", text: "Stripe API keys updated and active across platform!" });
                setTimeout(() => setStatusMessage(null), 5000);
            } else {
                setStatusMessage({ type: "error", text: data.error || "Failed to save Stripe keys" });
            }
        } catch (err: any) {
            setStatusMessage({ type: "error", text: err.message || "An unexpected error occurred" });
        } finally {
            setSaving(false);
        }
    };

    const handleTestStripeConnection = async () => {
        setTestingConnection(true);
        setTestResult(null);

        try {
            const res = await fetch("/api/admin/stripe/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    secretKey: stripeSecretKey.trim(),
                }),
            });

            const data = await res.json();
            if (data.success) {
                setTestResult({
                    success: true,
                    message: data.message || "Stripe connection verified successfully!",
                });
            } else {
                setTestResult({
                    success: false,
                    message: data.error || "Connection test failed.",
                });
            }
        } catch (err: any) {
            setTestResult({
                success: false,
                message: err.message || "Could not reach Stripe test service.",
            });
        } finally {
            setTestingConnection(false);
        }
    };

    const handleCopyWebhookUrl = () => {
        const origin = typeof window !== "undefined" ? window.location.origin : "https://jollywitme.com";
        const url = `${origin}/api/webhooks/stripe`;
        navigator.clipboard.writeText(url);
        setCopiedWebhook(true);
        setTimeout(() => setCopiedWebhook(false), 3000);
    };

    // Live calculations for the simulator
    const sampleTotalRevenue = samplePrice * sampleQuantity;
    let samplePlatformFee = 0;

    if (commissionType === "PERCENTAGE" || commissionType === "BOTH") {
        samplePlatformFee += sampleTotalRevenue * (percentageRate / 100);
    }
    if (commissionType === "FIXED" || commissionType === "BOTH") {
        samplePlatformFee += fixedAmount * sampleQuantity;
    }

    samplePlatformFee = Math.min(sampleTotalRevenue, Math.max(0, samplePlatformFee));
    const sampleHostPayout = Math.max(0, sampleTotalRevenue - samplePlatformFee);
    const effectiveFeePercent = sampleTotalRevenue > 0 ? ((samplePlatformFee / sampleTotalRevenue) * 100).toFixed(1) : "0.0";

    const currencySymbol = currency === "usd" ? "$" : "₦";

    // Mode determination
    const isLive = stripePublishableKey.startsWith("pk_live_") || stripeSecretKey.startsWith("sk_live_");
    const isConfigured = settings?.isConfigured || Boolean(stripePublishableKey && stripeSecretKey);

    return (
        <div className="space-y-8 max-w-6xl pb-24">
            {/* Header & Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                        {activeTab === "COMMISSION" ? <Percent className="w-5 h-5" /> : <KeyRound className="w-5 h-5" />}
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-white">Platform Settings</h1>
                        <p className="text-white/40 text-xs mt-0.5">
                            Manage ticket commission fees, payout schedules, and Stripe payment gateway credentials
                        </p>
                    </div>
                </div>

                {/* Tab Pill Selector */}
                <div className="flex items-center p-1 rounded-2xl bg-[#0a0a0b] border border-white/10 self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => setActiveTab("COMMISSION")}
                        className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                            activeTab === "COMMISSION"
                                ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 font-black"
                                : "text-white/60 hover:text-white hover:bg-white/5"
                        }`}
                    >
                        <Percent className="w-3.5 h-3.5" />
                        <span>Commission Rules</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("STRIPE")}
                        className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all relative ${
                            activeTab === "STRIPE"
                                ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 font-black"
                                : "text-white/60 hover:text-white hover:bg-white/5"
                        }`}
                    >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Stripe Gateway</span>
                        {isConfigured && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                    </button>
                </div>
            </div>

            {/* Notification Alert */}
            {statusMessage && (
                <div
                    className={`p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
                        statusMessage.type === "success"
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                            : "bg-red-500/10 border-red-500/30 text-red-300"
                    }`}
                >
                    {statusMessage.type === "success" ? (
                        <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                    ) : (
                        <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
                    )}
                    <span className="text-sm font-semibold">{statusMessage.text}</span>
                </div>
            )}

            {loading ? (
                <div className="p-16 text-center border border-white/5 rounded-3xl bg-[#0a0a0b]/60">
                    <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
                    <p className="text-white/40 text-sm">Loading platform configurations...</p>
                </div>
            ) : activeTab === "STRIPE" ? (
                /* ─── TAB 2: STRIPE GATEWAY CONFIGURATION ─── */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Stripe Form */}
                    <div className="lg:col-span-7 space-y-6">
                        <form onSubmit={handleSaveStripe} className="space-y-6">
                            {/* Gateway Status Banner */}
                            <div className="bg-[#0a0a0b] border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${isConfigured ? "bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]" : "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]"}`} />
                                        <h3 className="font-bold text-sm text-white">
                                            {isConfigured ? "Stripe Gateway Configured" : "Stripe Gateway Not Configured"}
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                            isLive 
                                                ? "bg-rose-500/10 text-rose-400 border-rose-500/30" 
                                                : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                        }`}>
                                            {isLive ? "● LIVE MODE" : "○ TEST MODE"}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-xs text-white/50 leading-relaxed">
                                    Configure your platform Stripe credentials below. These keys process payments for all ticket orders and remit funds to event creators.
                                </p>
                            </div>

                            {/* Stripe API Credentials */}
                            <div className="bg-[#0a0a0b] border border-white/10 rounded-3xl p-6 shadow-xl space-y-5">
                                <label className="text-xs font-black uppercase tracking-widest text-white/40 block">
                                    Stripe API Credentials
                                </label>

                                {/* Publishable Key */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-white/70 block">
                                            Publishable Key
                                        </label>
                                        <span className="text-[10px] font-mono text-white/40">
                                            Starts with pk_test_ or pk_live_
                                        </span>
                                    </div>
                                    <input
                                        type="text"
                                        value={stripePublishableKey}
                                        onChange={(e) => setStripePublishableKey(e.target.value)}
                                        className="w-full bg-black/60 border border-white/15 focus:border-emerald-500 rounded-2xl px-4 py-3.5 text-white font-mono text-xs outline-none transition-all placeholder:text-white/20"
                                        placeholder="pk_test_51P..."
                                    />
                                    <p className="text-[11px] text-white/40">
                                        Used by the browser checkout drawer to render the secure payment element.
                                    </p>
                                </div>

                                {/* Secret Key */}
                                <div className="space-y-2 pt-2 border-t border-white/5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-white/70 block">
                                            Secret API Key
                                        </label>
                                        <span className="text-[10px] font-mono text-white/40">
                                            Starts with sk_test_ or sk_live_
                                        </span>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type={showSecretKey ? "text" : "password"}
                                            value={stripeSecretKey}
                                            onChange={(e) => setStripeSecretKey(e.target.value)}
                                            className="w-full bg-black/60 border border-white/15 focus:border-emerald-500 rounded-2xl pl-4 pr-12 py-3.5 text-white font-mono text-xs outline-none transition-all placeholder:text-white/20"
                                            placeholder="sk_test_51P... (leave unchanged to keep current key)"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowSecretKey(!showSecretKey)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                                        >
                                            {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-white/40 flex items-center gap-1.5">
                                        <Lock className="w-3 h-3 text-emerald-400" />
                                        <span>Stored securely. Masked values (•••) will not overwrite your existing secret key.</span>
                                    </p>
                                </div>

                                {/* Webhook Secret */}
                                <div className="space-y-2 pt-2 border-t border-white/5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-white/70 block">
                                            Webhook Signing Secret (Optional)
                                        </label>
                                        <span className="text-[10px] font-mono text-white/40">
                                            Starts with whsec_
                                        </span>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type={showWebhookSecret ? "text" : "password"}
                                            value={stripeWebhookSecret}
                                            onChange={(e) => setStripeWebhookSecret(e.target.value)}
                                            className="w-full bg-black/60 border border-white/15 focus:border-emerald-500 rounded-2xl pl-4 pr-12 py-3.5 text-white font-mono text-xs outline-none transition-all placeholder:text-white/20"
                                            placeholder="whsec_..."
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                                        >
                                            {showWebhookSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-white/40">
                                        Verifies incoming payment webhooks for instant order confirmation and ticket issuance.
                                    </p>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
                                <button
                                    type="button"
                                    onClick={handleTestStripeConnection}
                                    disabled={testingConnection || (!stripeSecretKey && !settings?.isConfigured)}
                                    className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider transition-all border border-white/10 hover:border-white/20 disabled:opacity-40"
                                >
                                    {testingConnection ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                                            <span>Testing Credentials...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="w-4 h-4 text-emerald-400" />
                                            <span>Test Connection</span>
                                        </>
                                    )}
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 disabled:opacity-50"
                                >
                                    {saving ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            <span>Saving Keys...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            <span>Save Stripe Gateway Keys</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Connection Test Result Banner */}
                            {testResult && (
                                <div
                                    className={`p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
                                        testResult.success
                                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                                            : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                                    }`}
                                >
                                    {testResult.success ? (
                                        <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                                    ) : (
                                        <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
                                    )}
                                    <div className="text-xs">
                                        <p className="font-bold">{testResult.success ? "Connection Succeeded" : "Connection Failed"}</p>
                                        <p className="mt-0.5 opacity-80">{testResult.message}</p>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Right Column: Webhook Setup & Quick Reference */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* Webhook Endpoint Card */}
                        <div className="bg-[#0a0a0b] border border-white/10 rounded-3xl p-6 shadow-xl space-y-5">
                            <div className="flex items-center gap-2.5 pb-4 border-b border-white/10">
                                <Server className="w-5 h-5 text-emerald-400" />
                                <h3 className="font-bold text-sm text-white">Stripe Webhook Endpoint</h3>
                            </div>

                            <p className="text-white/50 text-xs leading-relaxed">
                                Add this webhook URL to your Stripe Dashboard (Developers &rarr; Webhooks &rarr; Add endpoint) to receive real-time payment notifications:
                            </p>

                            <div className="p-3.5 bg-black/60 rounded-2xl border border-white/10 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] uppercase font-black tracking-wider text-white/40">
                                        Endpoint URL
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleCopyWebhookUrl}
                                        className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                                    >
                                        {copiedWebhook ? (
                                            <>
                                                <Check className="w-3.5 h-3.5" />
                                                <span>Copied!</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-3.5 h-3.5" />
                                                <span>Copy URL</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                                <p className="font-mono text-xs text-white break-all select-all">
                                    {typeof window !== "undefined" ? window.location.origin : "https://jollywitme.com"}/api/webhooks/stripe
                                </p>
                            </div>

                            <div className="space-y-2">
                                <span className="text-[10px] uppercase font-black tracking-wider text-white/40 block">
                                    Events to Listen For
                                </span>
                                <ul className="text-xs space-y-1 text-white/60 font-mono">
                                    <li className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                        payment_intent.succeeded
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                        charge.refunded
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                        account.updated
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Security Notice */}
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                            <div className="text-xs text-white/50 leading-relaxed space-y-1">
                                <p className="font-bold text-white/80">Zero-Downtime Dynamic Gateway</p>
                                <p>
                                    Updated keys take effect immediately across all active checkout drawers and API routes without needing to restart your VPS server.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* ─── TAB 1: COMMISSION RULES CONFIGURATION ─── */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Form: Configuration */}
                    <div className="lg:col-span-7 space-y-6">
                        <form onSubmit={handleSaveCommission} className="space-y-6">
                            {/* Commission Model Selection */}
                            <div className="bg-[#0a0a0b] border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
                                <label className="text-xs font-black uppercase tracking-widest text-white/40 block">
                                    1. Select Commission Structure
                                </label>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {/* Percentage Card */}
                                    <button
                                        type="button"
                                        onClick={() => setCommissionType("PERCENTAGE")}
                                        className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                                            commissionType === "PERCENTAGE"
                                                ? "bg-emerald-500/10 border-emerald-500/40 text-white ring-1 ring-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.1)]"
                                                : "bg-white/[0.02] border-white/10 text-white/50 hover:bg-white/[0.05] hover:text-white"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <Percent className={`w-5 h-5 ${commissionType === "PERCENTAGE" ? "text-emerald-400" : "text-white/30"}`} />
                                            {commissionType === "PERCENTAGE" && (
                                                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-white">Percentage Only</p>
                                            <p className="text-[11px] text-white/40 mt-1">Deduct % of total ticket price</p>
                                        </div>
                                    </button>

                                    {/* Fixed Fee Card */}
                                    <button
                                        type="button"
                                        onClick={() => setCommissionType("FIXED")}
                                        className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                                            commissionType === "FIXED"
                                                ? "bg-emerald-500/10 border-emerald-500/40 text-white ring-1 ring-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.1)]"
                                                : "bg-white/[0.02] border-white/10 text-white/50 hover:bg-white/[0.05] hover:text-white"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <DollarSign className={`w-5 h-5 ${commissionType === "FIXED" ? "text-emerald-400" : "text-white/30"}`} />
                                            {commissionType === "FIXED" && (
                                                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-white">Fixed Fee</p>
                                            <p className="text-[11px] text-white/40 mt-1">Deduct flat rate per ticket</p>
                                        </div>
                                    </button>

                                    {/* Hybrid Card */}
                                    <button
                                        type="button"
                                        onClick={() => setCommissionType("BOTH")}
                                        className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                                            commissionType === "BOTH"
                                                ? "bg-emerald-500/10 border-emerald-500/40 text-white ring-1 ring-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.1)]"
                                                : "bg-white/[0.02] border-white/10 text-white/50 hover:bg-white/[0.05] hover:text-white"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <Layers className={`w-5 h-5 ${commissionType === "BOTH" ? "text-emerald-400" : "text-white/30"}`} />
                                            {commissionType === "BOTH" && (
                                                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-white">Hybrid Rate</p>
                                            <p className="text-[11px] text-white/40 mt-1">% + Flat fee (Eventbrite style)</p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Value Inputs */}
                            <div className="bg-[#0a0a0b] border border-white/10 rounded-3xl p-6 shadow-xl space-y-6">
                                <label className="text-xs font-black uppercase tracking-widest text-white/40 block">
                                    2. Commission Rates
                                </label>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {/* Percentage Input */}
                                    {(commissionType === "PERCENTAGE" || commissionType === "BOTH") && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-white/70 block">
                                                Percentage Commission (%)
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    min="0"
                                                    max="50"
                                                    value={percentageRate}
                                                    onChange={(e) => setPercentageRate(Number(e.target.value))}
                                                    className="w-full bg-black/60 border border-white/15 focus:border-emerald-500 rounded-2xl px-4 py-3.5 pr-10 text-white font-bold text-base outline-none transition-all"
                                                    placeholder="3.0"
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 font-bold text-sm">
                                                    %
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-white/40">Default is 3.0%. Common range: 3% – 10%.</p>
                                        </div>
                                    )}

                                    {/* Fixed Fee Input */}
                                    {(commissionType === "FIXED" || commissionType === "BOTH") && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-white/70 block">
                                                Fixed Fee per Ticket ({currencySymbol})
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold text-sm">
                                                    {currencySymbol}
                                                </span>
                                                <input
                                                    type="number"
                                                    step="10"
                                                    min="0"
                                                    value={fixedAmount}
                                                    onChange={(e) => setFixedAmount(Number(e.target.value))}
                                                    className="w-full bg-black/60 border border-white/15 focus:border-emerald-500 rounded-2xl pl-10 pr-4 py-3.5 text-white font-bold text-base outline-none transition-all"
                                                    placeholder="100"
                                                />
                                            </div>
                                            <p className="text-[11px] text-white/40">Charged per individual ticket purchased.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Currency Selector */}
                                <div className="space-y-2 pt-2 border-t border-white/5">
                                    <label className="text-xs font-bold text-white/70 block">
                                        Base Currency
                                    </label>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setCurrency("ngn")}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                                                currency === "ngn"
                                                    ? "bg-white/10 border-white/30 text-white"
                                                    : "bg-transparent border-white/10 text-white/40 hover:text-white"
                                            }`}
                                        >
                                            Nigerian Naira (₦ NGN)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setCurrency("usd")}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                                                currency === "usd"
                                                    ? "bg-white/10 border-white/30 text-white"
                                                    : "bg-transparent border-white/10 text-white/40 hover:text-white"
                                            }`}
                                        >
                                            US Dollar ($ USD)
                                        </button>
                                    </div>
                                </div>

                                {/* Payout Note */}
                                <div className="space-y-2 pt-2 border-t border-white/5">
                                    <label className="text-xs font-bold text-white/70 block">
                                        Remittance / Payout Schedule Note
                                    </label>
                                    <input
                                        type="text"
                                        value={payoutScheduleNote}
                                        onChange={(e) => setPayoutScheduleNote(e.target.value)}
                                        className="w-full bg-black/60 border border-white/15 focus:border-emerald-500 rounded-2xl px-4 py-3 text-white text-xs outline-none transition-all placeholder:text-white/20"
                                        placeholder="e.g. End-of-day automatic remittance to creator's linked account via Stripe"
                                    />
                                    <p className="text-[11px] text-white/40">Displayed in host analytics panel for transparency.</p>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex items-center justify-between gap-4 pt-2">
                                <span className="text-[11px] text-white/40">
                                    {settings?.updatedAt && `Last updated: ${new Date(settings.updatedAt).toLocaleDateString()}`}
                                </span>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 disabled:opacity-50"
                                >
                                    {saving ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            <span>Saving Settings...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            <span>Save Commission Rules</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Right Column: Interactive Simulator */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-[#0a0a0b] border border-white/10 rounded-3xl p-6 shadow-xl space-y-6 sticky top-8">
                            <div className="flex items-center justify-between pb-4 border-b border-white/10">
                                <div className="flex items-center gap-2.5">
                                    <Calculator className="w-5 h-5 text-emerald-400" />
                                    <h3 className="font-bold text-sm text-white">Live Commission Simulator</h3>
                                </div>
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/20">
                                    Real-time
                                </span>
                            </div>

                            <p className="text-white/50 text-xs leading-relaxed">
                                Test how your chosen commission structure splits money between the platform and event creators.
                            </p>

                            {/* Sample Inputs */}
                            <div className="space-y-4 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-white/50 uppercase tracking-wider">
                                        Sample Ticket Price ({currencySymbol})
                                    </label>
                                    <input
                                        type="number"
                                        step="500"
                                        min="1000"
                                        value={samplePrice}
                                        onChange={(e) => setSamplePrice(Number(e.target.value))}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-white font-bold text-sm outline-none"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-white/50 uppercase tracking-wider">
                                        Tickets Purchased
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={sampleQuantity}
                                        onChange={(e) => setSampleQuantity(Number(e.target.value))}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-white font-bold text-sm outline-none"
                                    />
                                </div>
                            </div>

                            {/* Breakdown Results */}
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between text-xs text-white/60">
                                    <span>Guest Total Payment</span>
                                    <span className="font-bold text-white">
                                        {currencySymbol}{sampleTotalRevenue.toLocaleString()}
                                    </span>
                                </div>

                                {/* Platform Commission */}
                                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                                            <TrendingUp className="w-3.5 h-3.5" />
                                            Platform Commission (Your Cut)
                                        </span>
                                        <span className="text-base font-black text-emerald-400">
                                            {currencySymbol}{Math.round(samplePlatformFee).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-emerald-300/70">
                                        Retained automatically via Stripe ({effectiveFeePercent}% effective rate)
                                    </p>
                                </div>

                                {/* Creator Payout */}
                                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-white/70">
                                            Event Creator Net Payout
                                        </span>
                                        <span className="text-base font-black text-white">
                                            {currencySymbol}{Math.round(sampleHostPayout).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-white/40">
                                        Transferred to host's Stripe Connect bank account
                                    </p>
                                </div>
                            </div>

                            {/* Trust Badge */}
                            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2.5">
                                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-white/50 leading-relaxed">
                                    Automated by Stripe Destination Charges. Commission is deducted before creator funds are released.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
