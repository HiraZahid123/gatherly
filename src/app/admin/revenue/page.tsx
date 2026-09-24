"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  Percent,
  Ticket,
  Calendar,
  Search,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Layers,
  ArrowUpRight,
  Filter,
  CreditCard,
  Building2,
  Receipt,
  X,
  Plus,
  Clock,
  Check,
  ChevronRight,
  Trash2,
  RotateCcw,
  Printer,
  Undo2,
} from "lucide-react";

interface PayoutRecord {
  id: string;
  amount: number;
  currency: string;
  paymentPlatform: string;
  reference?: string;
  notes?: string;
  paidAt: string;
  paidBy: string;
}

interface EventRevenueItem {
  eventId: string;
  eventTitle: string;
  eventSlug?: string;
  startDate?: string | null;
  hostId?: string;
  hostName: string;
  hostEmail: string;
  hostImage?: string | null;
  totalTicketsSold: number;
  orderCount: number;
  grossRevenue: number;
  refundedAmount?: number;
  refundedOrderCount?: number;
  refundedTickets?: number;
  platformFeeTotal: number;
  hostNetPayout: number;
  totalPaidOut: number;
  balanceDue: number;
  payoutStatus: "SETTLED" | "PARTIAL" | "PENDING";
  payoutHistory: PayoutRecord[];
  currency: string;
  lastOrderAt: string;
}

interface OrderItem {
  id: string;
  orderNumber: string;
  status: string;
  guestName: string;
  guestEmail: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  platformFee: number;
  hostPayout: number;
  feeDetails: string;
  currency: string;
  reference?: string | null;
  transactionId?: string | null;
  stripePaymentIntentId?: string | null;
  stripeChargeId?: string | null;
  createdAt: string;
  eventId: string;
  eventTitle: string;
  eventSlug?: string;
  hostName: string;
  hostEmail: string;
  tierName: string;
  refundRequested?: boolean;
  refundReason?: string | null;
  refundRequestedAt?: string | null;
}

interface RevenueData {
  kpis: {
    totalGrossRevenue: number;
    totalRefundedAmount?: number;
    totalRefundedCount?: number;
    totalRefundedTickets?: number;
    netGrossRevenue?: number;
    totalPlatformCommission: number;
    totalHostPayouts: number;
    totalTicketsSold: number;
    totalCompletedOrders?: number;
    totalOrders: number;
    totalPaidEvents: number;
    totalManualPayoutsSettled: number;
    totalPendingSettlement: number;
  };
  events: EventRevenueItem[];
  recentOrders: OrderItem[];
}

const PAYMENT_PLATFORMS = [
  "Direct Bank Transfer",
  "Paystack Transfer",
  "Cash",
  "Other",
];

