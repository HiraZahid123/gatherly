import React from "react";
import { Check, HelpCircle, X, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface RSVPActionsProps {
    onRSVP: (status: "ACCEPTED" | "MAYBE" | "DECLINED") => void;
    currentStatus?: "ACCEPTED" | "MAYBE" | "DECLINED" | "PENDING";
    isLoading?: boolean;
    requireApproval?: boolean;
    isStaff?: boolean;
}

export default function RSVPActions({ onRSVP, currentStatus, isLoading, requireApproval, isStaff }: RSVPActionsProps) {
    if (isStaff) {
        return (
            <div className="flex flex-col items-center gap-4 py-8 animate-in fade-in zoom-in-95 duration-700">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Check className="w-10 h-10" strokeWidth={3} />
                </div>
                <div className="text-center space-y-1">
                    <p className="text-white font-bold">You are a Staff Member</p>
                    <p className="text-white/40 text-xs">You have full access to this event.</p>
                </div>
                <div className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Scanner Role</span>
                </div>
            </div>
        );
    }

    const actions = [
        {
            id: "ACCEPTED",
            label: currentStatus === "PENDING" ? "Requested" : (requireApproval ? "Request to Join" : "Going"),
            icon: Check,
            color: "bg-green-500",
            borderColor: "border-green-300",
            glowColor: "rgba(34,197,94,0.4)",
            activeRing: "border-green-500/30",
            labelColor: "text-green-500"
        },
        { 
            id: "MAYBE", 
            label: "Maybe", 
            icon: HelpCircle, 
            color: "bg-amber-500", 
            borderColor: "border-amber-300",
            glowColor: "rgba(245,158,11,0.4)",
            activeRing: "border-amber-500/30",
            labelColor: "text-amber-400" 
        },
        { 
            id: "DECLINED", 
            label: "Can't Go", 
            icon: X, 
            color: "bg-rose-500", 
            borderColor: "border-rose-300",
            glowColor: "rgba(244,63,94,0.4)",
            activeRing: "border-rose-500/30",
            labelColor: "text-rose-500" 
        },
    ] as const;

    return (
        <div className="flex items-center justify-center gap-6 sm:gap-10 py-8 animate-in fade-in zoom-in-95 duration-700 delay-300">
            {actions.map((action) => {
                const isActive = currentStatus === action.id || (action.id === "ACCEPTED" && currentStatus === "PENDING");
                const Icon = action.icon;
                const isPending = action.id === "ACCEPTED" && currentStatus === "PENDING";

                return (
                    <button
                        key={action.id}
                        onClick={() => onRSVP(action.id)}
                        disabled={isLoading || isPending}
                        title={action.label}
                        className={`group relative flex flex-col items-center gap-4 transition-all duration-300 ${isLoading || isPending ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                    >
                        <div className={`
                            w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center
                            backdrop-blur-xl border-[3px] shadow-2xl transition-all duration-500 relative
                            ${isActive
                                ? `${isPending ? 'bg-amber-500 border-amber-300 shadow-[0_0_40px_rgba(245,158,11,0.4)]' : `${action.color} ${action.borderColor} shadow-[0_0_40px_${action.glowColor}]`} text-white`
                                : 'bg-white/5 border-white/10 text-white/20 hover:bg-white/10 hover:border-white/20 hover:text-white/40'}
                        `}>
                            {isLoading && isActive ? (
                                <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin" strokeWidth={3} />
                            ) : (
                                <Icon className={`w-8 h-8 sm:w-10 sm:h-10 ${isActive ? 'scale-110' : 'group-hover:scale-110 group-hover:text-white'} transition-all`} strokeWidth={3} />
                            )}

                            {isActive && (
                                <motion.div 
                                    layoutId="inline-active-rsvp-glow" 
                                    className={`absolute inset-[-8px] rounded-full border ${isPending ? 'border-amber-500/30' : action.activeRing} animate-pulse`} 
                                />
                            )}
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${isActive ? (isPending ? 'text-amber-400' : action.labelColor) : 'text-white/20 group-hover:text-white/40'}`}>
                            {action.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
