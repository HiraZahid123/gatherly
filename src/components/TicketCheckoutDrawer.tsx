"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Ticket, User, Mail, ArrowRight, Loader2,
  Minus, Plus, ChevronLeft, Check,
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import ETicket from "./ETicket";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type Step = "TIERS" | "DETAILS" | "PAYMENT" | "SUCCESS";

interface TicketCheckoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
  tiers: any[];
  user?: any;
  primaryColor?: string;
  onSuccess?: () => void;
}

// ── Inner Stripe payment form ──────────────────────────────────────────────
function PaymentForm({
  onSuccess,
  onError,
  loading,
  setLoading,
  primaryColor,
  guestEmail,
  guestName,
}: {
  onSuccess: (piId: string) => void;
  onError: (msg: string) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
  primaryColor: string;
  guestEmail: string;
  guestName: string;
}) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    if (!guestEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim())) {
      onError("Please go back and enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const result = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
        confirmParams: {
          return_url: window.location.href,
          payment_method_data: {
            billing_details: {
              email: guestEmail.trim(),
              name: guestName,
            },
          },
        },
      });
      if (result.error) {
        onError(result.error.message || "Payment failed. Please try again.");
      } else if (result.paymentIntent?.status === "succeeded") {
        onSuccess(result.paymentIntent.id);
      } else {
        onError("Payment status unknown. Please contact support.");
      }
    } catch (err: any) {
      onError(err.message || "Unexpected error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement
        options={{
          layout: "accordion",
          paymentMethodOrder: ["card"],
          fields: { billingDetails: { email: "never" } },
        }}
      />
      <button
        type="submit"
        disabled={!stripe || !elements || loading}
        style={{ background: loading ? undefined : primaryColor }}
        className="w-full h-12 text-white font-bold uppercase tracking-widest text-xs rounded-xl active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-2 bg-white/10"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
          <>Pay Now <ArrowRight className="w-4 h-4" /></>
        )}
      </button>
    </form>
  );
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

  const [clientSecret, setClientSecret] = useState<string | null>(null);
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
    setClientSecret(null);
    setOrderId(null);
    setError("");
    setRsvpResult(null);
    setOrderResult(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleCreatePaymentIntent = async () => {
    if (!guestName.trim()) { setError("Name is required"); return; }
    if (!guestEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim())) { setError("A valid email address is required"); return; }
    if (!selectedTier) return;
    setError("");
    setPaymentLoading(true);
    try {
      const res = await fetch(`/api/events/${event.id}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketTierId: selectedTier.id,
          quantity,
          guestName,
          guestEmail,
        }),
      });
      const data = await res.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setOrderId(data.orderId);
        goTo("PAYMENT");
      } else {
        setError(data.error || "Could not start checkout.");
      }
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePaymentSuccess = useCallback(async (paymentIntentId: string) => {
    setConfirming(true);
    setError("");
    try {
      const res = await fetch(`/api/events/${event.id}/checkout/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentIntentId }),
      });
      const data = await res.json();
      if (data.rsvp) {
        setRsvpResult({ ...data.rsvp, guestName, guestEmail });
        setOrderResult({ ...data.order, ticketTier: selectedTier });
        goTo("SUCCESS");
        onSuccess?.();
      } else {
        setError(data.error || "Could not confirm your ticket. Contact support.");
      }
    } finally {
      setConfirming(false);
    }
  }, [event.id, guestName, guestEmail, selectedTier, onSuccess]);

  const totalAmount = selectedTier ? (selectedTier.price * quantity) / 100 : 0;
  const remaining = selectedTier ? selectedTier.quantity - selectedTier.quantitySold : 0;

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d < 0 ? 40 : -40, opacity: 0 }),
  };

  const stripeAppearance = {
    theme: "night" as const,
    variables: {
      colorPrimary: primaryColor,
      colorBackground: "#111113",
      colorText: "#ffffff",
      colorDanger: "#f43f5e",
      fontFamily: "inherit",
      borderRadius: "12px",
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={step !== "SUCCESS" ? handleClose : undefined}
            className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-xl"
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed inset-y-0 right-0 z-[95] w-full sm:w-[420px] flex flex-col"
            style={{
              background: "linear-gradient(135deg, #111113 0%, #0a0a0b 100%)",
              borderLeft: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
              <div className="flex items-center gap-3">
                {(step === "DETAILS" || step === "PAYMENT") && (
                  <button
                    type="button"
                    onClick={() => goTo(step === "PAYMENT" ? "DETAILS" : "TIERS", -1)}
                    aria-label="Go back"
                    title="Go back"
                    className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <div>
                  <p
                    className="text-[9px] font-black uppercase tracking-[0.3em]"
                    style={{ color: primaryColor }}
                  >
                    {step === "SUCCESS" ? "Your Ticket" : "Get Tickets"}
                  </p>
                  <p className="text-white font-bold text-sm leading-tight line-clamp-1">
                    {event.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close drawer"
                title="Close"
                className="w-8 h-8 flex items-center justify-center text-white/30 hover:text-white transition-colors rounded-lg hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress dots */}
            {step !== "SUCCESS" && (
              <div className="flex items-center justify-center gap-2 py-3">
                {(["TIERS", "DETAILS", "PAYMENT"] as Step[]).map((s, i) => (
                  <div
                    key={s}
                    className="h-1 rounded-full transition-all duration-300"
                    style={{
                      width: step === s ? "20px" : "6px",
                      background: step === s ? primaryColor : "rgba(255,255,255,0.1)",
                    }}
                  />
                ))}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
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
                    className="space-y-5"
                  >
                    <div className="space-y-3">
                      {tiers.length === 0 ? (
                        <div className="text-center py-12 px-4 space-y-3">
                          <Ticket className="w-12 h-12 text-white/10 mx-auto animate-pulse" />
                          <p className="text-white font-bold text-sm">No tickets available yet</p>
                          <p className="text-white/40 text-xs leading-relaxed max-w-[240px] mx-auto">
                            The event host has not configured ticket tiers. Please check back later or contact the host.
                          </p>
                        </div>
                      ) : (
                        tiers.map((tier) => {
                          const isSelected = selectedTier?.id === tier.id;
                          const tierRemaining = tier.quantity - tier.quantitySold;
                          const soldOut = tierRemaining <= 0;
                          return (
                            <button
                              type="button"
                              key={tier.id}
                              disabled={soldOut}
                              onClick={() => setSelectedTier(tier)}
                              className={`w-full rounded-2xl border p-4 text-left transition-all ${
                                soldOut
                                  ? "opacity-40 cursor-not-allowed border-white/5"
                                  : isSelected
                                  ? "border-white/20 bg-white/8"
                                  : "border-white/8 bg-white/3 hover:border-white/15"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  <div
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                                      isSelected ? "border-current" : "border-white/20"
                                    }`}
                                    style={isSelected ? { borderColor: primaryColor, background: primaryColor } : {}}
                                  >
                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-white">{tier.name}</p>
                                    {tier.description && (
                                      <p className="text-xs text-white/40 mt-0.5">{tier.description}</p>
                                    )}
                                    <p className="text-[10px] text-white/30 mt-1 uppercase tracking-wider font-bold">
                                      {soldOut ? "Sold Out" : `${tierRemaining} left`}
                                    </p>
                                  </div>
                                </div>
                                <p className="text-base font-black text-white shrink-0">
                                  ${(tier.price / 100).toFixed(2)}
                                </p>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>

                    {/* Quantity */}
                    {selectedTier && (
                      <div className="flex items-center justify-between p-4 bg-white/3 rounded-2xl border border-white/8">
                        <p className="text-sm font-bold text-white">Quantity</p>
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                            aria-label="Decrease quantity"
                            title="Decrease"
                            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
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

                    {error && <p className="text-rose-400 text-sm">{error}</p>}
                  </motion.div>
                )}

                {/* ── PAYMENT ── */}
                {step === "PAYMENT" && clientSecret && (
                  <motion.div
                    key="payment"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="space-y-5"
                  >
                    <div>
                      <h3 className="text-lg font-black text-white uppercase tracking-tight">Payment</h3>
                      <p className="text-white/30 text-xs mt-1">Secured by Stripe.</p>
                    </div>

                    {confirming ? (
                      <div className="flex flex-col items-center gap-4 py-12">
                        <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
                        <p className="text-white/40 text-xs uppercase tracking-widest font-bold">
                          Confirming your ticket...
                        </p>
                      </div>
                    ) : (
                      <Elements
                        stripe={stripePromise}
                        options={{ clientSecret, appearance: stripeAppearance }}
                      >
                        <PaymentForm
                          onSuccess={handlePaymentSuccess}
                          onError={(msg: string) => setError(msg)}
                          loading={paymentLoading}
                          setLoading={setPaymentLoading}
                          primaryColor={primaryColor}
                          guestEmail={guestEmail}
                          guestName={guestName}
                        />
                      </Elements>
                    )}

                    {error && <p className="text-rose-400 text-sm">{error}</p>}
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

            {/* Footer CTA — hidden on success/payment steps */}
            {(step === "TIERS" || step === "DETAILS") && (
              <div className="px-6 pb-6 pt-3 border-t border-white/5 space-y-3">
                {/* Order summary */}
                {selectedTier && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/40">
                      {quantity}× {selectedTier.name}
                    </span>
                    <span className="text-white font-black">${totalAmount.toFixed(2)}</span>
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
                    <Loader2 className="w-4 h-4 animate-spin" />
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
