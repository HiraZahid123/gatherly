"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function StripeRefreshPage() {
  useEffect(() => {
    const reStart = async () => {
      const res = await fetch("/api/stripe/connect/onboard", { method: "POST" });
      const { url } = await res.json();
      if (url) window.location.href = url;
    };
    reStart();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
      <div className="text-center space-y-3">
        <Loader2 className="w-8 h-8 text-white/30 animate-spin mx-auto" />
        <p className="text-white/30 text-xs uppercase tracking-widest font-bold">
          Refreshing your Stripe link...
        </p>
      </div>
    </div>
  );
}
