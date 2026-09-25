"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Ticket, User, Mail, ArrowRight, Loader2,
  Minus, Plus, ChevronLeft, Check,
} from "lucide-react";
import ETicket from "./ETicket";

type Step = "TIERS" | "DETAILS" | "SUCCESS";

interface TicketCheckoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
  tiers: any[];
  user?: any;
  primaryColor?: string;
  onSuccess?: () => void;
}

// ── Main Drawer ───────────────────────────────────────────────────────────
export default function TicketCheckoutDrawer({
  isOpen,
  onClose,
  event,
  tiers,
  user,
  primaryColor = "#6366f1",
  onSuccess,
}: TicketCheckoutDrawerProps) {
  const [step, setStep] = useState<Step>("TIERS");
  const [direction, setDirection] = useState(1);

  const [selectedTier, setSelectedTier] = useState<any>(tiers[0] ?? null);
  const [quantity, setQuantity] = useState(1);

  const [guestName, setGuestName] = useState(user?.name || "");
  const [guestEmail, setGuestEmail] = useState(user?.email || "");

  const [orderId, setOrderId] = useState<string | null>(null);

  const [paymentLoading, setPaymentLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  const [rsvpResult, setRsvpResult] = useState<any>(null);
  const [orderResult, setOrderResult] = useState<any>(null);


  const goTo = (next: Step, dir = 1) => { setDirection(dir); setStep(next); };

  const reset = () => {
    setStep("TIERS");
    setSelectedTier(tiers[0] ?? null);
    setQuantity(1);
    setGuestName(user?.name || "");
    setGuestEmail(user?.email || "");
    setOrderId(null);
    setError("");
    setRsvpResult(null);
    setOrderResult(null);
    setPaymentLoading(false);
    setConfirming(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCreatePaymentIntent = async () => {
    if (!selectedTier) return;
    if (!guestName.trim() || !guestEmail.trim()) {
      setError("Please enter your name and email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setPaymentLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/events/${event.id}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketTierId: selectedTier.id,
          quantity,
          guestName: guestName.trim(),
          guestEmail: guestEmail.trim().toLowerCase(),
        }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // Failed to parse response
      }

      if (!res.ok) {
        setError(data?.error || `Checkout failed (${res.status})`);
        return;
      }

      // FREE ORDER: Direct confirmation
      if (data?.freeOrder) {
        setRsvpResult({ ...data.rsvp, guestName, guestEmail });
        setOrderResult({ ...data.order, ticketTier: selectedTier });
        goTo("SUCCESS");
        onSuccess?.();
        return;
      }

      // PAYSTACK GATEWAY: Standard Checkout Redirect
      if (data?.gateway === "PAYSTACK") {
        setOrderId(data.orderId);
        if (data.authorizationUrl) {
          window.location.href = data.authorizationUrl;
          return;
        }
      }

      setError(data?.error || "Could not start checkout.");
    } catch (err: any) {
      setError(err?.message || "Could not start checkout. Please try again.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePaymentSuccess = useCallback(async (reference: string) => {
    setConfirming(true);
    setError("");
    try {
      const res = await fetch(`/api/events/${event.id}/checkout/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // Failed to parse response
      }

      if (!res.ok) {
        setError(data?.error || `Confirmation failed (${res.status})`);
        return;
      }

      if (data?.rsvp) {
        setRsvpResult({ ...data.rsvp, guestName, guestEmail });
        setOrderResult({ ...data.order, ticketTier: selectedTier });
        goTo("SUCCESS");
        onSuccess?.();
      } else {
        setError(data?.error || "Could not confirm your ticket. Contact support.");
      }
    } catch (err: any) {
      setError(err?.message || "Could not confirm your ticket. Contact support.");
    } finally {
      setConfirming(false);
    }
  }, [event.id, guestName, guestEmail, selectedTier, onSuccess]);

  const totalAmount = selectedTier ? (selectedTier.price * quantity) / 100 : 0;
  const effectiveCapacity = event?.capacity || event?.theme?.settings?.rsvp?.capacity || null;
  const acceptedCount = event?.rsvpCount ?? event?._count?.rsvps ?? 0;
  const eventSpotsLeft = effectiveCapacity ? Math.max(0, effectiveCapacity - acceptedCount) : Infinity;

  const tierRemaining = selectedTier ? Math.max(0, selectedTier.quantity - selectedTier.quantitySold) : 0;
  const remaining = Math.min(tierRemaining, eventSpotsLeft);

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d < 0 ? 40 : -40, opacity: 0 }),
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />

          {/* Drawer panel */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
            className="fixed inset-x-0 bottom-0 z-50 max-w-lg mx-auto w-full bg-[#0d0d0f] border-t border-white/10 rounded-t-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                {step !== "TIERS" && step !== "SUCCESS" && (
                  <button
                    type="button"
                    onClick={() => goTo(step === "DETAILS" ? "TIERS" : "DETAILS", -1)}
                    className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white transition-colors mr-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-wider">
                    {step === "TIERS" && "Select Tickets"}
                    {step === "DETAILS" && "Your Information"}
                    {step === "SUCCESS" && "Ticket Confirmed"}
                  </h2>
                  <p className="text-[11px] text-white/40 truncate max-w-[240px]">
                    {event?.title}
                  </p>
                </div>
              </div>

              {/* Step indicator dots */}
              {step !== "SUCCESS" && (
                <div className="flex items-center gap-1.5">
                  {(["TIERS", "DETAILS"] as Step[]).map((s, idx) => (
                    <div
                      key={s}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        step === s
                          ? "w-5 bg-white"
                          : idx < (step === "DETAILS" ? 1 : 0)
                          ? "w-1.5 bg-white/40"
                          : "w-1.5 bg-white/15"
                      }`}
                    />
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <AnimatePresence mode="wait" custom={direction}>

                {/* ── TIERS ── */}
                {step === "TIERS" && (
                  <motion.div
                    key="tiers"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="space-y-4"
                  >
                    <p className="text-white/40 text-xs">Choose your ticket tier:</p>

                    <div className="space-y-2.5">
                      {tiers.map((t) => {
                        const tierRem = Math.max(0, t.quantity - t.quantitySold);
                        const effectiveRem = Math.min(tierRem, eventSpotsLeft);
                        const isSoldOut = effectiveRem <= 0;
                        const isSelected = selectedTier?.id === t.id;
                        const price = t.price === 0 ? "Free" : `₦${(t.price / 100).toLocaleString()} NGN`;

                        return (
                          <div
                            key={t.id}
                            onClick={() => !isSoldOut && setSelectedTier(t)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                              isSoldOut
                                ? "opacity-40 border-white/5 bg-white/[0.01] cursor-not-allowed"
                                : isSelected
                                ? "border-white/30 bg-white/10 shadow-lg"
                                : "border-white/5 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.05]"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-white text-sm">
                                    {t.name}
                                  </span>
                                  {isSoldOut ? (
                                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                                      {eventSpotsLeft <= 0 ? "Event Full" : "Sold Out"}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-white/40 font-mono">
                                      {effectiveRem} left
                                    </span>
                                  )}
                                </div>
                                {t.description && (
                                  <p className="text-white/40 text-xs mt-1 leading-relaxed">
                                    {t.description}
                                  </p>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-black text-white text-base">
                                  {price}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Quantity selector */}
                    {selectedTier && remaining > 1 && (
                      <div className="pt-2 flex items-center justify-between border-t border-white/5">
                        <span className="text-white/60 text-xs font-bold uppercase tracking-wider">Quantity</span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                            disabled={quantity <= 1}
                            aria-label="Decrease quantity"
                            title="Decrease"
                            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-white font-black w-4 text-center">{quantity}</span>
                          <button
                            type="button"
                            onClick={() => setQuantity((q) => Math.min(remaining, q + 1))}
                            disabled={quantity >= remaining}
                            aria-label="Increase quantity"
                            title="Increase"
                            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── DETAILS ── */}
                {step === "DETAILS" && (
                  <motion.div
                    key="details"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="space-y-5"
                  >
                    {confirming ? (
                      <div className="flex flex-col items-center gap-4 py-12">
                        <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
                        <p className="text-white/40 text-xs uppercase tracking-widest font-bold">
                          Confirming your ticket...
                        </p>
                      </div>
                    ) : (
                      <>
                        <div>
                          <h3 className="text-lg font-black text-white uppercase tracking-tight">Your Details</h3>
                          <p className="text-white/30 text-xs mt-1">We'll send your ticket to this email.</p>
                        </div>

                        <div className="space-y-3">
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                            <input
                              type="text"
                              placeholder="Full name"
                              autoFocus
                              value={guestName}
                              onChange={(e) => setGuestName(e.target.value)}
                              className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                            />
                          </div>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                            <input
                              type="email"
                              placeholder="Email address"
                              value={guestEmail}
                              onChange={(e) => setGuestEmail(e.target.value)}
                              className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                            />
                          </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs">
                          <span className="text-white/50">Payment Gateway</span>
                          <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            Paystack Secured (NGN)
                          </span>
                        </div>

                        {error && <p className="text-rose-400 text-sm">{error}</p>}
                      </>
                    )}
                  </motion.div>
                )}

                {/* ── SUCCESS ── */}
                {step === "SUCCESS" && (
                  <motion.div
                    key="success"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <ETicket
                      event={event}
                      rsvp={rsvpResult}
                      order={orderResult}
                      primaryColor={primaryColor}
                      onClose={handleClose}
                    />
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* Footer CTA — hidden on success */}
            {(step === "TIERS" || step === "DETAILS") && !confirming && (
              <div className="px-6 pb-6 pt-3 border-t border-white/5 space-y-3">
                {/* Order summary */}
                {selectedTier && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/40">
                      {quantity}× {selectedTier.name}
                    </span>
                    <span className="text-white font-black">
                      {totalAmount === 0 ? "Free" : `₦${totalAmount.toLocaleString()} NGN`}
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  disabled={!selectedTier || (step === "DETAILS" && paymentLoading)}
                  onClick={
                    step === "TIERS"
                      ? () => goTo("DETAILS")
                      : handleCreatePaymentIntent
                  }
                  style={{ background: selectedTier ? primaryColor : undefined }}
                  className="w-full h-12 text-white font-bold uppercase tracking-widest text-xs rounded-xl active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-2 bg-white/10"
                >
                  {paymentLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting to Paystack...</>
                  ) : step === "TIERS" ? (
                    <><Ticket className="w-4 h-4" /> Continue</>
                  ) : (
                    <><ArrowRight className="w-4 h-4" /> Proceed to Payment</>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
