"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Users, Plus, Trash2, Loader2, UserPlus, Shield } from "lucide-react";

interface StaffMember {
    id: string;
    role: string;
    user: {
        id: string;
        name: string | null;
        email: string | null;
        image: string | null;
    };
    createdAt: string;
}

interface StaffManagementPanelProps {
    eventId?: string;
}

export default function StaffManagementPanel({ eventId }: StaffManagementPanelProps) {
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [emailInput, setEmailInput] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStaff = async () => {
        try {
            const response = await fetch(`/api/events/${eventId}/staff`);
            const data = await response.json();
            if (response.ok) {
                setStaff(data.staff);
            }
        } catch (err) {
            console.error("Failed to fetch staff", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (eventId) {
            fetchStaff();
        }
    }, [eventId]);

    const handleAddStaff = async () => {
        if (!emailInput.trim()) return;

        setIsAdding(true);
        setError(null);

        try {
            const response = await fetch(`/api/events/${eventId}/staff`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: emailInput.trim() })
            });

            const data = await response.json();

            if (response.ok) {
                setEmailInput("");
                fetchStaff();
            } else {
                setError(data.error || "Failed to add staff member");
            }
        } catch (err) {
            setError("Connection error");
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemoveStaff = async (staffId: string) => {
        if (!confirm("Are you sure you want to remove this staff member?")) return;

        try {
            const response = await fetch(`/api/events/${eventId}/staff/${staffId}`, {
                method: "DELETE"
            });

            if (response.ok) {
                setStaff(prev => prev.filter(s => s.id !== staffId));
            } else {
                const data = await response.json();
                alert(data.error || "Failed to remove staff");
            }
        } catch (err) {
            console.error("Failed to remove staff", err);
        }
    };

    if (!eventId) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white/[0.02] rounded-3xl border border-dashed border-white/10 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                    <Users className="w-6 h-6 text-white/20" />
                </div>
                <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white/60">Manage your Team</h4>
                    <p className="text-[10px] text-white/20 font-medium max-w-[200px] leading-relaxed uppercase tracking-widest">
                        Save your event first to start adding staff members
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Input Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <UserPlus className="w-4 h-4 text-white/40" />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Add Staff Member</h4>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="email"
                        placeholder="colleague@example.com"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-sm outline-none focus:border-white/20 transition-all placeholder:text-white/20"
                    />
                    <button
                        onClick={handleAddStaff}
                        disabled={isAdding || !emailInput.trim()}
                        className="px-6 py-3 bg-white text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/90 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center min-w-[140px]"
                    >
                        {isAdding ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <Plus className="w-3.5 h-3.5 mr-2" />
                                Add Staff
                            </>
                        )}
                    </button>
                </div>
                {error && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest">{error}</p>}
                <p className="text-[10px] text-white/20 font-medium">Added users can scan QR codes for this event</p>
            </div>

            {/* List Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Event Staff ({staff.length})</h4>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="w-6 h-6 animate-spin text-white/10" />
                    </div>
                ) : staff.length === 0 ? (
                    <div className="text-center py-10 bg-white/[0.02] rounded-2xl border border-dashed border-white/5">
                        <p className="text-xs text-white/20 font-bold uppercase tracking-widest">No staff added yet</p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {staff.map((member) => (
                            <div
                                key={member.id}
                                className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-2xl group hover:bg-white/[0.05] transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-white/5 flex items-center justify-center ring-1 ring-white/10">
                                        {member.user.image ? (
                                            <Image src={member.user.image} width={40} height={40} alt="" className="object-cover" unoptimized referrerPolicy="no-referrer" />
                                        ) : (
                                            <Users className="w-4 h-4 text-white/20" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white/80">{member.user.name || member.user.email}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Shield className="w-3 h-3 text-white/20" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-white/30">
                                                {member.role || "SCANNER"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleRemoveStaff(member.id)}
                                        className="p-2 text-white/20 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all"
                                        title="Remove Staff"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
