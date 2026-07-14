"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, AlertCircle, ArrowRight } from "lucide-react";

export default function StripeReturnPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "incomplete">("loading");

  useEffect(() => {
    const check = async () => {
      const res = await fetch("/api/stripe/connect/status");
      const data = await res.json();
      setStatus(data.chargesEnabled ? "success" : "incomplete");
    };
    check();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-10 text-center space-y-6"
      >
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 text-white/40 animate-spin mx-auto" />
            <p className="text-white/60 text-sm uppercase tracking-widest font-bold">
              Verifying your Stripe account...
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-white uppercase tracking-tight">
                You're all set!
              </h1>
              <p className="text-white/40 text-sm">
                Your Stripe account is connected and ready to accept payments.
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full h-12 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-white/90 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              Back to Dashboard <ArrowRight className="w-4 h-4" />
            </button>
          </>
        )}

        {status === "incomplete" && (
          <>
            <div className="w-20 h-20 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10 text-amber-400" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-white uppercase tracking-tight">
                Setup Incomplete
              </h1>
              <p className="text-white/40 text-sm">
                Your Stripe account isn't fully verified yet. Complete onboarding to start accepting payments.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={async () => {
                  const res = await fetch("/api/stripe/connect/onboard", { method: "POST" });
                  const { url } = await res.json();
                  window.location.href = url;
                }}
                className="w-full h-12 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-white/90 active:scale-95 transition-all"
              >
                Continue Setup
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="text-white/40 hover:text-white text-xs uppercase tracking-widest font-bold transition-colors"
              >
                Skip for now
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
