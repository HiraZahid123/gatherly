"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Loader2, TrendingUp, Ticket, DollarSign,
  ArrowDownRight, ChevronRight, CreditCard,
  CheckCircle2, Clock, Receipt, Banknote, ShieldCheck
} from "lucide-react";

interface SalesReportPanelProps {
  eventId: string;
  primaryColor?: string;
}

export default function SalesReportPanel({ eventId, primaryColor = "#6366f1" }: SalesReportPanelProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/events/${eventId}/sales`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [eventId]);

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
          {data.hasStripeConnected ? (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Stripe Auto
            </span>
          ) : balanceDue === 0 && netEarnings > 0 ? (
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 text-[10px] font-bold border border-blue-500/20 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Fully Settled
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 text-[10px] font-bold border border-amber-500/20 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Pending Disbursal
            </span>
          )}
        </div>

        {data.hasStripeConnected && data.stripeBalance ? (
          <div className="flex items-center gap-6 pt-1">
            <div>
              <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Stripe Available</p>
              <p className="text-sm font-black text-green-400">{fmt(data.stripeBalance.available)}</p>
            </div>
            <div>
              <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Stripe Pending</p>
              <p className="text-sm font-black text-white/60">{fmt(data.stripeBalance.pending)}</p>
            </div>
          </div>
        ) : (
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
        )}

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
                <p className={`text-xs font-black shrink-0 ${order.status === "REFUNDED" ? "text-rose-400/80 line-through" : "text-white"}`}>
                  {fmt(order.totalAmount)}
                </p>
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
    </div>
  );
}
