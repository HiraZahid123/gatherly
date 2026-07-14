"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Loader2, TrendingUp, Ticket, DollarSign,
  ArrowDownRight, ChevronRight, CreditCard,
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

  const fmt = (cents: number, currency = "usd") =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/3 border border-white/8 rounded-2xl p-4 space-y-2"
        >
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Revenue</p>
            <TrendingUp className="w-4 h-4" style={{ color: primaryColor }} />
          </div>
          <p className="text-xl font-black text-white">{fmt(data.totalRevenue)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white/3 border border-white/8 rounded-2xl p-4 space-y-2"
        >
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Tickets</p>
            <Ticket className="w-4 h-4" style={{ color: primaryColor }} />
          </div>
          <p className="text-xl font-black text-white">{data.totalTicketsSold}</p>
        </motion.div>
      </div>

      {/* Stripe balance */}
      {data.stripeBalance && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/3 border border-white/8 rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4" style={{ color: primaryColor }} />
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Stripe Balance</p>
          </div>
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Available</p>
              <p className="text-sm font-black text-green-400">
                {fmt(data.stripeBalance.available, data.stripeBalance.currency)}
              </p>
            </div>
            <div>
              <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Pending</p>
              <p className="text-sm font-black text-white/60">
                {fmt(data.stripeBalance.pending, data.stripeBalance.currency)}
              </p>
            </div>
          </div>
        </motion.div>
      )}

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
                  {tier.sold}/{tier.quantity} sold · {fmt(tier.price, tier.currency)} each
                </p>
              </div>
              <p className="text-sm font-black text-white shrink-0">{fmt(tier.revenue, tier.currency)}</p>
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
                <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                  <ArrowDownRight className="w-3.5 h-3.5 text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white leading-none">{order.guestName || order.guestEmail}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">
                    {order.quantity}× {order.tierName} ·{" "}
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-xs font-black text-white shrink-0">
                  {fmt(order.totalAmount, order.currency)}
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
