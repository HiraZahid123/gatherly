"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, AlertCircle, ExternalLink, Zap, Info } from "lucide-react";

interface ConnectStatus {
  connected: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
  stripeAccountId?: string;
}

export default function StripeConnectPanel() {
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    fetch("/api/stripe/connect/status")
      .then((r) => r.json())
      .then(setStatus)
      .finally(() => setLoading(false));
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch("/api/stripe/connect/onboard", { method: "POST" });
      const { url, error } = await res.json();
      if (url) window.location.href = url;
      else alert(error || "Failed to start Stripe setup");
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
      </div>
    );
  }

  const isFullyActive = status?.connected && status.chargesEnabled && status.payoutsEnabled;
  const isPartial = status?.connected && (!status.chargesEnabled || !status.payoutsEnabled);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Status card */}
      <div className={`rounded-2xl border p-5 flex items-start gap-4 ${
        isFullyActive
          ? "bg-green-500/5 border-green-500/20"
          : isPartial
          ? "bg-amber-500/5 border-amber-500/20"
          : "bg-white/3 border-white/8"
      }`}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          isFullyActive ? "bg-green-500/20" : isPartial ? "bg-amber-500/20" : "bg-white/5"
        }`}>
          {isFullyActive ? (
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          ) : isPartial ? (
            <AlertCircle className="w-5 h-5 text-amber-400" />
          ) : (
            <Zap className="w-5 h-5 text-white/30" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${
            isFullyActive ? "text-green-400" : isPartial ? "text-amber-400" : "text-white/40"
          }`}>
            {isFullyActive ? "Connected & Active" : isPartial ? "Setup Incomplete" : "Not Connected"}
          </p>
          <p className="text-white/60 text-xs mt-1">
            {isFullyActive
              ? "Your Stripe account is ready to accept payments from guests."
              : isPartial
              ? "Additional verification is required before you can receive payouts."
              : "Connect a Stripe account to sell tickets and receive payouts."}
          </p>
          {status?.stripeAccountId && (
            <p className="text-white/20 text-[10px] mt-2 font-mono">{status.stripeAccountId}</p>
          )}
        </div>
      </div>

      {/* Capability badges */}
      {status?.connected && (
        <div className="flex gap-3">
          <div className={`flex-1 rounded-xl border p-3 text-center ${
            status.chargesEnabled ? "border-green-500/20 bg-green-500/5" : "border-white/8 bg-white/3"
          }`}>
            <p className={`text-[9px] font-black uppercase tracking-widest ${
              status.chargesEnabled ? "text-green-400" : "text-white/20"
            }`}>Charges</p>
            <p className={`text-xs font-bold mt-0.5 ${
              status.chargesEnabled ? "text-green-400" : "text-white/30"
            }`}>{status.chargesEnabled ? "Enabled" : "Pending"}</p>
          </div>
          <div className={`flex-1 rounded-xl border p-3 text-center ${
            status.payoutsEnabled ? "border-green-500/20 bg-green-500/5" : "border-white/8 bg-white/3"
          }`}>
            <p className={`text-[9px] font-black uppercase tracking-widest ${
              status.payoutsEnabled ? "text-green-400" : "text-white/20"
            }`}>Payouts</p>
            <p className={`text-xs font-bold mt-0.5 ${
              status.payoutsEnabled ? "text-green-400" : "text-white/30"
            }`}>{status.payoutsEnabled ? "Enabled" : "Pending"}</p>
          </div>
        </div>
      )}

      {/* Test Mode Helper Box */}
      {!isFullyActive && (
        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" /> Dev / Test Mode Guide
          </p>
          <p className="text-white/40 text-[11px] leading-relaxed font-medium">
            To easily test ticket purchases locally, click the connect button below. When Stripe's onboarding form opens, look for the banner at the top and select <span className="text-white/60 font-bold">"Skip this form"</span> or <span className="text-white/60 font-bold">"Use test data"</span>. This will instantly activate the account for testing without entering any real banking details!
          </p>
        </div>
      )}

      {/* Action button */}
      {!isFullyActive && (
        <button
          onClick={handleConnect}
          disabled={connecting}
          className="w-full h-12 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-white/90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {connecting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <ExternalLink className="w-4 h-4" />
              {isPartial ? "Complete Setup" : "Connect Stripe Account"}
            </>
          )}
        </button>
      )}

      <p className="text-[10px] text-white/20 text-center leading-relaxed">
        Powered by Stripe Connect. We charge a 3% platform fee on ticket sales.
        Your guests pay Stripe's standard processing fees.
      </p>
    </motion.div>
  );
}
