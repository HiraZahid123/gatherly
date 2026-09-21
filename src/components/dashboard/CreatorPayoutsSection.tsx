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
  Printer,
  Download,
  RotateCcw,
} from "lucide-react";

interface EventEarning {
  eventId: string;
  eventTitle: string;
  eventSlug?: string;
  startDate?: string;
  ticketsSold: number;
  refundedTickets?: number;
  refundedAmount?: number;
  orderCount: number;
  refundedCount?: number;
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
    totalRefundedAmount?: number;
    totalRefundedTickets?: number;
    netGrossRevenue?: number;
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

  const handleExportCSV = () => {
    if (!data?.events || data.events.length === 0) return;
    const headers = [
      "Event Title",
      "Event Date",
      "Paid Tickets Sold",
      "Refunded Tickets",
      "Gross Sales (NGN)",
      "Refunded Amount (NGN)",
      "Platform Fee Cut (NGN)",
      "Your Net Earnings (NGN)",
      "Amount Paid Out (NGN)",
      "Balance Due (NGN)",
      "Settlement Status",
    ];
    const rows = data.events.map((e) => [
      `"${e.eventTitle.replace(/"/g, '""')}"`,
      `"${e.startDate ? new Date(e.startDate).toLocaleDateString() : "TBD"}"`,
      e.ticketsSold,
      e.refundedTickets || 0,
      ((e.grossRevenue || 0) / 100).toFixed(2),
      ((e.refundedAmount || 0) / 100).toFixed(2),
      ((e.platformFee || 0) / 100).toFixed(2),
      ((e.netEarnings || 0) / 100).toFixed(2),
      ((e.totalPaidOut || 0) / 100).toFixed(2),
      ((e.balanceDue || 0) / 100).toFixed(2),
      e.status,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `earnings-and-payout-report-${new Date().toISOString().split("T")[0]}.csv`);
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
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
    <>
      {/* ─── ON-SCREEN INTERACTIVE DASHBOARD VIEW ─── */}
      <div className="space-y-8 animate-in fade-in duration-300 print:hidden">
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
            <div className="flex items-center justify-between text-[11px] text-white/40">
              <span>Gross: {fmt(data.totals.totalGrossRevenue)}</span>
              {(data.totals.totalRefundedAmount || 0) > 0 && (
                <span className="text-rose-400/80 font-mono">
                  Refunds: -{fmt(data.totals.totalRefundedAmount || 0)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Main Ledger Table */}
        <div className="bg-[#0a0a0b] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Banknote className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Event Earnings & Payout Breakdown</h3>
                <p className="text-xs text-white/40">Track ticket income, refunds, and bank payment receipts per event</p>
              </div>
            </div>

            {/* Actions: Export CSV, Print Statement, Refresh */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-all text-xs font-bold border border-white/10"
                title="Export Report to CSV"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-all text-xs font-bold border border-white/10"
                title="Print or Save as PDF"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                <span>Print Report</span>
              </button>

              <button
                type="button"
                onClick={fetchPayouts}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all text-xs border border-white/10"
                title="Refresh"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
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
                      {event.startDate && (
                        <p className="text-[10px] text-white/30 font-mono mt-0.5">
                          {new Date(event.startDate).toLocaleDateString()}
                        </p>
                      )}
                    </td>

                    {/* Tickets */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="inline-flex px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-white font-bold text-[11px]">
                          {event.ticketsSold}
                        </span>
                        {(event.refundedTickets || 0) > 0 && (
                          <span className="text-[9px] text-rose-400/80 mt-0.5 font-mono">
                            {event.refundedTickets} refunded
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Gross Revenue */}
                    <td className="px-6 py-4">
                      <p className="font-bold text-white">
                        {fmt(event.grossRevenue, event.currency)}
                      </p>
                      {(event.refundedAmount || 0) > 0 && (
                        <p className="text-[10px] text-rose-400/80 font-mono mt-0.5">
                          Refunded: -{fmt(event.refundedAmount || 0, event.currency)}
                        </p>
                      )}
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
                          &quot;{rec.notes}&quot;
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

      {/* ─── PRINT-ONLY FORMAL FINANCIAL STATEMENT VIEW ─── */}
      <div className="hidden print:block text-black bg-white p-8 space-y-8 font-sans">
        <div className="border-b-2 border-black pb-4 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase">JollyWitMe</h1>
            <p className="text-xs uppercase font-bold tracking-widest text-gray-600">Creator Earnings & Payout Statement</p>
          </div>
          <div className="text-right text-xs">
            <p className="font-bold">Generated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
            <p className="text-gray-600 font-mono">Status: Official Statement</p>
          </div>
        </div>

        {/* Statement Summary KPI Grid */}
        <div className="grid grid-cols-4 gap-4 p-4 border border-gray-300 rounded-lg bg-gray-50">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Total Net Earnings</p>
            <p className="text-lg font-black text-black">{fmt(data.totals.totalNetEarnings)}</p>
            <p className="text-[9px] text-gray-500">Platform Cut: {fmt(data.totals.totalPlatformFees)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Disbursed (Paid Out)</p>
            <p className="text-lg font-black text-black">{fmt(data.totals.totalPaidToUser)}</p>
            <p className="text-[9px] text-gray-500">Direct Bank / Stripe</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Pending Balance Due</p>
            <p className="text-lg font-black text-black">{fmt(data.totals.totalRemainingDue)}</p>
            <p className="text-[9px] text-gray-500">{data.totals.totalRemainingDue > 0 ? "Awaiting remittance" : "Settled"}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Tickets Sold</p>
            <p className="text-lg font-black text-black">{data.totals.totalTicketsSold}</p>
            <p className="text-[9px] text-gray-500">Gross: {fmt(data.totals.totalGrossRevenue)}</p>
          </div>
        </div>

        {/* Events Table */}
        <div className="space-y-2">
          <h3 className="font-bold text-sm uppercase tracking-wider text-gray-800">Event Ticket Sales & Share</h3>
          <table className="w-full text-left text-xs border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th className="p-2.5 font-bold">Event Title</th>
                <th className="p-2.5 font-bold text-center">Tickets</th>
                <th className="p-2.5 font-bold">Gross Sales</th>
                <th className="p-2.5 font-bold">Platform Fee</th>
                <th className="p-2.5 font-bold">Your Net Share</th>
                <th className="p-2.5 font-bold">Amount Paid</th>
                <th className="p-2.5 font-bold">Balance Due</th>
                <th className="p-2.5 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.events.map((e) => (
                <tr key={e.eventId}>
                  <td className="p-2.5 font-semibold">{e.eventTitle}</td>
                  <td className="p-2.5 text-center">{e.ticketsSold}</td>
                  <td className="p-2.5">{fmt(e.grossRevenue, e.currency)}</td>
                  <td className="p-2.5">-{fmt(e.platformFee, e.currency)}</td>
                  <td className="p-2.5 font-bold">{fmt(e.netEarnings, e.currency)}</td>
                  <td className="p-2.5">{fmt(e.totalPaidOut, e.currency)}</td>
                  <td className="p-2.5 font-bold">{fmt(e.balanceDue, e.currency)}</td>
                  <td className="p-2.5 font-mono text-[10px] uppercase">{e.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Payout History Ledger */}
        <div className="space-y-2 pt-4">
          <h3 className="font-bold text-sm uppercase tracking-wider text-gray-800">Disbursed Payout Transactions & Receipts</h3>
          {data.payoutHistory.length === 0 ? (
            <p className="text-xs text-gray-500 italic p-3 border border-gray-200 rounded">No payout receipts recorded yet.</p>
          ) : (
            <table className="w-full text-left text-xs border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300">
                  <th className="p-2.5 font-bold">Date</th>
                  <th className="p-2.5 font-bold">Platform Method</th>
                  <th className="p-2.5 font-bold">Transaction Ref #</th>
                  <th className="p-2.5 font-bold">Notes</th>
                  <th className="p-2.5 font-bold text-right">Amount Disbursed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.payoutHistory.map((rec) => (
                  <tr key={rec.id}>
                    <td className="p-2.5 font-mono">{new Date(rec.paidAt).toLocaleDateString()}</td>
                    <td className="p-2.5 font-semibold">{rec.paymentPlatform}</td>
                    <td className="p-2.5 font-mono">{rec.reference || "—"}</td>
                    <td className="p-2.5 text-gray-600">{rec.notes || "—"}</td>
                    <td className="p-2.5 font-bold text-right">{fmt(rec.amount, rec.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="pt-8 border-t border-gray-200 text-[10px] text-gray-500 flex justify-between items-center">
          <p>JollyWitMe Event Platform Financial Ledger · All figures in Nigerian Naira (NGN)</p>
          <p>Page 1 of 1</p>
        </div>
      </div>
    </>
  );
}
