'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, QrCode, Smartphone, RefreshCw, AlertCircle, Phone } from 'lucide-react';

export default function WhatsAppScanPage() {
    const [qr, setQr] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);
    const [initStep, setInitStep] = useState<string>('Idle');
    const [isReachable, setIsReachable] = useState<boolean | null>(null);
    const [lastError, setLastError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [pairingPhone, setPairingPhone] = useState('');
    const [pairingCode, setPairingCode] = useState<string | null>(null);
    const [isRequestingPair, setIsRequestingPair] = useState(false);
    const [pairError, setPairError] = useState<string | null>(null);
    const [pollingCount, setPollingCount] = useState(0);

    const handleRequestPairingCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pairingPhone) return;
        
        setIsRequestingPair(true);
        setPairError(null);
        
        try {
            const res = await fetch('/api/auth/whatsapp/pair', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: pairingPhone }),
            });
            const data = await res.json();
            
            if (!res.ok) {
                setPairError(data.error || 'Failed to get pairing code');
            } else {
                setPairingCode(data.code);
            }
        } catch (err: any) {
            setPairError(err.message || 'Network error');
        } finally {
            setIsRequestingPair(false);
        }
    };

    const fetchQR = async () => {
        try {
            const res = await fetch('/api/auth/whatsapp/qr');
            if (!res.ok) {
                setError('Failed to fetch QR data. Please ensure you have access.');
                return;
            }
            const data = await res.json();
            setQr(data.qr);
            setIsConnected(data.isConnected);
            setIsInitializing(data.isInitializing);
            setInitStep(data.initStep);
            setLastError(data.lastError);
            setIsReachable(data.isReachable);
            setError(null);
        } catch (err) {
            console.error('Fetch QR Error:', err);
            setError('Could not connect to the server.');
        }
    };

    useEffect(() => {
        fetchQR();
        const interval = setInterval(() => {
            setPollingCount(prev => prev + 1);
            fetchQR();
        }, 3000); // Poll every 3 seconds

        return () => clearInterval(interval);
    }, []);

    const qrImageUrl = qr
        ? `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qr)}`
        : null;

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-950 to-slate-950">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
            >
                {/* Background Glow */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 blur-3xl rounded-full" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-green-500/10 blur-3xl rounded-full" />

                <div className="relative z-10 text-center space-y-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 mb-2">
                        <Smartphone className="w-8 h-8 text-emerald-400" />
                    </div>

                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-white to-white/50 bg-clip-text text-transparent">
                            WhatsApp Link
                        </h1>
                        <p className="text-slate-400 mt-2">
                            Scan the code below to link your WhatsApp for OTP services.
                        </p>
                    </div>

                    <AnimatePresence mode="wait">
                        {isConnected ? (
                            <motion.div
                                key="connected"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="py-12 flex flex-col items-center"
                            >
                                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/50 animate-pulse">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                                </div>
                                <h2 className="text-2xl font-bold mt-6 text-emerald-400">Successfully Connected!</h2>
                                <p className="text-slate-400 mt-2">Your WhatsApp is now active.</p>
                                <div className="mt-8 flex flex-col gap-3 w-full max-w-[240px]">
                                    <motion.div
                                        className="px-6 py-2 bg-slate-800 border border-slate-700 rounded-full text-sm text-center font-medium cursor-pointer hover:bg-slate-700 transition"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => window.location.href = '/dashboard'}
                                    >
                                        Go to Dashboard
                                    </motion.div>
                                    <motion.div
                                        className="px-6 py-2 bg-rose-950/40 border border-rose-900/50 rounded-full text-sm text-center text-rose-400 font-medium cursor-pointer hover:bg-rose-900/60 transition"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={async () => {
                                            if (confirm('Are you sure you want to disconnect WhatsApp and purge the session? You will need to scan or pair again.')) {
                                                try {
                                                    await fetch('/api/auth/whatsapp/logout', { method: 'POST' });
                                                    window.location.reload();
                                                } catch (e) {
                                                    console.error(e);
                                                    window.location.reload();
                                                }
                                            }
                                        }}
                                    >
                                        Disconnect & Purge Session
                                    </motion.div>
                                </div>
                            </motion.div>
                        ) : error ? (
                            <motion.div
                                key="error"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="py-12 flex flex-col items-center"
                            >
                                <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
                                <p className="text-rose-400 font-medium">{error}</p>
                                <button
                                    onClick={fetchQR}
                                    className="mt-4 flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition"
                                >
                                    <RefreshCw className="w-4 h-4" /> Try Again
                                </button>
                            </motion.div>
                        ) : qrImageUrl ? (
                            <motion.div
                                key="qr"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="relative group"
                            >
                                <div className="bg-white p-4 rounded-2xl shadow-inner inline-block relative border-4 border-white">
                                    <img
                                        src={qrImageUrl}
                                        alt="WhatsApp QR Code"
                                        className="w-[280px] h-[280px]"
                                    />
                                    <div className="absolute inset-0 border-[1.5px] border-slate-900/10 rounded-xl" />
                                </div>

                                <div className="mt-6 flex items-center justify-center gap-2 text-emerald-400 text-sm font-medium">
                                    <RefreshCw className="w-4 h-4 animate-spin-slow" />
                                    Active (Updates every 3s)
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="py-12 flex flex-col items-center justify-center space-y-4"
                            >
                                {(initStep.includes('Blocked') || initStep.includes('Timed out')) ? (
                                    // Hosting firewall is blocking outbound WebSocket to WhatsApp
                                    <div className="flex flex-col items-center gap-3 text-center">
                                        <div className="w-14 h-14 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/30">
                                            <AlertCircle className="w-7 h-7 text-amber-400" />
                                        </div>
                                        <p className="text-amber-400 font-semibold text-sm">Connection Blocked by Host</p>
                                        <p className="text-slate-500 text-xs max-w-[260px] leading-relaxed">
                                            Your hosting provider is blocking outbound WebSocket connections to WhatsApp&apos;s servers.
                                            Contact your host to allow outbound connections on port 443 to <span className="font-mono text-slate-400">web.whatsapp.com</span>, or upgrade to a VPS with unrestricted outbound traffic.
                                        </p>
                                        <p className="text-[10px] text-slate-600 max-w-[240px]">
                                            Current status: <span className="text-slate-500 font-mono">{initStep}</span>
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="relative">
                                            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
                                            <QrCode className="w-6 h-6 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                        </div>
                                        <p className="text-slate-500 animate-pulse text-sm">
                                            {initStep}
                                        </p>
                                        {lastError && (
                                            <p className="text-[10px] text-rose-500 max-w-[200px] break-words">
                                                Error: {lastError}
                                            </p>
                                        )}
                                        {!lastError && (
                                            <p className="text-[10px] text-slate-700 uppercase tracking-widest font-bold">
                                                Generating QR Code...
                                            </p>
                                        )}
                                    </div>
                                )}
                                
                                <div className="mt-8 border-t border-slate-800 pt-6 w-full max-w-[280px]">
                                    <h3 className="text-sm font-semibold text-slate-300 text-center mb-3">
                                        Server Blocked? Use Phone Pair
                                    </h3>
                                    
                                    {pairingCode ? (
                                        <div className="text-center bg-slate-900 border border-slate-700 p-4 rounded-xl">
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">Your Pairing Code</p>
                                            <p className="text-2xl font-mono tracking-widest text-emerald-400 font-bold">{pairingCode}</p>
                                            <p className="text-xs text-slate-500 mt-3 leading-tight">
                                                Open WhatsApp &rarr; Linked Devices &rarr; Link with phone number instead
                                            </p>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleRequestPairingCode} className="flex flex-col gap-2">
                                            <div className="relative">
                                                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                                <input 
                                                    type="tel" 
                                                    placeholder="Phone (e.g. +92300...)" 
                                                    value={pairingPhone}
                                                    onChange={(e) => setPairingPhone(e.target.value)}
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                                                />
                                            </div>
                                            <button 
                                                type="submit"
                                                disabled={isRequestingPair || !pairingPhone}
                                                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors flex justify-center items-center"
                                            >
                                                {isRequestingPair ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Get Pairing Code'}
                                            </button>
                                            {pairError && <p className="text-xs text-rose-500 text-center">{pairError}</p>}
                                        </form>
                                    )}
                                </div>

                                <button
                                    onClick={async () => {
                                        setIsInitializing(true);
                                        setInitStep('Restarting...');
                                        await fetch('/api/auth/whatsapp/restart', { method: 'POST' });
                                        setTimeout(fetchQR, 2000);
                                    }}
                                    className="text-[10px] text-emerald-500/50 hover:text-emerald-500 underline uppercase tracking-widest font-bold transition-colors"
                                >
                                    Stuck? Force Restart Service
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="pt-6 border-t border-slate-800 text-[11px] text-slate-500 flex flex-col gap-1">
                        <div className="flex flex-col gap-2 mb-4 p-3 bg-slate-950/50 rounded-xl border border-slate-800/50">
                            <h3 className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">System Diagnostics</h3>
                            <div className="flex justify-between items-center">
                                <span>WhatsApp Reachability:</span>
                                {isReachable === null ? (
                                    <span className="text-slate-600 italic">Checking...</span>
                                ) : isReachable ? (
                                    <span className="text-emerald-500 font-bold">REACHABLE</span>
                                ) : (
                                    <span className="text-rose-500 font-bold">BLOCKED / UNREACHABLE</span>
                                )}
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Initialization Phase:</span>
                                <span className="text-emerald-400 font-mono">{initStep}</span>
                            </div>
                            {lastError && (
                                <div className="mt-1 pt-2 border-t border-slate-900 text-rose-400/80 leading-tight">
                                    <span className="text-rose-500 font-bold mr-1">ERROR:</span>
                                    {lastError}
                                </div>
                            )}
                        </div>
                        <p>1. Open WhatsApp on your phone</p>
                        <p>2. Tap Menu or Settings and select Linked Devices</p>
                        <p>3. Tap on Link a Device</p>
                        <p>4. Point your phone to this screen to capture the code</p>
                    </div>
                </div>
            </motion.div>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-12 text-slate-600 text-xs tracking-widest uppercase font-bold"
            >
                Powered by JollyWitMe Engine v4.0
            </motion.p>
        </div>
    );
}
