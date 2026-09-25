"use client";

import { motion } from "framer-motion";
import { Calendar, MapPin, User, Download, QrCode, Loader2, Check } from "lucide-react";
import { useRef, useState } from "react";

interface ETicketProps {
  event: any;
  rsvp: any;
  order: any;
  primaryColor?: string;
  onClose?: () => void;
}

export default function ETicket({ event, rsvp, order, primaryColor = "#6366f1", onClose }: ETicketProps) {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const formattedDate = event?.startDate
    ? new Date(event.startDate).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  const formattedTime = event?.startDate
    ? new Date(event.startDate).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

  const qrToken = rsvp?.qrToken || order?.id || "ticket";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrToken)}&margin=10`;

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const res = await fetch(qrUrl);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const safeTitle = (event?.title || event?.slug || "ticket").replace(/[^a-zA-Z0-9_-]/g, "_");
      a.download = `ticket-${safeTitle}-qr.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);

      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch (err) {
      console.error("Failed to download QR image:", err);
      // Fallback
      window.open(qrUrl, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="w-full space-y-6"
    >
      {/* Ticket Card */}
      <div ref={ticketRef} className="relative w-full max-w-sm mx-auto select-none">
        {/* Glow */}
        <div
          className="absolute inset-0 rounded-3xl blur-2xl opacity-20 pointer-events-none"
          style={{ background: primaryColor }}
        />

        <div
          className="relative rounded-3xl overflow-hidden border border-white/10"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}18 0%, #0a0a0b 60%)`,
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Top band */}
          <div
            className="h-2 w-full"
            style={{ background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}88)` }}
          />

          {/* JollyWitMe Brand Identity */}
          <div className="px-6 pt-5 pb-1 flex items-center justify-between">
            <div className="flex items-center">
              <img
                src="/logo/logo-full.webp"
                alt="JollyWitMe"
                className="h-7 w-auto max-w-[130px] object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Verified Ticket
            </div>
          </div>

          {/* Header */}
          <div className="p-6 pt-2 pb-4 space-y-1">
            <p
              className="text-[9px] font-black uppercase tracking-[0.4em]"
              style={{ color: primaryColor }}
            >
              E-Ticket · Admit One
            </p>
            <h2 className="text-xl font-black text-white tracking-tight leading-tight line-clamp-2">
              {event?.title}
            </h2>
          </div>

          {/* Divider dots */}
          <div className="flex items-center px-6 gap-1">
            {Array.from({ length: 32 }).map((_, i) => (
              <div key={i} className="w-1 h-[2px] rounded-full bg-white/10 flex-1" />
            ))}
          </div>

          {/* Details */}
          <div className="p-6 pt-4 space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Date & Time</p>
                <p className="text-sm font-bold text-white">{formattedDate} · {formattedTime}</p>
              </div>
            </div>

            {event?.location && (
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Location</p>
                  <p className="text-sm font-bold text-white line-clamp-1">{event.location}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <User className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Guest</p>
                <p className="text-sm font-bold text-white">{rsvp?.guestName || order?.guestName}</p>
              </div>
            </div>

            {order?.ticketTier?.name && (
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest"
                style={{ borderColor: `${primaryColor}40`, color: primaryColor, background: `${primaryColor}10` }}
              >
                <QrCode className="w-3 h-3" />
                {order.ticketTier.name}
              </div>
            )}
          </div>

          {/* Tear line */}
          <div className="relative flex items-center px-0 py-1">
            <div
              className="absolute -left-4 w-8 h-8 rounded-full"
              style={{ background: "#0a0a0b" }}
            />
            <div className="flex-1 border-t-2 border-dashed border-white/10 mx-6" />
            <div
              className="absolute -right-4 w-8 h-8 rounded-full"
              style={{ background: "#0a0a0b" }}
            />
          </div>

          {/* QR section */}
          <div className="p-6 pt-5 flex flex-col items-center gap-3">
            <div className="bg-white p-3 rounded-2xl shadow-2xl">
              <img
                src={qrUrl}
                alt="Entry QR Code"
                className="w-36 h-36"
              />
            </div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 text-center">
              Show this QR code at the door
            </p>
            <div className="pt-3 border-t border-white/10 w-full flex items-center justify-center gap-1.5 text-white/50 text-[11px] font-medium">
              <span>from the</span>
              <span className="font-bold text-white tracking-wide">Jolly Team</span>
              <span>✨</span>
            </div>
          </div>

          {/* Bottom band */}
          <div
            className="h-1 w-full opacity-40"
            style={{ background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}44)` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 max-w-sm mx-auto">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex-1 h-11 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold uppercase tracking-widest text-[10px] text-white/60 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {downloading ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : downloaded ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {downloading ? "Saving..." : downloaded ? "Saved!" : "Save QR"}
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-1 h-11 bg-white text-black font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-white/90 active:scale-95 transition-all"
          >
            Done
          </button>
        )}
      </div>
    </motion.div>
  );
}
