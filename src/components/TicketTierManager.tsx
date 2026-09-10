"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Loader2, Ticket, DollarSign, Users } from "lucide-react";

interface TicketTierManagerProps {
  eventId: string;
  primaryColor?: string;
  onTiersChange?: () => void;
}

interface Tier {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  quantity: number;
  quantitySold: number;
  isActive: boolean;
}

export default function TicketTierManager({ eventId, primaryColor = "#6366f1", onTiersChange }: TicketTierManagerProps) {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", price: "", quantity: "" });
  const [error, setError] = useState("");

  const fetchTiers = async () => {
    if (!eventId) {
      setTiers([]);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/events/${eventId}/ticket-tiers`);
      const data = await res.json();
      setTiers(data.tiers || []);
    } catch (err) {
      console.error("Failed to fetch ticket tiers", err);
      setTiers([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchTiers(); }, [eventId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) {
      setError("Please save the event first before adding ticket tiers.");
      return;
    }
    if (!form.name.trim() || form.price === "" || !form.quantity) {
      setError("Name, price, and quantity are required");
      return;
    }
    const parsedPrice = parseFloat(form.price);
    const parsedQty = parseInt(form.quantity);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError("Price must be a valid number (0 or greater)");
      return;
    }
    if (parsedPrice > 0 && parsedPrice < 1000) {
      setError("Paid ticket price must be at least ₦1,000 (or 0 for free) to meet card processing minimums.");
      return;
    }
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setError("Quantity must be at least 1");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/events/${eventId}/ticket-tiers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description?.trim() || "",
          price: Math.round(parsedPrice * 100), // convert Naira to kobo
          currency: "ngn",
          quantity: parsedQty,
        }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // Non-JSON response
      }

      if (!res.ok) {
        throw new Error(data?.error || `Server error (${res.status})`);
      }

      if (data?.tier) {
        setTiers((prev) => [...prev, data.tier]);
        setForm({ name: "", description: "", price: "", quantity: "" });
        setShowForm(false);
        onTiersChange?.();
      } else {
        setError(data?.error || "Failed to create tier");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to create tier");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tierId: string) => {
    if (!eventId) return;
    try {
      const res = await fetch(`/api/events/${eventId}/ticket-tiers`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tierId }),
      });
      if (res.ok) {
        setTiers((prev) => prev.filter((t) => t.id !== tierId));
        onTiersChange?.();
      }
    } catch (err) {
      console.error("Failed to delete tier", err);
    }
  };

  if (!eventId) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 text-center space-y-3">
        <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
          <Ticket className="w-6 h-6" />
        </div>
        <h4 className="text-white font-bold text-sm">Save Your Event First</h4>
        <p className="text-white/60 text-xs max-w-sm mx-auto leading-relaxed">
          Ticket tiers and paid ticketing are linked to your saved event. Please save or create your event first, then add ticket tiers here or in event settings.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tier list */}
      <AnimatePresence>
        {tiers.map((tier) => (
          <motion.div
            key={tier.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white/3 border border-white/8 rounded-2xl p-4 flex items-start gap-4"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${primaryColor}20`, color: primaryColor }}
            >
              <Ticket className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-white">{tier.name}</p>
                <button
                  onClick={() => handleDelete(tier.id)}
                  className="text-white/20 hover:text-rose-400 transition-colors p-1"
                  title="Remove tier"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {tier.description && (
                <p className="text-white/40 text-xs mt-0.5">{tier.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white/50">
                  {tier.price === 0 ? "Free" : `₦${(tier.price / 100).toLocaleString()} NGN`}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white/50">
                  <Users className="w-3 h-3" />
                  {tier.quantitySold}/{tier.quantity} sold
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {tiers.length === 0 && !showForm && (
        <div className="text-center py-8 space-y-2">
          <Ticket className="w-8 h-8 text-white/10 mx-auto" />
          <p className="text-white/30 text-xs uppercase tracking-widest font-bold">No ticket tiers yet</p>
        </div>
      )}

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreate}
            className="space-y-3 overflow-hidden"
          >
            <div className="bg-white/3 border border-white/10 rounded-2xl p-4 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">New Ticket Tier</p>

              <input
                type="text"
                placeholder="Tier name (e.g. General Admission)"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/20 transition-colors"
                required
              />

              <input
                type="text"
                placeholder="Description (optional)"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/20 transition-colors"
              />

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm font-bold">₦</span>
                  <input
                    type="number"
                    placeholder="Price in ₦ (e.g. 5000, 0 for free)"
                    min="0"
                    step="100"
                    value={form.price}
                    onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                    className="w-full h-10 bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/20 transition-colors"
                    required
                  />
                </div>
                <input
                  type="number"
                  placeholder="Qty available"
                  min="1"
                  value={form.quantity}
                  onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
                  className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/20 transition-colors"
                  required
                />
              </div>

              {error && <p className="text-rose-400 text-xs">{error}</p>}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 h-9 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 h-9 bg-white text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Add Tier"}
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full h-10 border border-dashed border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Ticket Tier
        </button>
      )}
    </div>
  );
}
