"use client";

import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { QrCode, UserCheck, XCircle, CheckCircle2, Loader2, Search, Users, Wifi, WifiOff, Database, RotateCw } from "lucide-react";

interface EventScannerPanelProps {
    eventId?: string;
}

export default function EventScannerPanel({ eventId }: EventScannerPanelProps) {
    const [scanResult, setScanResult] = useState<{
        success: boolean;
        message: string;
        guestName?: string;
    } | null>(null);
    const [manualToken, setManualToken] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [scannerActive, setScannerActive] = useState(false);
    const [isOffline, setIsOffline] = useState(false);
    const [offlineGuests, setOfflineGuests] = useState<any[]>([]);
    const [syncQueue, setSyncQueue] = useState<any[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [stats, setStats] = useState({ checkedIn: 0, total: 0 });
    const scannerRef = useRef<Html5Qrcode | null>(null);

    // Load offline data from localStorage
    useEffect(() => {
        if (!eventId) return;
        const cached = localStorage.getItem(`offline_guests_${eventId}`);
        if (cached) setOfflineGuests(JSON.parse(cached));

        const queued = localStorage.getItem(`sync_queue_${eventId}`);
        if (queued) setSyncQueue(JSON.parse(queued));
    }, [eventId]);

    // Save sync queue to localStorage
    useEffect(() => {
        if (!eventId) return;
        localStorage.setItem(`sync_queue_${eventId}`, JSON.stringify(syncQueue));
    }, [syncQueue, eventId]);

    // Handle Offline Sync
    useEffect(() => {
        if (isOffline || syncQueue.length === 0 || isSyncing) return;

        const syncOfflineData = async () => {
            setIsSyncing(true);
            try {
                const response = await fetch(`/api/events/${eventId}/check-in/sync`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ scans: syncQueue })
                });
                if (response.ok) {
                    setSyncQueue([]);
                    // Refresh stats after sync
                    fetchStats();
                }
            } catch (err) {
                console.error("Sync failed", err);
            } finally {
                setIsSyncing(false);
            }
        };

        const timer = setTimeout(syncOfflineData, 5000); // Attempt sync every 5s if online
        return () => clearTimeout(timer);
    }, [syncQueue, isOffline, isSyncing, eventId]);

    const fetchStats = async () => {
        if (!eventId) return;
        try {
            const response = await fetch(`/api/events/${eventId}/guests`);
            const data = await response.json();
            if (data.guests) {
                const checkedIn = data.guests.filter((g: any) => g.checkedIn).length;
                setStats({ checkedIn, total: data.guests.length });
            }
        } catch (err) {
            console.error("Failed to fetch stats");
        }
    };

    useEffect(() => {
        fetchStats();
    }, [eventId]);

    const toggleOfflineMode = async () => {
        if (!isOffline) {
            // Going offline: Download current guest list
            setIsProcessing(true);
            try {
                const response = await fetch(`/api/events/${eventId}/guests`);
                const data = await response.json();
                if (data.guests) {
                    const accepted = data.guests.filter((g: any) => g.status === "ACCEPTED");
                    setOfflineGuests(accepted);
                    localStorage.setItem(`offline_guests_${eventId}`, JSON.stringify(accepted));
                    setIsOffline(true);
                }
            } catch (err) {
                alert("Failed to download guest list for offline mode");
            } finally {
                setIsProcessing(false);
            }
        } else {
            setIsOffline(false);
        }
    };

    const busyRef = useRef(false);

    // QR Scanner Lifecycle
    useEffect(() => {
        let isScannerMounted = true;

        const startScanner = async () => {
            if (busyRef.current) return;
            busyRef.current = true;

            try {
                if (!scannerActive) {
                    if (scannerRef.current) {
                        try {
                            if (scannerRef.current.isScanning) {
                                await scannerRef.current.stop();
                            }
                        } catch (err) {
                            console.error("Failed to stop scanner", err);
                        }
                        scannerRef.current = null;
                    }
                    return;
                }

                // Small delay to ensure the "reader" element is in the DOM
                await new Promise(resolve => setTimeout(resolve, 200));
                if (!isScannerMounted) return;

                // Create instance if doesn't exist
                if (!scannerRef.current) {
                    try {
                        scannerRef.current = new Html5Qrcode("reader");
                    } catch (e) {
                        console.error("Identity creation failed", e);
                        return;
                    }
                }

                // Start if not already scanning
                if (!scannerRef.current.isScanning) {
                    await scannerRef.current.start(
                        { facingMode: "environment" },
                        { 
                            fps: 10,
                            qrbox: { width: 250, height: 250 },
                            aspectRatio: 1.0
                        },
                        onScanSuccess,
                        onScanFailure
                    );
                }
            } catch (err) {
                const errMsg = err?.toString() || "";
                if (!errMsg.includes("already under transition")) {
                    console.error("Camera start failed", err);
                    setScanResult({ success: false, message: "Camera access denied or device not found." });
                    setScannerActive(false);
                }
            } finally {
                busyRef.current = false;
            }
        };

        startScanner();

        return () => {
            isScannerMounted = false;
        };
    }, [scannerActive]);

    const onScanSuccess = (decodedText: string) => {
        if (scannerRef.current) {
            scannerRef.current.pause(true);
        }
        handleCheckIn(decodedText);
    };

    const onScanFailure = (error: any) => {
        // Normal to fail while scanning, no need to log excessively
    };

    const handleCheckIn = async (token: string) => {
        if (!eventId || isProcessing) return;

        setIsProcessing(true);
        setScanResult(null);

        if (isOffline) {
            // OFFLINE LOGIC
            const guest = offlineGuests.find(g => g.qrToken === token);
            if (!guest) {
                setScanResult({ success: false, message: "Invalid QR Token (Offline)" });
            } else {
                // Check local sync queue for previous scans to simulate re-entry logic
                const localScans = syncQueue.filter(s => s.qrToken === token).length;
                const totalScans = (guest.checkIns?.length || 0) + (guest.checkedIn && guest.checkIns?.length === 0 ? 1 : 0) + localScans;

                if (totalScans >= 2) {
                    setScanResult({
                        success: false,
                        message: "Ticket expired (Offline). Max entries reached.",
                        guestName: guest.guestName
                    });
                } else {
                    const scanEvent = { qrToken: token, scannedAt: new Date().toISOString() };
                    setSyncQueue(prev => [...prev, scanEvent]);
                    setScanResult({
                        success: true,
                        message: totalScans > 0 ? "Re-entry successful (Offline)" : "Check-in successful (Offline)",
                        guestName: guest.guestName
                    });
                    setManualToken("");
                }
            }
            setIsProcessing(false);
            return;
        }

        try {
            const response = await fetch(`/api/events/${eventId}/check-in`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ qrToken: token })
            });

            const data = await response.json();
            setScanResult({
                success: response.ok,
                message: data.error || data.message,
                guestName: data.guestName
            });

            if (response.ok) {
                setManualToken("");
                fetchStats();
            }
        } catch (err) {
            setScanResult({ success: false, message: "Connection error. Switch to Offline Mode?" });
        } finally {
            setIsProcessing(false);
        }
    };

    const resetScanner = () => {
        setScanResult(null);
        if (scannerRef.current) {
            try {
                scannerRef.current.resume();
            } catch (e) {
                console.error("Resume failed", e);
            }
        }
    };

    if (!eventId) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white/[0.02] rounded-3xl border border-dashed border-white/10 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                    <QrCode className="w-6 h-6 text-white/20" />
                </div>
                <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white/60">Scanner Ready</h4>
                    <p className="text-[10px] text-white/20 font-medium max-w-[200px] leading-relaxed uppercase tracking-widest">
                        Publish your event to enable QR check-in scanning
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-white/40" />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Check-in Terminal</h4>
                    </div>
                </div>
                <button
                    onClick={() => setScannerActive(!scannerActive)}
                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${scannerActive
                        ? "bg-red-500/10 text-red-500 border border-red-500/20"
                        : "bg-white text-black hover:bg-white/90"
                        }`}
                >
                    {scannerActive ? "Stop Camera" : "Launch Camera"}
                </button>
            </div>

            {/* Main Scanner Area */}
            <div className="relative aspect-square max-w-sm mx-auto bg-white/5 rounded-3xl overflow-hidden border border-white/10 flex items-center justify-center">
                {!scannerActive && !scanResult && (
                    <div className="text-center space-y-4 p-8">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                            <QrCode className="w-8 h-8 text-white/10" />
                        </div>
                        <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest leading-loose">
                            Camera is docked.<br />Launch to start scanning guests.
                        </p>
                    </div>
                )}

                {scannerActive && (
                    <div className={`w-full h-full flex items-center justify-center ${scanResult ? 'hidden' : ''}`}>
                        <div id="reader" className="w-full h-full min-h-[300px]"></div>
                        {isOffline && (
                            <div className="absolute top-4 right-4 z-20 px-3 py-1 bg-amber-500 rounded-full flex items-center gap-2 animate-pulse">
                                <WifiOff className="w-3 h-3 text-white" />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Offline</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Result Overlay */}
                {scanResult && (
                    <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-300 ${
                        scanResult.message?.includes("Soft check-in") 
                            ? "bg-amber-500/90 text-white" 
                            : scanResult.success 
                                ? "bg-green-500/90 text-white" 
                                : "bg-red-500/90 text-white"
                        }`}>
                        {scanResult.success ? (
                            <CheckCircle2 className="w-20 h-20 mb-6" />
                        ) : (
                            <XCircle className="w-20 h-20 mb-6" />
                        )}

                        <h2 className="text-2xl font-black uppercase tracking-tighter mb-2 italic">
                            {scanResult.success ? "Verified" : "Denied"}
                        </h2>

                        {scanResult.guestName && (
                            <p className="text-lg font-bold mb-4 opacity-90">{scanResult.guestName}</p>
                        )}

                        <p className="text-sm font-medium opacity-80 mb-8 max-w-[200px]">
                            {scanResult.message}
                        </p>

                        <button
                            onClick={resetScanner}
                            className="bg-white text-black px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all active:scale-95"
                        >
                            Next Guest
                        </button>
                    </div>
                )}
            </div>

            {/* Manual Entry */}
            <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-white/20" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white/20">Manual Entry</h4>
                </div>

                <div className="flex gap-3">
                    <input
                        type="text"
                        placeholder="Paste QR Token..."
                        value={manualToken}
                        onChange={(e) => setManualToken(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-sm outline-none focus:border-white/20 transition-all placeholder:text-white/10"
                    />
                    <button
                        onClick={() => handleCheckIn(manualToken)}
                        disabled={isProcessing || !manualToken.trim()}
                        className="px-6 py-3 bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-2 text-center relative group overflow-hidden">
                    <UserCheck className="w-5 h-5 text-white/20 mx-auto" />
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Checked In</p>
                        <p className="text-xl font-black text-white/80">{stats.checkedIn}</p>
                    </div>
                </div>
                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-2 text-center">
                    <Users className="w-5 h-5 text-white/20 mx-auto" />
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Remaining</p>
                        <p className="text-xl font-black text-white/80">{Math.max(0, stats.total - stats.checkedIn)}</p>
                    </div>
                </div>
            </div>

            {/* Offline Control */}
            <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isOffline ? "bg-amber-500/10 text-amber-500" : "bg-green-500/10 text-green-500"}`}>
                        {isOffline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white">{isOffline ? "Offline Mode Active" : "Online Mode"}</p>
                        <p className="text-[10px] text-white/20 font-medium">
                            {isOffline ? `${offlineGuests.length} guests cached` : "Live sync active"}
                        </p>
                    </div>
                </div>
                <button
                    onClick={toggleOfflineMode}
                    className="px-4 py-2 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all flex items-center gap-2"
                >
                    {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : isOffline ? "Go Online" : "Go Offline"}
                </button>
            </div>

            {/* Sync Status (Visible when queue exists) */}
            {syncQueue.length > 0 && (
                <div className="flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl animate-pulse">
                    <div className="flex items-center gap-3 text-amber-500">
                        <RotateCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
                        <p className="text-[10px] font-black uppercase tracking-widest">
                            Syncing {syncQueue.length} pending scans...
                        </p>
                    </div>
                    <Database className="w-4 h-4 text-amber-500/40" />
                </div>
            )}
        </div>
    );
}
