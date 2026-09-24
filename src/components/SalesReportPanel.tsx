"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Loader2, TrendingUp, Ticket, DollarSign,
  ArrowDownRight, ChevronRight, CreditCard,
  CheckCircle2, Clock, Receipt, Banknote, ShieldCheck,
  RotateCcw, X, AlertCircle
} from "lucide-react";

interface SalesReportPanelProps {
  eventId: string;
  primaryColor?: string;
}

export default function SalesReportPanel({ eventId, primaryColor = "#6366f1" }: SalesReportPanelProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Refund Request State
  const [requestingOrder, setRequestingOrder] = useState<any>(null);
  const [requestReason, setRequestReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [requestSuccess, setRequestSuccess] = useState("");

  const loadSales = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/sales`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, [eventId]);

  const handleSubmitRefundRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestingOrder) return;
    if (!requestReason.trim()) {
      setRequestError("Please provide a reason for the refund request.");
      return;
    }

    setIsSubmitting(true);
    setRequestError("");
    try {
      const res = await fetch(`/api/events/${eventId}/orders/${requestingOrder.id}/refund-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: requestReason.trim() }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setRequestSuccess("Refund request submitted for admin review!");
        setTimeout(() => {
          setRequestingOrder(null);
          setRequestReason("");
          setRequestSuccess("");
          loadSales();
        }, 1500);
      } else {
        setRequestError(json.error || "Failed to submit request.");
      }
    } catch (err: any) {
      setRequestError(err?.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <p className="text-center text-white/30 text-sm py-10">
        {data?.error || "No sales data available."}
      </p>
    );
  }

  const fmt = (cents: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format((cents || 0) / 100);

  const netEarnings = data.netEarnings ?? Math.max(0, data.totalRevenue - (data.platformFee || 0));
  const totalPaidOut = data.totalPaidOut || 0;
  const balanceDue = data.balanceDue ?? Math.max(0, netEarnings - totalPaidOut);

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className={`grid ${data.totalRefundedAmount > 0 ? "grid-cols-3" : "grid-cols-2"} gap-3`}>
        {/* Gross Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/3 border border-white/8 rounded-2xl p-4 space-y-1.5"
        >
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Gross Sales</p>
            <TrendingUp className="w-4 h-4" style={{ color: primaryColor }} />
          </div>
          <p className="text-lg font-black text-white">{fmt(data.totalRevenue)}</p>
          <p className="text-[10px] text-white/30">{data.totalTicketsSold} tickets sold</p>
        </motion.div>

        {/* Refunds if any */}
        {data.totalRefundedAmount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.03 }}
            className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-rose-400">Refunded</p>
              <Receipt className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-lg font-black text-rose-400">-{fmt(data.totalRefundedAmount)}</p>
            <p className="text-[10px] text-rose-400/60 font-medium">{data.totalRefundedTickets || 0} tickets returned</p>
          </motion.div>
        )}

        {/* Net Host Earnings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 space-y-1.5"
        >
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400">Your Net Earnings</p>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-lg font-black text-emerald-400">{fmt(netEarnings)}</p>
          <p className="text-[10px] text-emerald-400/60 font-medium">After platform fee ({fmt(data.platformFee || 0)})</p>
        </motion.div>
      </div>

      {/* Payout Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/3 border border-white/8 rounded-2xl p-4 space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Banknote className="w-4 h-4 text-emerald-400" />
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/50">Payout & Settlement</p>
          </div>
          {balanceDue === 0 && netEarnings > 0 ? (
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 text-[10px] font-bold border border-blue-500/20 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Fully Settled
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 text-[10px] font-bold border border-amber-500/20 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Pending Disbursal
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-1">
          <div className="p-3 bg-black/40 rounded-xl border border-white/5">
            <p className="text-[9px] text-white/40 uppercase font-black tracking-wider">Amount Paid to You</p>
            <p className="text-sm font-black text-white mt-0.5">{fmt(totalPaidOut)}</p>
          </div>
          <div className="p-3 bg-black/40 rounded-xl border border-white/5">
            <p className="text-[9px] text-amber-400/80 uppercase font-black tracking-wider">Remaining Balance</p>
            <p className="text-sm font-black text-amber-400 mt-0.5">{fmt(balanceDue)}</p>
          </div>
        </div>

        {/* Payout receipts if any recorded */}
        {data.payoutHistory?.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-white/5">
            <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold flex items-center gap-1.5">
              <Receipt className="w-3 h-3 text-emerald-400" /> Payment Receipts
            </p>
            <div className="space-y-1.5">
              {data.payoutHistory.map((rec: any) => (
                <div key={rec.id} className="p-2.5 bg-black/50 rounded-xl border border-white/5 text-xs flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white text-xs">{rec.paymentPlatform}</p>
                    <p className="text-[10px] text-white/40 font-mono">
                      {new Date(rec.paidAt).toLocaleDateString()} {rec.reference ? `· Ref: ${rec.reference}` : ""}
                    </p>
                  </div>
                  <span className="font-black text-emerald-400 text-xs">+{fmt(rec.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Tier breakdown */}
      {data.byTier?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-2"
        >
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 px-1">By Tier</p>
          {data.byTier.map((tier: any) => (
            <div
              key={tier.id}
              className="bg-white/3 border border-white/8 rounded-xl p-3 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">{tier.name}</p>
                <p className="text-[10px] text-white/30">
                  {tier.sold}/{tier.quantity} sold · {fmt(tier.price)} each
                </p>
              </div>
              <p className="text-sm font-black text-white shrink-0">{fmt(tier.revenue)}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Recent orders */}
      {data.recentOrders?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 px-1">
            Recent Orders
          </p>
          <div className="space-y-1">
            {data.recentOrders.map((order: any) => (
              <div
                key={order.id}
                className="flex items-center gap-3 px-3 py-2.5 bg-white/2 hover:bg-white/4 rounded-xl transition-colors"
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${order.status === "REFUNDED" ? "bg-rose-500/10 text-rose-400" : "bg-white/5 text-green-400"}`}>
                  <ArrowDownRight className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-white leading-none">{order.guestName || order.guestEmail}</p>
                    {order.status === "REFUNDED" && (
                      <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[9px] uppercase tracking-wider">
                        Refunded
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-white/30 mt-0.5">
                    {order.quantity}× {order.tierName} ·{" "}
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className={`text-xs font-black shrink-0 ${order.status === "REFUNDED" ? "text-rose-400/80 line-through" : "text-white"}`}>
                      {fmt(order.totalAmount)}
                    </p>
                  </div>
                  {order.status === "COMPLETED" && (
                    <div>
                      {order.refundRequested ? (
                        <span className="px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold text-[9px] uppercase tracking-wider flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          Requested
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setRequestingOrder(order);
                            setRequestReason("");
                            setRequestError("");
                            setRequestSuccess("");
                          }}
                          className="px-2 py-1 rounded-lg bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 border border-white/10 text-white/50 font-bold text-[10px] uppercase tracking-wider transition-colors flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Refund
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {data.totalTicketsSold === 0 && (
        <div className="text-center py-8 space-y-2">
          <DollarSign className="w-8 h-8 text-white/10 mx-auto" />
          <p className="text-white/20 text-xs uppercase tracking-widest font-bold">No sales yet</p>
        </div>
      )}

      {/* ─── MODAL: CREATOR REFUND REQUEST ─── */}
      {requestingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0a0a0b] border border-white/10 rounded-3xl p-6 sm:p-7 max-w-md w-full space-y-5 shadow-2xl relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">Request Ticket Refund</h3>
                  <p className="text-xs text-white/40">Submit for platform administrator approval</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRequestingOrder(null)}
                className="p-1 rounded-lg text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Order summary */}
            <div className="p-3.5 bg-white/[0.03] border border-white/8 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-white/40">Guest</span>
                <span className="font-bold text-white truncate max-w-[200px]">
                  {requestingOrder.guestName || requestingOrder.guestEmail}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/40">Ticket</span>
                <span className="font-medium text-white">{requestingOrder.quantity}× {requestingOrder.tierName}</span>
              </div>
              <div className="pt-2 border-t border-white/5 flex items-center justify-between font-black">
                <span className="text-rose-300">Amount to Refund</span>
                <span className="text-rose-400">{fmt(requestingOrder.totalAmount)}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <span>
                Once approved by the admin, the funds will be reversed to the customer via Paystack, their QR ticket will be cancelled, and the ticket will return to your tier inventory.
              </span>
            </div>

            {/* Reason Form */}
            <form onSubmit={handleSubmitRefundRequest} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-white/50 block">
                  Reason for Refund (Required)
                </label>
                <textarea
                  rows={3}
                  required
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder="e.g. Guest had a travel emergency, duplicate booking, or event time changed..."
                  className="w-full bg-black/60 border border-white/15 focus:border-amber-500 rounded-2xl px-3.5 py-2.5 text-white text-xs outline-none transition-all placeholder:text-white/20 resize-none"
                />
              </div>

              {requestError && (
                <p className="text-rose-400 text-xs font-medium">{requestError}</p>
              )}

              {requestSuccess && (
                <p className="text-emerald-400 text-xs font-bold">{requestSuccess}</p>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setRequestingOrder(null)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !requestReason.trim()}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider transition-all disabled:opacity-40"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Request</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
