"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  Banknote,
  Receipt,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  RefreshCw,
  CreditCard,
  Building2,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

interface EventEarning {
  eventId: string;
  eventTitle: string;
  eventSlug?: string;
  startDate?: string;
  ticketsSold: number;
  orderCount: number;
  grossRevenue: number;
  platformFee: number;
  netEarnings: number;
  totalPaidOut: number;
  balanceDue: number;
  status: "STRIPE_AUTO" | "FULLY_PAID" | "PARTIAL" | "PENDING";
  currency: string;
  payoutHistory: any[];
}

interface PayoutsData {
  hasStripeConnect: boolean;
  totals: {
    totalGrossRevenue: number;
    totalPlatformFees: number;
    totalNetEarnings: number;
    totalPaidToUser: number;
    totalRemainingDue: number;
    totalTicketsSold: number;
  };
  events: EventEarning[];
  payoutHistory: any[];
}

export default function CreatorPayoutsSection() {
  const [data, setData] = useState<PayoutsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventEarning | null>(null);

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/payouts");
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load user payouts:", err);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (cents: number, curr = "ngn") => {
    const symbol = curr.toLowerCase() === "usd" ? "$" : "₦";
    return `${symbol}${((cents || 0) / 100).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  if (loading) {
    return (
      <div className="py-24 text-center border border-white/5 rounded-3xl bg-white/[0.02]">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
        <p className="text-white/40 text-sm">Loading your earnings and payout history...</p>
      </div>
    );
  }

  if (!data || data.events.length === 0) {
    return (
      <div className="py-20 text-center border border-white/5 rounded-3xl bg-white/[0.02] space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 mx-auto">
          <Banknote className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">No Paid Event Earnings Yet</h3>
          <p className="text-white/40 text-xs max-w-md mx-auto leading-relaxed">
            When guests purchase tickets to your paid events, your ticket earnings and payout history will appear here in real time.
          </p>
        </div>
        <Link
          href="/events/create"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider transition-all"
        >
          Create Paid Event
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Net Earnings */}
        <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5 shadow-[0_0_30px_rgba(16,185,129,0.05)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400/80">
              Your Net Earnings
            </span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-400">
            {fmt(data.totals.totalNetEarnings)}
          </p>
          <p className="text-[11px] text-emerald-300/50">
            After platform fee ({fmt(data.totals.totalPlatformFees)})
          </p>
        </div>

        {/* Paid to You */}
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
              Paid to You
            </span>
            <CheckCircle2 className="w-4 h-4 text-white/40" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">
            {fmt(data.totals.totalPaidToUser)}
          </p>
          <p className="text-[11px] text-white/40">
            Disbursed via bank transfer / Stripe
          </p>
        </div>

        {/* Remaining Balance Due */}
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
              Pending Balance
            </span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className={`text-2xl sm:text-3xl font-black ${data.totals.totalRemainingDue > 0 ? "text-amber-400" : "text-white"}`}>
            {fmt(data.totals.totalRemainingDue)}
          </p>
          <p className="text-[11px] text-white/40">
            {data.totals.totalRemainingDue > 0 ? "Pending platform remittance" : "All earnings fully paid"}
          </p>
        </div>

        {/* Total Tickets Sold */}
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
              Tickets Sold
            </span>
            <TrendingUp className="w-4 h-4 text-white/40" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">
            {data.totals.totalTicketsSold.toLocaleString()}
          </p>
          <p className="text-[11px] text-white/40">
            Gross volume: {fmt(data.totals.totalGrossRevenue)}
          </p>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-[#0a0a0b] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Banknote className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Event Earnings & Payout Breakdown</h3>
              <p className="text-xs text-white/40">Track ticket income and bank payment receipts per event</p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchPayouts}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all text-xs"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01]">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Event</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-center">Tickets</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Gross Sales</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Platform Cut</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-emerald-400">Your Net</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Paid to You</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {data.events.map((event) => (
                <tr key={event.eventId} className="hover:bg-white/[0.02] transition-colors">
                  {/* Event Title */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{event.eventTitle}</span>
                      {event.eventSlug && (
                        <Link href={`/e/${event.eventSlug}`} target="_blank" className="text-white/30 hover:text-white">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </td>

                  {/* Tickets */}
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-white font-bold text-[11px]">
                      {event.ticketsSold}
                    </span>
                  </td>

                  {/* Gross Revenue */}
                  <td className="px-6 py-4 font-bold text-white">
                    {fmt(event.grossRevenue, event.currency)}
                  </td>

                  {/* Platform Cut */}
                  <td className="px-6 py-4 font-bold text-white/40">
                    -{fmt(event.platformFee, event.currency)}
                  </td>

                  {/* Your Net */}
                  <td className="px-6 py-4 font-black text-emerald-400 text-sm">
                    {fmt(event.netEarnings, event.currency)}
                  </td>

                  {/* Paid to You */}
                  <td className="px-6 py-4">
                    <div>
                      <span className="font-bold text-white">
                        {fmt(event.totalPaidOut, event.currency)}
                      </span>
                      {event.balanceDue > 0 && event.status !== "STRIPE_AUTO" && (
                        <p className="text-[10px] text-amber-400 mt-0.5">
                          Due: {fmt(event.balanceDue, event.currency)}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Status & View Receipts */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {event.status === "STRIPE_AUTO" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Stripe Auto Payout</span>
                        </span>
                      ) : event.status === "FULLY_PAID" ? (
                        <button
                          type="button"
                          onClick={() => setSelectedEvent(event)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[11px] font-bold hover:bg-blue-500/20 transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                          <span>Paid ({event.payoutHistory.length} receipt{event.payoutHistory.length !== 1 ? "s" : ""})</span>
                        </button>
                      ) : event.status === "PARTIAL" ? (
                        <button
                          type="button"
                          onClick={() => setSelectedEvent(event)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold hover:bg-amber-500/20 transition-all"
                        >
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Partial ({fmt(event.balanceDue, event.currency)} left)</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-bold">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Pending Settlement</span>
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipts Drawer / Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0a0a0b] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">Payment Receipts</h3>
                  <p className="text-xs text-white/40">{selectedEvent.eventTitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-white/50 text-xs font-bold"
              >
                Close
              </button>
            </div>

            {/* Total Paid Summary */}
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between text-xs">
              <div>
                <p className="text-white/40 uppercase font-black text-[10px]">Your Net Earnings</p>
                <p className="font-black text-white text-base mt-0.5">{fmt(selectedEvent.netEarnings, selectedEvent.currency)}</p>
              </div>
              <div className="text-right">
                <p className="text-white/40 uppercase font-black text-[10px]">Amount Paid Out</p>
                <p className="font-black text-emerald-400 text-base mt-0.5">{fmt(selectedEvent.totalPaidOut, selectedEvent.currency)}</p>
              </div>
            </div>

            {/* Receipts List */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {selectedEvent.payoutHistory.length === 0 ? (
                <p className="text-center py-6 text-white/30 text-xs">No payment receipts yet.</p>
              ) : (
                selectedEvent.payoutHistory.map((rec) => (
                  <div key={rec.id} className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold text-[11px]">
                        {rec.paymentPlatform}
                      </span>
                      <span className="font-black text-emerald-400 text-sm">
                        +{fmt(rec.amount, rec.currency)}
                      </span>
                    </div>
                    {rec.reference && (
                      <p className="text-xs font-mono text-white/70">
                        <span className="text-white/30">Transaction Ref:</span> {rec.reference}
                      </p>
                    )}
                    {rec.notes && (
                      <p className="text-xs text-white/50 italic">
                        "{rec.notes}"
                      </p>
                    )}
                    <p className="text-[10px] text-white/30 pt-1 border-t border-white/5 font-mono">
                      Paid on: {new Date(rec.paidAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-all"
              >
                Close Receipts
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
