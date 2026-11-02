"use client";

import { X, User } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface GuestListModalProps {
    isOpen: boolean;
    onClose: () => void;
    guests: any[];
    eventTitle: string;
}

export default function GuestListModal({ isOpen, onClose, guests, eventTitle }: GuestListModalProps) {
    const acceptedGuests = guests.filter(g => g.status === "ACCEPTED");

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-md bg-[#0a0a0b] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div>
                        <h2 className="text-lg font-black uppercase tracking-tight text-white">Guest List</h2>
                        <p className="text-white/40 text-xs mt-0.5">{acceptedGuests.length} going to {eventTitle}</p>
                    </div>
                    <button onClick={onClose} className="text-white/40 hover:text-white p-2 rounded-full hover:bg-white/5 transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto max-h-[60vh] p-4 space-y-2">
                    {acceptedGuests.length === 0 ? (
                        <p className="text-white/30 text-center py-12 text-sm">No confirmed guests yet.</p>
                    ) : (
                        acceptedGuests.map((guest, i) => (
                            <div key={guest.id || i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                                <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden flex-shrink-0 relative">
                                    {guest.image ? (
                                        <Image src={guest.image} alt={guest.name} fill className="object-cover" unoptimized referrerPolicy="no-referrer" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                                            {guest.name?.[0]?.toUpperCase() || <User className="w-4 h-4 text-white/40" />}
                                        </div>
                                    )}
                                </div>
                                <span className="text-white text-sm font-medium">{guest.name}</span>
                            </div>
                        ))
                    )}
                </div>
            </motion.div>
        </div>
    );
}
