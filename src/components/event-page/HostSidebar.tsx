import React, { useState, useRef, useEffect } from "react";
import { Pencil, Megaphone, UserPlus, MoreHorizontal, Settings, FileText, Copy, Trash2, HelpCircle, Download } from "lucide-react";

interface HostSidebarProps {
    onEdit: () => void;
    onTextBlast: () => void;
    onInvite: () => void;
    onSettings: () => void;
    onClone: () => void;
    onGenerateFlyer: () => void;
    onDelete: () => void;
    onAnnounce?: () => void;
    onExportCSV?: () => void;
    goingCount?: number;
    isCloning?: boolean;
    isDeleting?: boolean;
    selectedTheme?: string;
}

export default function HostSidebar({
    onEdit,
    onTextBlast,
    onInvite,
    onSettings,
    onClone,
    onGenerateFlyer,
    onDelete,
    onAnnounce,
    onExportCSV,
    goingCount = 0,
    isCloning = false,
    isDeleting = false,
    selectedTheme
}: HostSidebarProps) {
    const [isMoreOpen, setIsMoreOpen] = useState(false);
    const moreRef = useRef<HTMLDivElement>(null);

    // Calculate adaptive sidebar background
    const getSidebarBaseStyle = () => {
        let tint = "rgba(10, 10, 11, 0.6)"; // Default
        if (selectedTheme === 'streak') {
            tint = "rgba(10, 15, 30, 0.7)"; // Subtle emerald-indigo tint
        } else if (selectedTheme?.startsWith('custom-gradient:')) {
            const color = selectedTheme.split(':')[1];
            tint = `${color}15`; // ~8% opacity
        }

        return {
            backgroundColor: tint,
            backdropFilter: "blur(40px)",
        };
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
                setIsMoreOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div
            className="fixed right-0 top-1/2 -translate-y-1/2 flex flex-col items-center py-4 px-0 border-l border-white/10 rounded-l-[1.5rem] shadow-[-20px_0_50px_rgba(0,0,0,0.5)] z-50 hidden lg:flex animate-in fade-in slide-in-from-right-8 duration-700 w-16 transition-all duration-700"
            style={getSidebarBaseStyle()}
        >
            <div className="flex flex-col gap-4 items-center w-full">
                {/* Edit */}
                <button onClick={onEdit} className="flex flex-col items-center gap-1 group outline-none w-full">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center transition-all bg-white/5 group-hover:bg-white/10 hover:scale-105 active:scale-95">
                        <Pencil className="w-4 h-4 text-white opacity-80 group-hover:opacity-100" />
                    </div>
                    <span className="text-[9px] font-bold text-white/40 group-hover:text-white/80 transition-colors">Edit</span>
                </button>

                {/* Text Blast */}
                <button onClick={onTextBlast} className="flex flex-col items-center gap-1 group outline-none w-full">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center transition-all bg-white/5 group-hover:bg-white/10 hover:scale-105 active:scale-95">
                        <Megaphone className="w-4 h-4 text-white opacity-80 group-hover:opacity-100" />
                    </div>
                    <span className="text-[9px] font-bold text-white/40 group-hover:text-white/80 transition-colors">Broadcast</span>
                </button>

                {/* Going Count */}
                <button className="flex flex-col items-center gap-1 group outline-none w-full">
                    <div className="w-12 h-12 rounded-full flex flex-col items-center justify-center transition-all bg-white text-black shadow-[0_10px_30px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95">
                        <span className="text-xl font-black leading-none">{goingCount}</span>
                    </div>
                    <span className="text-[9px] font-bold text-white/40 group-hover:text-white/80 transition-colors">Going</span>
                </button>

                {/* Invite */}
                <button onClick={onInvite} className="flex flex-col items-center gap-1 group outline-none w-full">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center transition-all bg-white/5 group-hover:bg-white/10 hover:scale-105 active:scale-95">
                        <UserPlus className="w-4 h-4 text-white opacity-80 group-hover:opacity-100" />
                    </div>
                    <span className="text-[9px] font-bold text-white/40 group-hover:text-white/80 transition-colors">Invite</span>
                </button>

                {/* Announce */}
                <button
                    onClick={() => {
                        document.getElementById('announcements')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        onAnnounce?.();
                    }}
                    className="flex flex-col items-center gap-1 group outline-none w-full"
                >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center transition-all bg-amber-500/10 group-hover:bg-amber-500/20 hover:scale-105 active:scale-95">
                        <Megaphone className="w-4 h-4 text-amber-400 opacity-80 group-hover:opacity-100" />
                    </div>
                    <span className="text-[9px] font-bold text-amber-400/40 group-hover:text-amber-400/80 transition-colors">Announce</span>
                </button>

                {/* More Dropdown */}
                <div className="relative w-full flex justify-center" ref={moreRef}>
                    <button
                        onClick={() => setIsMoreOpen(!isMoreOpen)}
                        className="flex flex-col items-center gap-1.5 group outline-none w-full"
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isMoreOpen ? 'bg-white/20' : 'bg-transparent group-hover:bg-white/5'} hover:scale-105 active:scale-95`}>
                            <MoreHorizontal className={`w-4 h-4 ${isMoreOpen ? 'text-white' : 'text-white/40 group-hover:text-white/80'}`} />
                        </div>
                        <span className={`text-[9px] font-bold ${isMoreOpen ? 'text-white' : 'text-white/20 group-hover:text-white/40'} transition-colors`}>More</span>
                    </button>

                    {/* Dropdown Menu */}
                    {isMoreOpen && (
                        <div className="absolute bottom-0 right-[calc(100%+16px)] w-60 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200 z-[100]">
                            <div className="p-2 space-y-1">
                                <button
                                    onClick={() => { onSettings(); setIsMoreOpen(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-xl transition-colors group text-left"
                                >
                                    <Settings className="w-4 h-4 text-white/40 group-hover:text-white/80 transition-colors" />
                                    <span className="text-sm font-bold text-white/60 group-hover:text-white transition-colors">Event Settings</span>
                                </button>

                                <button
                                    onClick={() => { onGenerateFlyer(); setIsMoreOpen(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-xl transition-colors group text-left"
                                >
                                    <FileText className="w-4 h-4 text-white/40 group-hover:text-white/80 transition-colors" />
                                    <span className="text-sm font-bold text-white/60 group-hover:text-white transition-colors">Generate Flyer</span>
                                </button>

                                <button
                                    onClick={() => { onClone(); setIsMoreOpen(false); }}
                                    disabled={isCloning}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-xl transition-colors group text-left disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    {isCloning ? (
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Copy className="w-4 h-4 text-white/40 group-hover:text-white/80 transition-colors" />
                                    )}
                                    <span className="text-sm font-bold text-white/60 group-hover:text-white transition-colors">
                                        {isCloning ? "Cloning..." : "Clone Event"}
                                    </span>
                                </button>

                                <button
                                    onClick={() => { onExportCSV?.(); setIsMoreOpen(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-xl transition-colors group text-left"
                                >
                                    <Download className="w-4 h-4 text-white/40 group-hover:text-white/80 transition-colors" />
                                    <span className="text-sm font-bold text-white/60 group-hover:text-white transition-colors">Export Guest List</span>
                                </button>

                                <button
                                    onClick={() => window.open('/help', '_blank')}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-xl transition-colors group text-left"
                                >
                                    <HelpCircle className="w-4 h-4 text-white/40 group-hover:text-white/80 transition-colors" />
                                    <span className="text-sm font-bold text-white/60 group-hover:text-white transition-colors">Help Center ↗</span>
                                </button>

                                <div className="h-px bg-white/5 my-1 mx-2" />

                                <button
                                    onClick={() => { onDelete(); setIsMoreOpen(false); }}
                                    disabled={isDeleting}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-500/10 rounded-xl transition-colors group text-left"
                                >
                                    {isDeleting ? (
                                        <div className="w-4 h-4 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4 text-red-500/60 group-hover:text-red-500 transition-colors" />
                                    )}
                                    <span className="text-sm font-bold text-red-500/60 group-hover:text-red-500 transition-colors">
                                        {isDeleting ? "Deleting..." : "Delete event"}
                                    </span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
