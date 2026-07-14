import React from "react";
import Image from "next/image";
import { User, Users, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

interface GuestListPreviewProps {
    guests: any[];
    totalCount: number;
    onViewAll: () => void;
    onSelectGuest?: (guest: any) => void;
    isHidden?: boolean;
}

export default function GuestListPreview({ guests, totalCount, onViewAll, onSelectGuest, isHidden }: GuestListPreviewProps) {
    const acceptedGuests = guests.filter(g => g.status === 'ACCEPTED');
    const displayGuests = acceptedGuests.slice(0, 6);

    if (isHidden) {
        return (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/20">
                    <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">Guest list is private</h3>
                    <p className="text-white/40 text-sm mt-1">Only the host can see who's coming.</p>
                </div>
            </div>
        );
    }

    if (totalCount === 0) {
        return (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/20">
                    <Users className="w-8 h-8" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">No guests yet</h3>
                    <p className="text-white/40 text-sm mt-1">Be the first to join the party!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">Guest List</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <p className="text-white/60 text-sm font-medium">{totalCount} Going</p>
                    </div>
                </div>
                <button
                    onClick={onViewAll}
                    className="group flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-all text-sm font-bold shadow-sm"
                >
                    View guest list
                </button>
            </div>

            <div className="flex items-center">
                <div className="flex -space-x-4 overflow-hidden p-1">
                    {displayGuests.map((guest, index) => (
                        <motion.div
                            key={guest.id || index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => onSelectGuest?.(guest)}
                            className="inline-block h-14 w-14 rounded-full ring-4 ring-[#0a0a0b] relative z-0 hover:z-10 hover:scale-110 transition-transform duration-300 cursor-pointer"
                        >
                            {guest.image ? (
                                <Image src={guest.image} alt={guest.name} width={56} height={56} className="rounded-full object-cover" unoptimized referrerPolicy="no-referrer" />
                            ) : (
                                <div className="h-full w-full rounded-full bg-gradient-to-br from-emerald-500/30 to-green-500/30 flex items-center justify-center text-white font-black text-sm border border-white/10">
                                    {guest.name?.[0]?.toUpperCase() || <User className="w-5 h-5" />}
                                </div>
                            )}
                        </motion.div>
                    ))}
                    {totalCount > 6 && (
                        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full ring-4 ring-[#0a0a0b] bg-white/5 border border-white/10 text-white/60 font-black text-sm backdrop-blur-sm">
                            +{totalCount - 6}
                        </div>
                    )}
                </div>

                {totalCount <= 3 && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="ml-6 text-white/30 text-sm italic font-medium"
                    >
                        Join the group...
                    </motion.p>
                )}
            </div>
        </div>
    );
}