export default function AdminRevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"EVENTS" | "ORDERS">("EVENTS");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "SETTLED" | "PENDING">("ALL");
  const [orderStatusFilter, setOrderStatusFilter] = useState<"ALL" | "COMPLETED" | "REFUNDED" | "REFUND_REQUESTED">("ALL");

  // Payout Modal State
  const [activePayoutEvent, setActivePayoutEvent] = useState<EventRevenueItem | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [payoutPlatform, setPayoutPlatform] = useState<string>("Direct Bank Transfer");
  const [payoutReference, setPayoutReference] = useState<string>("");
  const [payoutNotes, setPayoutNotes] = useState<string>("");
  const [submittingPayout, setSubmittingPayout] = useState<boolean>(false);
  const [modalMessage, setModalMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // History Modal State
  const [viewHistoryEvent, setViewHistoryEvent] = useState<EventRevenueItem | null>(null);

  // Refund Modal State
  const [refundingOrder, setRefundingOrder] = useState<OrderItem | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [isRefunding, setIsRefunding] = useState(false);

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/revenue");
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load revenue data:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number, curr = "NGN") => {
    const symbol = curr.toLowerCase() === "usd" ? "$" : "₦";
    return `${symbol}${(cents / 100).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  // Open Record Payout Modal
  const handleOpenPayoutModal = (event: EventRevenueItem) => {
    setActivePayoutEvent(event);
    setPayoutAmount(event.balanceDue > 0 ? event.balanceDue / 100 : event.hostNetPayout / 100);
    setPayoutPlatform("Direct Bank Transfer");
    setPayoutReference("");
    setPayoutNotes("");
    setModalMessage(null);
  };

  // Submit Payout Recording
  const handleSubmitPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePayoutEvent) return;

    if (payoutAmount <= 0) {
      setModalMessage({ type: "error", text: "Please enter a valid payout amount." });
      return;
    }

    const maxAllowed = activePayoutEvent.balanceDue / 100;
    if (payoutAmount > maxAllowed) {
      setModalMessage({
        type: "error",
        text: `Payout amount (₦${payoutAmount.toLocaleString()}) cannot exceed the remaining balance due of ₦${maxAllowed.toLocaleString()}.`,
      });
      return;
    }

    setSubmittingPayout(true);
    setModalMessage(null);

    try {
      const res = await fetch("/api/admin/revenue/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: activePayoutEvent.eventId,
          hostId: activePayoutEvent.hostId,
          amount: Math.round(payoutAmount * 100), // convert to cents/kobo
          currency: activePayoutEvent.currency || "ngn",
          paymentPlatform: payoutPlatform,
          reference: payoutReference,
          notes: payoutNotes,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setModalMessage({ type: "success", text: "Payout recorded successfully!" });
        await fetchRevenueData();
        setTimeout(() => {
          setActivePayoutEvent(null);
        }, 1200);
      } else {
        setModalMessage({ type: "error", text: json.error || "Failed to record payout" });
      }
    } catch (err: any) {
      setModalMessage({ type: "error", text: err.message || "An unexpected error occurred" });
    } finally {
      setSubmittingPayout(false);
    }
  };

  const [deletingPayoutId, setDeletingPayoutId] = useState<string | null>(null);

  const handleDeletePayout = async (payoutId: string) => {
    if (!confirm("Are you sure you want to void/delete this payout record?")) return;
    setDeletingPayoutId(payoutId);
    try {
      const res = await fetch(`/api/admin/revenue/payout?payoutId=${payoutId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        const updatedRes = await fetch("/api/admin/revenue");
        const updatedJson = await updatedRes.json();
        if (updatedJson.success) {
          setData(updatedJson);
          if (viewHistoryEvent) {
            const updatedEv = updatedJson.events.find((e: any) => e.eventId === viewHistoryEvent.eventId);
            setViewHistoryEvent(updatedEv || null);
          }
        }
      } else {
        alert(json.error || "Failed to delete payout record");
      }
    } catch (err: any) {
      alert(err.message || "An error occurred");
    } finally {
      setDeletingPayoutId(null);
    }
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    if (!data?.events) return [];
    return data.events.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        item.eventTitle.toLowerCase().includes(q) ||
        item.hostName.toLowerCase().includes(q) ||
        item.hostEmail.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (statusFilter === "SETTLED") return item.payoutStatus === "SETTLED";
      if (statusFilter === "PENDING") return item.payoutStatus === "PENDING" || item.payoutStatus === "PARTIAL";
      return true;
    });
  }, [data?.events, searchQuery, statusFilter]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    if (!data?.recentOrders) return [];
    return data.recentOrders.filter((order) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        order.eventTitle.toLowerCase().includes(q) ||
        order.hostName.toLowerCase().includes(q) ||
        order.hostEmail.toLowerCase().includes(q) ||
        order.guestName.toLowerCase().includes(q) ||
        order.guestEmail.toLowerCase().includes(q) ||
        order.orderNumber.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (orderStatusFilter === "COMPLETED") return order.status === "COMPLETED";
      if (orderStatusFilter === "REFUNDED") return order.status === "REFUNDED";
      if (orderStatusFilter === "REFUND_REQUESTED") return order.refundRequested && order.status === "COMPLETED";
      return true;
    });
  }, [data?.recentOrders, searchQuery, orderStatusFilter]);

  const pendingRefundRequestsCount = useMemo(() => {
    return data?.recentOrders?.filter((o) => o.refundRequested && o.status === "COMPLETED").length || 0;
  }, [data?.recentOrders]);

  // Refund Order Handler
  const handleProcessRefund = async () => {
    if (!refundingOrder) return;
    setIsRefunding(true);
    try {
      const res = await fetch("/api/admin/revenue/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: refundingOrder.id,
          reason: refundReason,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setRefundingOrder(null);
        setRefundReason("");
        fetchRevenueData();
      } else {
        alert(json.error || "Failed to process refund");
      }
    } catch (err: any) {
      alert(err.message || "An error occurred");
    } finally {
      setIsRefunding(false);
    }
  };

  // Reject / Dismiss Refund Request Handler
  const handleRejectRefund = async () => {
    if (!refundingOrder) return;
    setIsRefunding(true);
    try {
      const res = await fetch("/api/admin/revenue/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: refundingOrder.id,
          action: "REJECT",
          reason: refundReason,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setRefundingOrder(null);
        setRefundReason("");
        fetchRevenueData();
      } else {
        alert(json.error || "Failed to dismiss refund request");
      }
    } catch (err: any) {
      alert(err.message || "An error occurred");
    } finally {
      setIsRefunding(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    if (activeView === "EVENTS") {
      const headers = [
        "Event Title",
        "Event Slug",
        "Creator Name",
        "Creator Email",
        "Payout Status",
        "Tickets Sold",
        "Refunded Tickets",
        "Gross Revenue (NGN)",
        "Refunded Amount (NGN)",
        "Platform Commission (NGN)",
        "Creator Net Share (NGN)",
        "Amount Paid Out (NGN)",
        "Balance Due (NGN)",
        "Last Order Date",
      ];
      const rows = filteredEvents.map((e) => [
        `"${e.eventTitle.replace(/"/g, '""')}"`,
        `"${e.eventSlug || ""}"`,
        `"${e.hostName.replace(/"/g, '""')}"`,
        `"${e.hostEmail}"`,
        e.payoutStatus,
        e.totalTicketsSold,
        e.refundedTickets || 0,
        (e.grossRevenue / 100).toFixed(2),
        ((e.refundedAmount || 0) / 100).toFixed(2),
        (e.platformFeeTotal / 100).toFixed(2),
        (e.hostNetPayout / 100).toFixed(2),
        (e.totalPaidOut / 100).toFixed(2),
        (e.balanceDue / 100).toFixed(2),
        new Date(e.lastOrderAt).toLocaleDateString(),
      ]);
      downloadCSV("revenue-and-payouts-ledger.csv", [headers.join(","), ...rows.map((r) => r.join(","))].join("\n"));
    } else {
      const headers = [
        "Order #",
        "Status",
        "Buyer Name",
        "Buyer Email",
        "Event Title",
        "Tier",
        "Tickets",
        "Gross Total (NGN)",
        "Platform Fee (NGN)",
        "Host Share (NGN)",
        "Payment Reference",
        "Date",
      ];
      const rows = filteredOrders.map((o) => [
        o.orderNumber,
        o.status,
        `"${o.guestName.replace(/"/g, '""')}"`,
        `"${o.guestEmail}"`,
        `"${o.eventTitle.replace(/"/g, '""')}"`,
        `"${o.tierName}"`,
        o.quantity,
        (o.totalAmount / 100).toFixed(2),
        (o.platformFee / 100).toFixed(2),
        (o.hostPayout / 100).toFixed(2),
        (o as any).reference || o.stripePaymentIntentId || "N/A",
        new Date(o.createdAt).toLocaleString(),
      ]);
      downloadCSV("all-ticket-orders.csv", [headers.join(","), ...rows.map((r) => r.join(","))].join("\n"));
    }
  };

  const downloadCSV = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 max-w-7xl pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white uppercase">Revenue & Host Payouts</h1>
            <p className="text-white/40 text-xs mt-0.5">
              Financial ledger tracking event ticket sales, platform commission retention, and creator payouts
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchRevenueData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-all disabled:opacity-50"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-400" : ""}`} />
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={loading || (activeView === "EVENTS" ? filteredEvents.length === 0 : filteredOrders.length === 0)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-xs transition-all disabled:opacity-30"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-xs transition-all"
            title="Print or Save as PDF"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Gross Volume */}
        <div className="bg-[#0a0a0b] border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
          <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white mb-4">
            <DollarSign className="w-5 h-5" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Gross Volume</p>
          <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
            {loading ? "…" : formatCurrency(data?.kpis.totalGrossRevenue || 0)}
          </h3>
          <p className="text-[11px] text-white/40 mt-1">
            Across {data?.kpis.totalPaidEvents || 0} paid events
          </p>
        </div>

        {/* Total Refunds */}
        <div className="bg-[#0a0a0b] border border-rose-500/20 rounded-3xl p-6 relative overflow-hidden group shadow-[0_0_30px_rgba(244,63,94,0.05)]">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
            <RotateCcw className="w-5 h-5" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-rose-400/80">Total Refunds</p>
          <h3 className="text-2xl sm:text-3xl font-black text-rose-400 mt-1">
            {loading ? "…" : formatCurrency(data?.kpis.totalRefundedAmount || 0)}
          </h3>
          <p className="text-[11px] text-rose-300/50 mt-1">
            {data?.kpis.totalRefundedCount || 0} orders ({data?.kpis.totalRefundedTickets || 0} tickets)
          </p>
        </div>

        {/* Platform Commission */}
        <div className="bg-[#0a0a0b] border border-emerald-500/20 rounded-3xl p-6 relative overflow-hidden group shadow-[0_0_30px_rgba(16,185,129,0.05)]">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/70">
            Platform Commission
          </p>
          <h3 className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
            {loading ? "…" : formatCurrency(data?.kpis.totalPlatformCommission || 0)}
          </h3>
          <p className="text-[11px] text-emerald-300/50 mt-1">
            Retained in Paystack account
          </p>
        </div>

        {/* Host Net Payouts */}
        <div className="bg-[#0a0a0b] border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
            <Percent className="w-5 h-5" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Creator Net Share</p>
          <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
            {loading ? "…" : formatCurrency(data?.kpis.totalHostPayouts || 0)}
          </h3>
          <p className="text-[11px] text-white/40 mt-1">
            Total creator earnings
          </p>
        </div>

        {/* Tickets Sold */}
        <div className="bg-[#0a0a0b] border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
            <Ticket className="w-5 h-5" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Paid Tickets Sold</p>
          <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
            {loading ? "…" : (data?.kpis.totalTicketsSold || 0).toLocaleString()}
          </h3>
          <p className="text-[11px] text-white/40 mt-1">
            Across {data?.kpis.totalCompletedOrders ?? (data?.kpis.totalOrders || 0)} completed orders
          </p>
        </div>
      </div>

      {/* Control Bar & Tabs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Tab Selector */}
        <div className="flex items-center p-1 rounded-2xl bg-[#0a0a0b] border border-white/10 self-start">
          <button
            type="button"
            onClick={() => setActiveView("EVENTS")}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeView === "EVENTS"
                ? "bg-emerald-500 text-black font-black shadow-lg shadow-emerald-500/20"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>By Event & Host ({filteredEvents.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView("ORDERS")}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeView === "ORDERS"
                ? "bg-emerald-500 text-black font-black shadow-lg shadow-emerald-500/20"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Transactions ({filteredOrders.length})</span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search event, host, or buyer..."
              className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Status Filter Pill */}
          <div className="flex items-center gap-1 bg-[#0a0a0b] border border-white/10 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
            {activeView === "EVENTS" ? (
              <>
                <button
                  type="button"
                  onClick={() => setStatusFilter("ALL")}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                    statusFilter === "ALL" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("SETTLED")}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                    statusFilter === "SETTLED"
                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  Settled
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("PENDING")}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                    statusFilter === "PENDING"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  Pending
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setOrderStatusFilter("ALL")}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                    orderStatusFilter === "ALL" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
                  }`}
                >
                  All ({data?.recentOrders?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setOrderStatusFilter("COMPLETED")}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                    orderStatusFilter === "COMPLETED"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  Completed ({data?.kpis.totalCompletedOrders ?? (data?.kpis.totalOrders || 0)})
                </button>
                <button
                  type="button"
                  onClick={() => setOrderStatusFilter("REFUNDED")}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                    orderStatusFilter === "REFUNDED"
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  Refunded ({data?.kpis.totalRefundedCount || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setOrderStatusFilter("REFUND_REQUESTED")}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    orderStatusFilter === "REFUND_REQUESTED"
                      ? "bg-amber-500 text-black font-black shadow-lg shadow-amber-500/20"
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  <span>Refund Requests</span>
                  {pendingRefundRequestsCount > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${orderStatusFilter === "REFUND_REQUESTED" ? "bg-black text-amber-400" : "bg-amber-500 text-black"}`}>
                      {pendingRefundRequestsCount}
                    </span>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="p-20 text-center border border-white/5 rounded-3xl bg-[#0a0a0b]">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
          <p className="text-white/40 text-sm">Loading financial ledgers...</p>
        </div>
      ) : activeView === "EVENTS" ? (
        /* ─── VIEW 1: BY EVENT & HOST ─── */
        <div className="bg-[#0a0a0b] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Event Details</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Creator / Host</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-center">Tickets</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Gross Revenue</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-emerald-400">Platform Cut</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Host Net Share</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Payout Status & Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-white/30 font-medium">
                      No ticket sales recorded yet matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((item) => (
                    <tr key={item.eventId} className="hover:bg-white/[0.02] transition-colors">
                      {/* Event Title */}
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-sm hover:text-emerald-400 transition-colors">
                              {item.eventTitle}
                            </span>
                            {item.eventSlug && (
                              <Link href={`/events/${item.eventSlug}`} target="_blank" className="text-white/30 hover:text-white">
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </Link>
                            )}
                          </div>
                          <p className="text-[11px] text-white/30 font-mono">
                            Last order: {new Date(item.lastOrderAt).toLocaleDateString()}
                          </p>
                        </div>
                      </td>

                      {/* Host */}
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-white">{item.hostName}</p>
                          <p className="text-[11px] text-white/40 font-mono">{item.hostEmail}</p>
                        </div>
                      </td>

                      {/* Tickets Sold */}
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/5 border border-white/10 font-black text-white">
                          {item.totalTicketsSold}
                        </span>
                      </td>

                      {/* Gross Revenue */}
                      <td className="px-6 py-4">
                        <span className="font-black text-white text-sm">
                          {formatCurrency(item.grossRevenue, item.currency)}
                        </span>
                      </td>

                      {/* Platform Fee */}
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <span className="font-black text-emerald-400 text-sm">
                            +{formatCurrency(item.platformFeeTotal, item.currency)}
                          </span>
                          <p className="text-[10px] text-emerald-400/60 font-medium">
                            {item.grossRevenue > 0 ? `${((item.platformFeeTotal / item.grossRevenue) * 100).toFixed(1)}%` : "0%"}
                          </p>
                        </div>
                      </td>

                      {/* Host Net Share & Balance */}
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-black text-white text-sm">
                            {formatCurrency(item.hostNetPayout, item.currency)}
                          </span>
                          {item.totalPaidOut > 0 && (
                            <p className="text-[10px] text-white/40 mt-0.5 font-mono">
                              Paid: {formatCurrency(item.totalPaidOut, item.currency)}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Payout Status & Action */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {item.payoutStatus === "SETTLED" ? (
                            <div className="flex items-center gap-2">
                              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[11px] font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                                <span>Settled ({item.payoutHistory[0]?.paymentPlatform || "Direct"})</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setViewHistoryEvent(item)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all text-[11px]"
                                title="View Payout Receipt"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : item.payoutStatus === "PARTIAL" ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenPayoutModal(item)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold hover:bg-amber-500/20 transition-all"
                              >
                                <Clock className="w-3.5 h-3.5 text-amber-400" />
                                <span>Partial (Due: {formatCurrency(item.balanceDue, item.currency)})</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setViewHistoryEvent(item)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all text-[11px]"
                                title="View History"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenPayoutModal(item)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500 hover:text-black transition-all text-[11px] font-extrabold uppercase tracking-wider group shadow-sm"
                            >
                              <CreditCard className="w-3.5 h-3.5 text-amber-400 group-hover:text-black" />
                              <span>Record Payout</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ─── VIEW 2: ALL INDIVIDUAL ORDERS ─── */
        <div className="bg-[#0a0a0b] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Order #</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Buyer / Attendee</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Event</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Tier & Qty</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Total Paid</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-emerald-400">Platform Cut</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Host Share</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Date</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-white/30 font-medium">
                      No order transactions found.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const isRefunded = order.status === "REFUNDED";
                    return (
                      <tr key={order.id} className={`hover:bg-white/[0.02] transition-colors ${isRefunded ? "opacity-75 bg-rose-500/[0.02]" : ""}`}>
                        <td className="px-6 py-4 font-mono font-bold text-white/70">
                          #{order.orderNumber}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-white">{order.guestName}</p>
                            <p className="text-[11px] text-white/40 font-mono">{order.guestEmail}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-white">{order.eventTitle}</p>
                          <p className="text-[11px] text-white/40">Host: {order.hostName}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-white">{order.tierName}</span>{" "}
                          <span className="text-white/40">×{order.quantity}</span>
                        </td>
                        <td className="px-6 py-4 font-black text-white">
                          <span className={isRefunded ? "line-through text-white/40" : ""}>
                            {formatCurrency(order.totalAmount, order.currency)}
                          </span>
                          {isRefunded && (
                            <span className="block text-[10px] text-rose-400 font-bold uppercase tracking-wider">Refunded</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-bold text-emerald-400">
                          <span className={isRefunded ? "line-through text-white/30" : ""}>
                            +{formatCurrency(order.platformFee, order.currency)}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-white">
                          <span className={isRefunded ? "line-through text-white/30" : ""}>
                            {formatCurrency(order.hostPayout, order.currency)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-white/40 font-mono text-[11px]">
                          {new Date(order.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          {isRefunded ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 font-bold text-[10px] uppercase tracking-wider">
                              <RotateCcw className="w-2.5 h-2.5" />
                              Refunded
                            </span>
                          ) : order.refundRequested ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-[10px] uppercase tracking-wider animate-pulse">
                                <Clock className="w-2.5 h-2.5" />
                                Requested
                              </span>
                              {order.refundReason && (
                                <p className="text-[10px] text-amber-400/80 italic max-w-[160px] truncate" title={order.refundReason}>
                                  "{order.refundReason}"
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] uppercase tracking-wider">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              Paid
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {!isRefunded ? (
                            <button
                              type="button"
                              onClick={() => {
                                setRefundingOrder(order);
                                setRefundReason(order.refundReason || "");
                              }}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-[11px] font-bold tracking-wide ${
                                order.refundRequested
                                  ? "bg-amber-500 text-black hover:bg-amber-400 shadow-lg shadow-amber-500/20 font-black"
                                  : "bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500 hover:text-white"
                              }`}
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>{order.refundRequested ? "Review Request" : "Refund"}</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-white/30 font-medium italic">Reversed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── MODAL: RECORD PAYOUT ─── */}
      {activePayoutEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0a0a0b] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">Record Host Payout</h3>
                  <p className="text-xs text-white/40">Update ledger after disbursing event ticket funds</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActivePayoutEvent(null)}
                className="p-1 rounded-lg text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Event Summary Card */}
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/40 uppercase font-black tracking-wider text-[10px]">Event</span>
                <span className="font-bold text-white truncate max-w-[200px]">{activePayoutEvent.eventTitle}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/40 uppercase font-black tracking-wider text-[10px]">Creator / Host</span>
                <span className="font-bold text-white truncate max-w-[200px]">
                  {activePayoutEvent.hostName} ({activePayoutEvent.hostEmail})
                </span>
              </div>
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-white/60">Net Creator Share</span>
                <span className="font-bold text-white">{formatCurrency(activePayoutEvent.hostNetPayout)}</span>
              </div>
              {activePayoutEvent.totalPaidOut > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60">Already Paid</span>
                  <span className="font-bold text-emerald-400">-{formatCurrency(activePayoutEvent.totalPaidOut)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs font-black">
                <span className="text-amber-300">Remaining Balance Due</span>
                <span className="text-base text-amber-400">{formatCurrency(activePayoutEvent.balanceDue)}</span>
              </div>
            </div>

            {/* Notification alert in modal */}
            {modalMessage && (
              <div
                className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-bold ${
                  modalMessage.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-red-500/10 border-red-500/30 text-red-300"
                }`}
              >
                {modalMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span>{modalMessage.text}</span>
              </div>
            )}

            {/* Payout Form */}
            <form onSubmit={handleSubmitPayout} className="space-y-4">
              {/* Amount to Record */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-white/50 block">
                  Amount to Disburse (₦ NGN)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold text-sm">
                    ₦
                  </span>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max={Math.max(1, activePayoutEvent.balanceDue / 100)}
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(Number(e.target.value))}
                    required
                    className="w-full bg-black/60 border border-white/15 focus:border-amber-500 rounded-2xl pl-10 pr-4 py-3 text-white font-bold text-sm outline-none transition-all"
                  />
                  <p className="text-[10px] text-white/40">
                    Maximum allowed: {formatCurrency(activePayoutEvent.balanceDue)}
                  </p>
                </div>
              </div>

              {/* Payment Platform / Method */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-white/50 block">
                  Payment Platform / Method
                </label>
                <select
                  value={payoutPlatform}
                  onChange={(e) => setPayoutPlatform(e.target.value)}
                  className="w-full bg-black/60 border border-white/15 focus:border-amber-500 rounded-2xl px-4 py-3 text-white text-xs outline-none transition-all"
                >
                  {PAYMENT_PLATFORMS.map((platform) => (
                    <option key={platform} value={platform} className="bg-[#0a0a0b] text-white">
                      {platform}
                    </option>
                  ))}
                </select>
              </div>

              {/* Transaction Reference */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-white/50 block">
                  Reference / Transaction ID
                </label>
                <input
                  type="text"
                  value={payoutReference}
                  onChange={(e) => setPayoutReference(e.target.value)}
                  placeholder="e.g. GTB/TRF/20260916/9931 or Paystack Ref"
                  className="w-full bg-black/60 border border-white/15 focus:border-amber-500 rounded-2xl px-4 py-3 text-white font-mono text-xs outline-none transition-all placeholder:text-white/20"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-white/50 block">
                  Notes / Account Details (Optional)
                </label>
                <input
                  type="text"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  placeholder="e.g. Paid to Kuda Bank 2049182390 John Doe"
                  className="w-full bg-black/60 border border-white/15 focus:border-amber-500 rounded-2xl px-4 py-3 text-white text-xs outline-none transition-all placeholder:text-white/20"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setActivePayoutEvent(null)}
                  disabled={submittingPayout}
                  className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayout}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {submittingPayout ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Recording...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm & Record Payout</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: VIEW PAYOUT HISTORY & RECEIPTS ─── */}
      {viewHistoryEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0a0a0b] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">Payout History & Proof</h3>
                  <p className="text-xs text-white/40">{viewHistoryEvent.eventTitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewHistoryEvent(null)}
                className="p-1 rounded-lg text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total Summary */}
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between text-xs">
              <div>
                <p className="text-white/40 uppercase font-black text-[10px]">Total Creator Share</p>
                <p className="font-black text-white text-base mt-0.5">{formatCurrency(viewHistoryEvent.hostNetPayout)}</p>
              </div>
              <div className="text-right">
                <p className="text-white/40 uppercase font-black text-[10px]">Total Paid Out</p>
                <p className="font-black text-emerald-400 text-base mt-0.5">
                  {formatCurrency(viewHistoryEvent.totalPaidOut)}
                </p>
              </div>
            </div>

            {/* Payout Entries */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {viewHistoryEvent.payoutHistory.length === 0 ? (
                <p className="text-center py-6 text-white/30 text-xs">No manual payouts recorded yet.</p>
              ) : (
                viewHistoryEvent.payoutHistory.map((record) => (
                  <div key={record.id} className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold text-[11px]">
                        {record.paymentPlatform}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white text-sm">
                          {formatCurrency(record.amount, record.currency)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeletePayout(record.id)}
                          disabled={deletingPayoutId === record.id}
                          className="p-1.5 text-white/30 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                          title="Void this payout record"
                        >
                          {deletingPayoutId === record.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-400" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                    {record.reference && (
                      <p className="text-xs font-mono text-white/70">
                        <span className="text-white/30">Ref:</span> {record.reference}
                      </p>
                    )}
                    {record.notes && (
                      <p className="text-xs text-white/50 italic">
                        "{record.notes}"
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-white/30 pt-1 border-t border-white/5 font-mono">
                      <span>Approved by: {record.paidBy}</span>
                      <span>{new Date(record.paidAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Another Payout Button if Balance Remains */}
            <div className="pt-2 flex items-center justify-between">
              {viewHistoryEvent.balanceDue > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    const ev = viewHistoryEvent;
                    setViewHistoryEvent(null);
                    handleOpenPayoutModal(ev);
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300"
                >
                  <Plus className="w-4 h-4" />
                  <span>Record Additional Payout ({formatCurrency(viewHistoryEvent.balanceDue)} due)</span>
                </button>
              ) : (
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Fully Settled</span>
                </span>
              )}

              <button
                type="button"
                onClick={() => setViewHistoryEvent(null)}
                className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: PROCESS REFUND ─── */}
      {refundingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0a0a0b] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">Refund Ticket Order</h3>
                  <p className="text-xs text-white/40">Reverse payment and restore ticket inventory</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRefundingOrder(null);
                  setRefundReason("");
                }}
                className="p-1 rounded-lg text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Order Details */}
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-white/40 uppercase font-black tracking-wider text-[10px]">Order #</span>
                <span className="font-mono font-bold text-white">#{refundingOrder.orderNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/40 uppercase font-black tracking-wider text-[10px]">Buyer</span>
                <span className="font-bold text-white truncate max-w-[240px]">
                  {refundingOrder.guestName} ({refundingOrder.guestEmail})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/40 uppercase font-black tracking-wider text-[10px]">Event</span>
                <span className="font-bold text-white truncate max-w-[240px]">{refundingOrder.eventTitle}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/40 uppercase font-black tracking-wider text-[10px]">Ticket Tier</span>
                <span className="font-medium text-white">{refundingOrder.tierName} × {refundingOrder.quantity}</span>
              </div>
              <div className="pt-2 border-t border-white/5 flex items-center justify-between font-black text-sm">
                <span className="text-rose-300">Refund Amount</span>
                <span className="text-rose-400">{formatCurrency(refundingOrder.totalAmount, refundingOrder.currency)}</span>
              </div>
            </div>

            {/* Host Request Note if present */}
            {refundingOrder.refundRequested && refundingOrder.refundReason && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                  Creator's Request Reason:
                </span>
                <p className="text-amber-200 text-xs italic">
                  "{refundingOrder.refundReason}"
                </p>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed">
              Refunding this order will mark it as refunded, restore {refundingOrder.quantity} ticket{refundingOrder.quantity > 1 ? "s" : ""} to the tier inventory, set RSVP to declined, and automatically refund via Paystack if paid online.
            </div>

            {/* Refund Reason */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-white/50 block">
                {refundingOrder.refundRequested ? "Admin Note / Response Reason" : "Reason for Refund (Optional)"}
              </label>
              <input
                type="text"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder={refundingOrder.refundRequested ? "e.g. Approved as per host request" : "e.g. Customer requested cancellation..."}
                className="w-full bg-black/60 border border-white/15 focus:border-rose-500 rounded-2xl px-4 py-3 text-white text-xs outline-none transition-all placeholder:text-white/20"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <div>
                {refundingOrder.refundRequested && (
                  <button
                    type="button"
                    onClick={handleRejectRefund}
                    disabled={isRefunding}
                    className="px-4 py-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-bold transition-all disabled:opacity-50"
                  >
                    Decline Request
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setRefundingOrder(null);
                    setRefundReason("");
                  }}
                  disabled={isRefunding}
                  className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleProcessRefund}
                  disabled={isRefunding}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-rose-500 hover:bg-rose-400 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50"
                >
                  {isRefunding ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{refundingOrder.refundRequested ? "Approve & Refund" : "Confirm Refund"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
