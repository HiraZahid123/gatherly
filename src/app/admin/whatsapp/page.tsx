"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Loader2,
    CheckCircle2,
    QrCode,
    Smartphone,
    RefreshCw,
    AlertCircle,
    ShieldCheck,
    LogOut,
    Radio,
    Activity,
    MessageSquare,
    Zap,
} from "lucide-react";

export default function AdminWhatsAppPage() {
    const [qr, setQr] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);
    const [initStep, setInitStep] = useState<string>("Idle");
    const [lastError, setLastError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isRestarting, setIsRestarting] = useState(false);

    const fetchQR = async () => {
        try {
            const res = await fetch("/api/auth/whatsapp/qr");
            if (!res.ok) {
                setError("Failed to fetch QR data. Please ensure you are logged in as Admin.");
                return;
            }
            const data = await res.json();
            setQr(data.qr);
            setIsConnected(data.isConnected);
            setIsInitializing(data.isInitializing);
            setInitStep(data.initStep);
            setLastError(data.lastError);
            setError(null);
        } catch (err) {
            console.error("Fetch QR Error:", err);
            setError("Could not connect to the server.");
        }
    };

    const handleForceRestart = async () => {
        setIsRestarting(true);
        try {
            await fetch("/api/auth/whatsapp/restart", { method: "POST" });
            setTimeout(() => {
                fetchQR();
                setIsRestarting(false);
            }, 2500);
        } catch (e) {
            console.error(e);
            setIsRestarting(false);
        }
    };

    const handleDisconnect = async () => {
        if (
            confirm(
                "Are you sure you want to disconnect WhatsApp and purge the session? You will need to scan the QR code again."
            )
        ) {
            try {
                await fetch("/api/auth/whatsapp/logout", { method: "POST" });
                fetchQR();
            } catch (e) {
                console.error(e);
            }
        }
    };

    useEffect(() => {
        fetchQR();
        const interval = setInterval(fetchQR, 3000);
        return () => clearInterval(interval);
    }, []);

    const qrImageUrl = qr
        ? `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qr)}`
        : null;

    return (
        <div className="space-y-8 max-w-5xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-8">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <Smartphone className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-white">WhatsApp Bot Gateway</h1>
                            <p className="text-sm text-gray-400 mt-0.5">
                                Link your WhatsApp business or personal phone number to dispatch automated OTPs and event invites.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleForceRestart}
                        disabled={isRestarting}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRestarting ? "animate-spin" : ""}`} />
                        <span>{isRestarting ? "Restarting..." : "Refresh QR / Service"}</span>
                    </button>
                    {isConnected && (
                        <button
                            onClick={handleDisconnect}
                            className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold transition-all"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Disconnect Bot</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Status Summary Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#0a0a0b] border border-white/5 p-5 rounded-2xl flex items-center gap-4">
                    <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            isConnected
                                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                                : "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                        }`}
                    >
                        {isConnected ? <CheckCircle2 className="w-6 h-6" /> : <Radio className="w-6 h-6 animate-pulse" />}
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Gateway Status</p>
                        <p className="text-base font-bold text-white mt-0.5">
                            {isConnected ? "Connected & Active" : "Awaiting Pairing"}
                        </p>
                    </div>
                </div>

                <div className="bg-[#0a0a0b] border border-white/5 p-5 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Engine Phase</p>
                        <p className="text-sm font-mono font-bold text-gray-300 mt-0.5 truncate max-w-[200px]">
                            {initStep}
                        </p>
                    </div>
                </div>

                <div className="bg-[#0a0a0b] border border-white/5 p-5 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Security</p>
                        <p className="text-sm font-bold text-gray-300 mt-0.5">Admin-Only Protected</p>
                    </div>
                </div>
            </div>

            {/* Main Scanner & Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Card: QR Scanner */}
                <div className="lg:col-span-7 bg-[#0a0a0b] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-center min-h-[480px]">
                    <AnimatePresence mode="wait">
                        {isConnected ? (
                            <motion.div
                                key="connected"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="py-8 flex flex-col items-center"
                            >
                                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/50 animate-pulse mb-6">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                                </div>
                                <h2 className="text-2xl font-black text-white">WhatsApp Bot is Live!</h2>
                                <p className="text-gray-400 text-sm max-w-md mt-2 leading-relaxed">
                                    Your WhatsApp number is successfully linked. All sign-in OTPs and event notification messages will now be dispatched automatically to your users.
                                </p>
                                <div className="mt-8 flex gap-3">
                                    <button
                                        onClick={handleDisconnect}
                                        className="px-6 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-bold transition-all"
                                    >
                                        Disconnect / Change Number
                                    </button>
                                </div>
                            </motion.div>
                        ) : error ? (
                            <motion.div
                                key="error"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="py-8 flex flex-col items-center"
                            >
                                <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
                                <p className="text-rose-400 font-medium">{error}</p>
                                <button
                                    onClick={fetchQR}
                                    className="mt-4 flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm font-bold"
                                >
                                    <RefreshCw className="w-4 h-4" /> Try Again
                                </button>
                            </motion.div>
                        ) : qrImageUrl ? (
                            <motion.div
                                key="qr"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center"
                            >
                                <div className="bg-white p-4 rounded-3xl shadow-2xl inline-block border-4 border-white">
                                    <img
                                        src={qrImageUrl}
                                        alt="WhatsApp QR Code"
                                        className="w-[280px] h-[280px] object-contain rounded-2xl"
                                    />
                                </div>
                                <div className="mt-6 flex items-center gap-2 text-emerald-400 text-xs font-bold">
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>Live QR Code (Auto-syncs every 3 seconds)</span>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="py-8 flex flex-col items-center justify-center space-y-4"
                            >
                                <div className="relative">
                                    <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
                                    <QrCode className="w-6 h-6 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                </div>
                                <p className="text-gray-400 text-sm font-medium">{initStep}</p>
                                {lastError && <p className="text-xs text-rose-500 max-w-xs">{lastError}</p>}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right Card: Instructions & Live Preview */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Instructions Card */}
                    <div className="bg-[#0a0a0b] border border-white/5 rounded-3xl p-6 space-y-4">
                        <div className="flex items-center gap-2 text-emerald-400">
                            <Zap className="w-4 h-4" />
                            <h3 className="text-sm font-black text-white uppercase tracking-wider">Quick Link Steps</h3>
                        </div>
                        <ol className="space-y-3.5 text-xs text-gray-400 leading-relaxed list-decimal list-inside">
                            <li>
                                Open <strong className="text-white">WhatsApp</strong> on your phone.
                            </li>
                            <li>
                                Go to <strong className="text-white">Settings</strong> (or tap the 3 dots at top-right) ➔{" "}
                                <strong className="text-white">Linked Devices</strong>.
                            </li>
                            <li>
                                Tap <strong className="text-white">Link a Device</strong>.
                            </li>
                            <li>
                                Point your camera at the <strong className="text-emerald-400">QR Code</strong> on the left to connect instantly.
                            </li>
                        </ol>
                    </div>

                    {/* Live Message Preview Card */}
                    <div className="bg-[#0a0a0b] border border-white/5 rounded-3xl p-6 space-y-3">
                        <div className="flex items-center gap-2 text-gray-400">
                            <MessageSquare className="w-4 h-4 text-emerald-400" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">Message Preview</h3>
                        </div>

                        <div className="bg-[#141416] border border-white/5 rounded-2xl p-4 text-xs font-sans text-gray-300 space-y-2 relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
                            <p className="font-bold text-white">🎉 *Your JollyWitMe Verification Code*</p>
                            <p>
                                Your 6-digit code is: <span className="font-mono font-black text-emerald-400 text-sm">849201</span>
                            </p>
                            <p className="text-[11px] text-gray-500 italic">
                                This code will expire in 5 minutes. Please do not share it with anyone.
                            </p>
                        </div>
                        <p className="text-[11px] text-gray-500">
                            Delivered directly from your linked phone number to user chats in real-time.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
