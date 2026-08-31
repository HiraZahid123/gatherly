"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import InviteManagementPanel from "./InviteManagementPanel";
import StaffManagementPanel from "./StaffManagementPanel";
import EventScannerPanel from "./EventScannerPanel";
import BroadcastPanel from "./BroadcastPanel";
import TicketTierManager from "./TicketTierManager";
import SalesReportPanel from "./SalesReportPanel";
import StripeConnectPanel from "./StripeConnectPanel";
import PhotoAlbum from "./event-page/PhotoAlbum";
import { X, Crown, Users, FileText, Shield, Globe, Camera, DollarSign, AlarmClock, ChevronRight, Info, Plus, Settings, HelpCircle, ShieldPlus, Search, Megaphone, Mail, QrCode, Download, CheckSquare, Square, CheckCheck, UserX, Ticket, TrendingUp, CreditCard, Bell, Check, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface EventSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: any;
    settings: any;
    onUpdate: (event: any) => void;
    onToggleRSVP: (show: boolean) => void;
    onStyleChange: (style: string) => void;
    guests?: any[]; // Array of guests with { id, name, email, image, status }
    onGuestAction?: (rsvpId: string, status: 'ACCEPTED' | 'DECLINED') => void;
    initialTab?: string;
    primaryColor: string;
    selectedTheme: string;
    isHost: boolean;
    isCoHost?: boolean;
    isStaff?: boolean;
    onSelectGuest?: (guest: any) => void;
}

export default function EventSettingsModal({
    isOpen,
    onClose,
    event,
    settings,
    onUpdate,
    onToggleRSVP,
    onStyleChange,
    guests = [],
    onGuestAction,
    initialTab = "Hosts",
    primaryColor = "#3b82f6",
    selectedTheme = "streak",
    isHost = false,
    isCoHost = false,
    isStaff = false,
    onSelectGuest
}: EventSettingsModalProps) {
    const rsvpStyle = event?.theme?.rsvpStyle || "standard";
    const showRSVP = event?.theme?.showRSVP ?? true;

    const [activeTab, setActiveTab] = useState(isHost || isCoHost ? initialTab : "RSVPs");
    const [isAddingCohost, setIsAddingCohost] = useState(false);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedGuests, setSelectedGuests] = useState<Set<string>>(new Set());
    const [isExporting, setIsExporting] = useState(false);
    const [isSendingReminder, setIsSendingReminder] = useState(false);

    const toggleGuestSelection = (guestId: string) => {
        setSelectedGuests(prev => {
            const next = new Set(prev);
            if (next.has(guestId)) next.delete(guestId); else next.add(guestId);
            return next;
        });
    };

    const handleExportCSV = async () => {
        if (!event?.id) return;
        setIsExporting(true);
        try {
            const url = `/api/events/${event.id}/guests/export`;
            const a = document.createElement("a");
            a.href = url;
            a.download = "";
            document.body.appendChild(a);
            a.click();
            a.remove();
        } finally {
            setIsExporting(false);
        }
    };

    const handleBatchConfirm = async () => {
        if (!event?.id || selectedGuests.size === 0) return;
        for (const rsvpId of selectedGuests) {
            await onGuestAction?.(rsvpId, "ACCEPTED");
        }
        setSelectedGuests(new Set());
        setSelectionMode(false);
    };

    const handleBatchDecline = async () => {
        if (!event?.id || selectedGuests.size === 0) return;
        for (const rsvpId of selectedGuests) {
            await onGuestAction?.(rsvpId, "DECLINED");
        }
        setSelectedGuests(new Set());
        setSelectionMode(false);
    };

    const handleSendReminder = async () => {
        if (!event?.id || selectedGuests.size === 0) return;
        setIsSendingReminder(true);
        try {
            await fetch(`/api/events/${event.id}/guests/remind`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rsvpIds: [...selectedGuests] }),
            });
            setSelectedGuests(new Set());
            setSelectionMode(false);
        } finally {
            setIsSendingReminder(false);
        }
    };

    // Reset tab when modal opens or initialTab changes
    useEffect(() => {
        if (isOpen) {
            setActiveTab(isHost || isCoHost ? initialTab : "RSVPs");
        }
    }, [isOpen, initialTab, isHost, isCoHost]);

    if (!isOpen) return null;

    const allNavItems = [
        { id: "Invitations", icon: Mail, label: "Invitations" },
        { id: "Hosts", icon: Crown, label: "Hosts" },
        { id: "Staff", icon: Users, label: "Manage Staff" },
        { id: "Scanner", icon: QrCode, label: "Check-in Terminal" },
        { id: "RSVPs", icon: Users, label: "RSVP Settings" },
        { id: "Privacy", icon: Shield, label: "Display & Privacy" },
        { id: "Messaging", icon: Megaphone, label: "Messaging" },
        { id: "Photo Album", icon: Camera, label: "Photo Album" },
        { id: "Auto-Reminders", icon: AlarmClock, label: "Auto-Reminders" },
        { id: "Tickets", icon: Ticket, label: "Ticket Tiers" },
        { id: "Sales", icon: TrendingUp, label: "Sales & Payouts" },
        { id: "Stripe", icon: CreditCard, label: "Stripe Connect" },
    ];

    const hasAdminAccess = isHost || isCoHost;
    const navItems = hasAdminAccess
        ? allNavItems
        : isStaff
            ? allNavItems.filter(item => ["RSVPs", "Scanner"].includes(item.id))
            : allNavItems.filter(item => item.id === "RSVPs");

    const updateSetting = (section: string, key: string | null, value: any) => {
        let updatedEvent = {
            ...event,
            theme: {
                ...(event?.theme || {}),
                settings: {
                    ...(event?.theme?.settings || {}),
                    [section]: key === null ? value : {
                        ...(event?.theme?.settings?.[section] || {}),
                        [key]: value
                    }
                }
            }
        };
        
        // Force a completely new reference for arrays to guarantee re-renders
        if (section === "reminders" && Array.isArray(value)) {
            updatedEvent.theme.settings.reminders = [...value];
        }

        // Sync visibility with isPrivate
        if (section === "privacy" && key === "isPrivate") {
            updatedEvent.theme.settings.privacy = updatedEvent.theme.settings.privacy || {};
            updatedEvent.theme.settings.privacy.visibility = value ? "PRIVATE" : "PUBLIC";
        }

        // Handle RSVP capacity sync if needed
        if (section === "rsvp" && key === "capacity") {
            // Ensure it's a number or null
            updatedEvent.theme.settings.rsvp.capacity = value === "" ? null : Number(value);
        }

        onUpdate(updatedEvent);
    };

    // Theme-based style adaptations
    const getModalStyle = () => {
        if (selectedTheme === 'streak') {
            return {
                background: `linear-gradient(135deg, rgba(26, 12, 12, 0.98) 0%, rgba(10, 5, 20, 0.98) 100%)`,
                boxShadow: `0 30px 60px -12px rgba(0, 0, 0, 0.5), 0 18px 36px -18px rgba(99, 102, 241, 0.2)`
            };
        }
        // Custom color adaptation
        return {
            background: `linear-gradient(135deg, rgba(26, 12, 12, 0.98) 0%, ${primaryColor}15 100%)`,
            boxShadow: `0 30px 60px -12px rgba(0, 0, 0, 0.5), 0 18px 36px -18px ${primaryColor}30`
        };
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 md:p-10">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-3xl animate-in fade-in duration-500"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div
                className="relative w-full max-w-5xl h-[85vh] border border-white/10 rounded-none shadow-[0_60px_100px_-30px_rgba(0,0,0,0.8)] flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 fade-in duration-500"
                style={getModalStyle()}
            >
                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/5 bg-black/40 flex flex-col pt-4 md:pt-6 shrink-0 min-h-0 h-full overflow-hidden">
                    <div className="px-4 md:px-6 mb-3 md:mb-4 flex items-center gap-3 shrink-0">
                        <button onClick={onClose} aria-label="Close Settings" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                            <X className="w-4 h-4 text-white/40 hover:text-white" />
                        </button>
                        <h2 className="text-[11px] font-black uppercase tracking-widest text-white/60">Event Settings</h2>
                    </div>

                    <nav className="flex md:flex-col px-4 md:px-0 space-x-2 md:space-x-0 md:space-y-0.5 overflow-x-auto md:overflow-y-auto flex-1 min-h-0 pb-6 custom-scrollbar">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`flex-none md:w-full flex items-center gap-2 md:gap-3 px-4 md:px-0 md:pr-4 py-2 md:py-2.5 rounded-full md:rounded-none transition-all duration-200 group relative ${activeTab === item.id
                                    ? "text-white bg-white/10 md:bg-white/5 font-bold"
                                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.02]"
                                    }`}
                            >
                                {activeTab === item.id && (
                                    <div
                                        className="hidden md:block absolute left-0 top-0 bottom-0 w-0.5"
                                        style={{ backgroundColor: selectedTheme === 'streak' ? '#6366f1' : primaryColor }}
                                    />
                                )}
                                <item.icon
                                    className={`w-4 h-4 md:ml-6 transition-colors duration-200 ${activeTab === item.id ? "text-white" : "text-white/20 group-hover:text-white/40"}`}
                                    style={activeTab === item.id && selectedTheme !== 'streak' ? { color: primaryColor } : {}}
                                />
                                <span className="text-[12px] font-bold tracking-tight whitespace-nowrap">{item.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col bg-white/[0.02] overflow-y-auto custom-scrollbar min-h-0">
                    <div className="p-8 sm:p-12 max-w-2xl mx-auto w-full h-full flex flex-col">
                        {activeTab === "Invitations" && (
                            <InviteManagementPanel eventId={event?.id || ""} />
                        )}
                        {activeTab === "Staff" && (
                            <StaffManagementPanel eventId={event?.id || ""} />
                        )}
                        {activeTab === "Scanner" && (
                            <EventScannerPanel eventId={event?.id || ""} />
                        )}
                        {activeTab === "Messaging" && (
                            <BroadcastPanel eventId={event?.id || ""} eventTitle={event?.title || "the event"} />
                        )}
                        {activeTab === "Tickets" && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Ticket Tiers</h3>
                                    <p className="text-white/30 text-xs mt-1">Create ticket tiers for paid entry. Adding a tier marks this event as paid.</p>
                                </div>
                                <TicketTierManager eventId={event?.id || ""} primaryColor={primaryColor} />
                            </div>
                        )}
                        {activeTab === "Sales" && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Sales & Payouts</h3>
                                    <p className="text-white/30 text-xs mt-1">Track revenue and tickets sold for this event.</p>
                                </div>
                                <SalesReportPanel eventId={event?.id || ""} primaryColor={primaryColor} />
                            </div>
                        )}
                        {activeTab === "Stripe" && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Stripe Connect</h3>
                                    <p className="text-white/30 text-xs mt-1">Link your Stripe account to receive ticket payouts.</p>
                                </div>
                                <StripeConnectPanel />
                            </div>
                        )}
                        {activeTab === "Hosts" && (
                            <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {isAddingCohost ? (
                                    <div className="flex-1 flex flex-col h-full bg-black/40 rounded-none border border-white/5 overflow-hidden">
                                        {/* Header */}
                                        <div className="p-6 border-b border-white/5 space-y-4">
                                            <div className="flex items-center gap-4">
                                                <button onClick={() => setIsAddingCohost(false)} aria-label="Cancel Add Cohost" className="p-1 hover:bg-white/5 rounded-none transition-colors">
                                                    <X className="w-5 h-5 text-white/40" />
                                                </button>
                                                <h3 className="text-xl font-black tracking-tight uppercase">Add Cohosts</h3>
                                            </div>
                                            <div className="relative">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                                <input
                                                    placeholder="SEARCH BY NAME OR EMAIL"
                                                    className="w-full bg-white/5 border border-white/5 rounded-none py-3 pl-12 pr-4 text-[10px] font-black tracking-widest text-white placeholder:text-white/20 focus:outline-none focus:border-white/10 transition-all font-sans uppercase"
                                                />
                                            </div>
                                        </div>

                                        {/* Empty State */}
                                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                                            <div className="relative w-24 h-24 mb-2">
                                                {/* Desert Illustration Approximation */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-orange-400/20 to-transparent rounded-full blur-2xl opacity-50" />
                                                <div className="relative flex flex-col items-center justify-center h-full">
                                                    {/* Custom Cactus/Desert SVG */}
                                                    <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <rect x="25" y="20" width="10" height="30" rx="5" fill="#4ADE80" />
                                                        <path d="M25 35H18C16.3431 35 15 33.6569 15 32V28" stroke="#4ADE80" strokeWidth="4" strokeLinecap="round" />
                                                        <path d="M35 28V32C35 33.6569 36.3431 35 38 35H45" stroke="#4ADE80" strokeWidth="4" strokeLinecap="round" />
                                                        <circle cx="45" cy="15" r="8" fill="#FACC15" />
                                                    </svg>
                                                    <div className="absolute bottom-0 w-full h-1/4 bg-orange-900/30 blur-sm rounded-full" />
                                                </div>
                                            </div>
                                            <h4 className="text-xl font-black tracking-tight">No contacts</h4>
                                            <p className="text-sm text-white/40 font-bold max-w-[280px]">
                                                To invite cohosts via link, save your event first
                                            </p>
                                        </div>

                                        {/* Footer */}
                                        <div className="p-6 border-t border-white/5">
                                            <button
                                                onClick={() => setIsAddingCohost(false)}
                                                className="w-full py-4 bg-white text-black font-black uppercase tracking-widest text-xs rounded-none transition-all active:scale-[0.98] shadow-lg"
                                                style={{ backgroundColor: selectedTheme === 'streak' ? 'white' : primaryColor, color: selectedTheme === 'streak' ? 'black' : '#ffffff' }}
                                            >
                                                Confirm Selection
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-10">
                                        <section>
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-2xl font-black tracking-tight">Manage Hosts</h3>
                                                <HelpCircle className="w-5 h-5 text-white/20 cursor-help" />
                                            </div>
                                            <p className="text-sm text-white/40 font-bold leading-relaxed mb-10">
                                                Hosts can edit & manage this event, including adding/removing other cohosts
                                            </p>

                                            <div className="space-y-6">
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between group">
                                                        <div className="flex items-center gap-4 flex-1">
                                                            <div className="relative group/avatar">
                                                                <div className="w-12 h-12 rounded-none bg-white/5 flex items-center justify-center text-xs font-black shadow-lg overflow-hidden border border-white/10 group-hover/avatar:border-white/30 transition-all">
                                                                    {settings.hostImage ? (
                                                                        <Image src={settings.hostImage} width={48} height={48} alt={settings.hostName} className="object-cover" unoptimized referrerPolicy="no-referrer" />
                                                                    ) : (
                                                                        (settings.hostName || "H").substring(0, 2).toUpperCase()
                                                                    )}
                                                                </div>
                                                                 <button
                                                                    disabled={!isHost}
                                                                    onClick={() => {
                                                                        const url = prompt("Enter Image URL:", settings.hostImage || "");
                                                                        if (url !== null) updateSetting("", "hostImage", url);
                                                                    }}
                                                                    aria-label="Change Host Image"
                                                                    className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-all disabled:pointer-events-none"
                                                                >
                                                                    <Camera className="w-4 h-4 text-white" />
                                                                </button>
                                                            </div>
                                                                 <div className="flex-1">
                                                                    <input
                                                                        disabled={!isHost}
                                                                        value={settings.hostName || ""}
                                                                        onChange={(e) => updateSetting("", "hostName", e.target.value)}
                                                                        placeholder="Set Host Name"
                                                                        className="w-full bg-transparent border-none text-lg font-bold text-white/90 focus:outline-none focus:ring-0 placeholder:text-white/20 p-0 disabled:opacity-70"
                                                                    />
                                                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest block">Main Host</span>
                                                                </div>
                                                        </div>
                                                        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Creator</span>
                                                    </div>
                                                </div>

                                                {/* Co-hosts List */}
                                                {settings.hosts?.cohosts?.map((cohost: any) => (
                                                    <div key={cohost.id} className="flex items-center justify-between group animate-in fade-in slide-in-from-left-2 transition-all">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-sm font-bold overflow-hidden border border-white/10">
                                                                {cohost.image ? (
                                                                    <Image src={cohost.image} width={48} height={48} alt={cohost.name} className="object-cover" unoptimized referrerPolicy="no-referrer" />
                                                                ) : (
                                                                    (cohost.name || "C").substring(0, 2).toUpperCase()
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="text-xl font-bold text-white/90">{cohost.name}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-xs font-bold text-white/30 uppercase tracking-widest">Co-host</span>
                                                             <button
                                                                disabled={!isHost}
                                                                onClick={() => {
                                                                    const newCohosts = settings.hosts.cohosts.filter((c: any) => c.id !== cohost.id);
                                                                    updateSetting("hosts", "cohosts", newCohosts);
                                                                }}
                                                                aria-label={`Remove Cohost ${cohost.name}`}
                                                                className="p-2 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all disabled:opacity-0 pointer-events-none"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Centered Add Cohost Button */}
                                                 <div className="flex justify-center pt-2">
                                                    {isHost && (
                                                        <button
                                                            onClick={() => setIsAddingCohost(true)}
                                                            className="px-8 py-3 bg-white/5 border border-white/10 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-none hover:bg-white/10 transition-all shadow-xl active:scale-95"
                                                            style={{ borderColor: `${primaryColor}40`, color: primaryColor }}
                                                        >
                                                            Add Cohost
                                                        </button>
                                                    )}
                                                </div>

                                                <hr className="border-white/5 my-8" />

                                                {/* Link Sharing Section */}
                                                <div className="space-y-6">
                                                    <div className="flex items-center justify-between">
                                                        <div className="space-y-1">
                                                            <h4 className="text-lg font-black tracking-tight" style={{ color: primaryColor }}>Add Cohost Via Link</h4>
                                                            <p className="text-sm text-white/30 font-bold">Anyone with the link can become a host</p>
                                                        </div>
                                                         <label className={`relative inline-flex items-center ${isHost ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                                                            <input
                                                                type="checkbox"
                                                                disabled={!isHost}
                                                                checked={settings.hosts?.linkSharing}
                                                                onChange={(e) => updateSetting("hosts", "linkSharing", e.target.checked)}
                                                                className="sr-only peer"
                                                            />
                                                            <div
                                                                className="w-12 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all transition-all shadow-inner border border-white/5"
                                                                style={{ backgroundColor: settings.hosts?.linkSharing ? (selectedTheme === 'streak' ? '#6366f1' : primaryColor) : 'rgba(255,255,255,0.1)' }}
                                                            ></div>
                                                        </label>
                                                    </div>
                                                    <p className="flex items-center gap-2 text-[11px] text-white/20 font-black uppercase tracking-widest">
                                                        <Info className="w-4 h-4" />
                                                        Save event to enable link sharing
                                                    </p>
                                                </div>

                                                {/* Promotion from Guests (Existing Logic hidden if not confirmed) */}
                                                {guests.filter(g => g.status === "ACCEPTED" && !settings.hosts?.cohosts?.some((c: any) => c.id === g.id)).length > 0 && (
                                                    <div className="pt-8 space-y-4">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20 px-2">Promote Confirmed Guests</p>
                                                        <div className="space-y-2">
                                                            {guests.filter(g => g.status === "ACCEPTED" && !settings.hosts?.cohosts?.some((c: any) => c.id === g.id)).map(guest => (
                                                                <button
                                                                    key={guest.id}
                                                                    onClick={() => {
                                                                        const newCohosts = [...(settings.hosts?.cohosts || []), guest];
                                                                        updateSetting("hosts", "cohosts", newCohosts);
                                                                    }}
                                                                    className="w-full flex items-center justify-between p-3 bg-white/[0.02] hover:bg-white/5 rounded-2xl border border-white/5 transition-all text-left group"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold overflow-hidden border border-white/5">
                                                                            {guest.image ? <Image src={guest.image} width={32} height={32} alt={guest.name} className="object-cover" unoptimized referrerPolicy="no-referrer" /> : guest.name?.charAt(0)}
                                                                        </div>
                                                                        <span className="text-sm font-bold opacity-70 group-hover:opacity-100">{guest.name || guest.email}</span>
                                                                    </div>
                                                                    <Plus className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </section>
                                    </div>
                                )}
                            </div>
                        )}


                        {activeTab === "RSVPs" && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <section>
                                    <div className="flex items-center gap-2 mb-8">
                                        <h3 className="text-2xl font-black tracking-tight">RSVP Settings</h3>
                                        <HelpCircle className="w-5 h-5 text-white/20 cursor-help" />
                                    </div>

                                    {/* Pending Requests Section */}
                                    {isHost && settings.rsvp?.requireApproval && guests.filter(g => g.status === "PENDING").length > 0 && (
                                        <div className="mb-10 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500/80">Pending Requests ({guests.filter(g => g.status === "PENDING").length})</h4>
                                            </div>
                                            <div className="grid gap-3">
                                                {guests.filter(g => g.status === "PENDING").map((guest) => (
                                                    <div key={guest.id} className="flex items-center justify-between p-4 bg-orange-500/5 border border-orange-500/10 rounded-none group hover:bg-orange-500/10 transition-all cursor-pointer" onClick={() => { onSelectGuest?.(guest); onClose(); }}>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-none bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                                                                {guest.image ? <Image src={guest.image} width={40} height={40} alt={guest.name} className="object-cover" unoptimized referrerPolicy="no-referrer" /> : guest.name?.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-white/90">{guest.name}</p>
                                                                <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest">{guest.email || "No Email"}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => onGuestAction?.(guest.rsvpId || guest.id, 'ACCEPTED')}
                                                                className="px-4 py-2 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-white/90 transition-all active:scale-95"
                                                                style={{ backgroundColor: selectedTheme === 'streak' ? 'white' : primaryColor, color: selectedTheme === 'streak' ? 'black' : '#ffffff' }}
                                                            >
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => onGuestAction?.(guest.rsvpId || guest.id, 'DECLINED')}
                                                                className="px-4 py-2 bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95"
                                                            >
                                                                Decline
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-6">
                                        {/* Accept RSVPs */}
                                        <div className="flex items-center justify-between pb-4 border-b border-white/5">
                                            <span className="text-[13px] font-bold">Accept RSVPs</span>
                                             <label className={`relative inline-flex items-center ${isHost ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                                                <input
                                                    type="checkbox"
                                                    disabled={!isHost}
                                                    checked={showRSVP}
                                                    onChange={(e) => onToggleRSVP(e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div
                                                    className="w-10 h-5 bg-white/10 peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-none after:h-4 after:w-4 after:transition-all transition-all"
                                                    style={{ backgroundColor: showRSVP ? (selectedTheme === 'streak' ? '#6366f1' : primaryColor) : 'rgba(255,255,255,0.1)' }}
                                                ></div>
                                            </label>
                                        </div>

                                        {/* Require Guest Approval */}
                                        <div className="space-y-4 pb-4 border-b border-white/5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[13px] font-bold">Require Guest Approval</span>
                                                 <label className={`relative inline-flex items-center ${hasAdminAccess ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                                                    <input
                                                        type="checkbox"
                                                        disabled={!hasAdminAccess}
                                                        checked={settings.rsvp?.requireApproval}
                                                        onChange={(e) => updateSetting("rsvp", "requireApproval", e.target.checked)}
                                                        className="sr-only peer"
                                                    />
                                                    <div
                                                        className="w-10 h-5 bg-white/10 peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-none after:h-4 after:w-4 after:transition-all transition-all"
                                                        style={{ backgroundColor: settings.rsvp?.requireApproval ? (selectedTheme === 'streak' ? '#6366f1' : primaryColor) : 'rgba(255,255,255,0.1)' }}
                                                    ></div>
                                                </label>
                                            </div>
                                            <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">Guests will request to "Get on the list"</p>
                                        </div>

                                        {/* Max Capacity */}
                                        <div className="space-y-6 pb-6 border-b border-white/5">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <span className="text-sm font-bold">Max Capacity</span>
                                                    <p className="text-xs text-white/30 font-medium max-w-[280px]">Limit the number of guests (and plus ones) who can RSVP "Going"</p>
                                                </div>
                                                <div className="flex items-center gap-4 group cursor-pointer relative">
                                                     <input
                                                        type="number"
                                                        disabled={!hasAdminAccess}
                                                        value={settings.rsvp?.capacity || ""}
                                                        onChange={(e) => {
                                                            const val = e.target.value === "" ? null : parseInt(e.target.value);
                                                            updateSetting("rsvp", "capacity", val);
                                                        }}
                                                        placeholder="Unlimited"
                                                        className="w-20 bg-transparent border-none text-right text-[13px] font-bold text-white/40 group-hover:text-white transition-colors placeholder:text-white/20 focus:outline-none focus:text-white disabled:pointer-events-none"
                                                        style={{ color: primaryColor }}
                                                    />
                                                    <Settings className={`w-3 h-3 text-white/20 transition-colors ${hasAdminAccess ? 'group-hover:text-white' : 'hidden'}`} />
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between opacity-50 pointer-events-none">
                                                <div className="space-y-1 pl-4 border-l border-white/10">
                                                    <span className="text-sm font-bold">Enable Waitlist</span>
                                                    <p className="text-xs text-white/20 font-medium max-w-[280px]">Guests on the waitlist will automatically be marked as "Going" if spots open up</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-default">
                                                    <input type="checkbox" className="sr-only peer" disabled />
                                                    <div className="w-11 h-6 bg-white/5 peer-focus:outline-none rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/10 after:border-white/5 after:border after:rounded-full after:h-5 after:w-5"></div>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Plus Ones */}
                                        <div className="flex items-center justify-between pb-4 border-b border-white/5">
                                            <span className="text-[13px] font-bold">Plus ones</span>
                                             <select
                                                disabled={!isHost}
                                                value={settings.rsvp?.plusOnes}
                                                onChange={(e) => updateSetting("rsvp", "plusOnes", parseInt(e.target.value))}
                                                aria-label="Plus Ones Limit"
                                                className="bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-none outline-none appearance-none transition-all focus:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                                style={{ borderColor: `${primaryColor}30` }}
                                            >
                                                <option value={0} className="bg-[#1a0c0c]">None</option>
                                                <option value={1} className="bg-[#1a0c0c]">Up to 1</option>
                                                <option value={2} className="bg-[#1a0c0c]">Up to 2</option>
                                                <option value={5} className="bg-[#1a0c0c]">Up to 5</option>
                                            </select>
                                        </div>

                                        {/* Allow Guests to Invite Mutuals */}
                                        <div className="space-y-2 pb-4 border-b border-white/5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[13px] font-bold">Allow Guests to Invite Mutuals</span>
                                                 <label className={`relative inline-flex items-center ${hasAdminAccess ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                                                    <input
                                                        type="checkbox"
                                                        disabled={!hasAdminAccess}
                                                        checked={settings.rsvp?.allowMutuals}
                                                        onChange={(e) => updateSetting("rsvp", "allowMutuals", e.target.checked)}
                                                        className="sr-only peer"
                                                    />
                                                    <div
                                                        className="w-10 h-5 bg-white/10 peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-none after:h-4 after:w-4 after:transition-all transition-all"
                                                        style={{ backgroundColor: settings.rsvp?.allowMutuals ? (selectedTheme === 'streak' ? '#6366f1' : primaryColor) : 'rgba(255,255,255,0.1)' }}
                                                    ></div>
                                                </label>
                                            </div>
                                        </div>

                                        {/* RSVP Button Style */}
                                        <div className="flex items-center justify-between pb-4 border-b border-white/5">
                                            <span className="text-[13px] font-bold">RSVP Button Style</span>
                                             <select
                                                disabled={!isHost}
                                                value={rsvpStyle}
                                                onChange={(e) => onStyleChange(e.target.value)}
                                                className="bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-none outline-none appearance-none transition-all focus:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                                style={{ borderColor: `${primaryColor}30` }}
                                            >
                                                <option value="standard" className="bg-[#1a0c0c]">Standard</option>
                                                <option value="emojis" className="bg-[#1a0c0c]">Emojis</option>
                                                <option value="bloom" className="bg-[#1a0c0c]">Bloom</option>
                                            </select>
                                        </div>

                                        {/* Guest can RSVP Maybe */}
                                        <div className="flex items-center justify-between pb-4 border-b border-white/5">
                                            <span className="text-[13px] font-bold">Guests can RSVP "Maybe"</span>
                                            <label className={`relative inline-flex items-center ${isHost ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                                                <input
                                                    type="checkbox"
                                                    disabled={!isHost}
                                                    checked={settings.rsvp?.allowMaybe}
                                                    onChange={(e) => updateSetting("rsvp", "allowMaybe", e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div
                                                    className="w-10 h-5 bg-white/10 peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-none after:h-4 after:w-4 after:transition-all transition-all"
                                                    style={{ backgroundColor: settings.rsvp?.allowMaybe ? (selectedTheme === 'streak' ? '#6366f1' : primaryColor) : 'rgba(255,255,255,0.1)' }}
                                                ></div>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Guest List with Batch Actions */}
                                    <div className="pt-6 border-t border-white/5 space-y-4">
                                        {/* Header */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-xl font-black tracking-tight uppercase">Guest List</h3>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">
                                                    {guests.filter(g => ["ACCEPTED", "MAYBE"].includes(g.status)).length} confirmed
                                                </span>
                                            </div>
                                            {hasAdminAccess && (
                                                <div className="flex items-center gap-2">
                                                    <motion.button
                                                        whileTap={{ scale: 0.93 }}
                                                        onClick={handleExportCSV}
                                                        disabled={isExporting}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
                                                        title="Export CSV"
                                                    >
                                                        <Download className="w-3 h-3" />
                                                        {isExporting ? "…" : "Export"}
                                                    </motion.button>
                                                    <motion.button
                                                        whileTap={{ scale: 0.93 }}
                                                        onClick={() => { setSelectionMode(v => !v); setSelectedGuests(new Set()); }}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-[10px] font-black uppercase tracking-widest border"
                                                        style={selectionMode
                                                            ? { background: `${primaryColor}20`, borderColor: `${primaryColor}60`, color: primaryColor }
                                                            : { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }
                                                        }
                                                        title={selectionMode ? "Exit Selection" : "Manage guests"}
                                                    >
                                                        {selectionMode ? <CheckCheck className="w-3 h-3" /> : <CheckSquare className="w-3 h-3" />}
                                                        {selectionMode ? "Done" : "Manage"}
                                                    </motion.button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Batch Action Bar */}
                                        <AnimatePresence>
                                            {selectionMode && selectedGuests.size > 0 && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 40, height: 0 }}
                                                    animate={{ opacity: 1, y: 0, height: "auto" }}
                                                    exit={{ opacity: 0, y: 40, height: 0 }}
                                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div
                                                        className="flex items-center justify-between px-4 py-3 rounded-xl border"
                                                        style={{
                                                            background: `${primaryColor}10`,
                                                            borderColor: `${primaryColor}30`,
                                                        }}
                                                    >
                                                        <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: primaryColor }}>
                                                            {selectedGuests.size} selected
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <motion.button
                                                                whileTap={{ scale: 0.93 }}
                                                                onClick={handleBatchConfirm}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all text-[10px] font-black uppercase tracking-widest"
                                                            >
                                                                <Check className="w-3 h-3" />
                                                                Confirm All
                                                            </motion.button>
                                                            <motion.button
                                                                whileTap={{ scale: 0.93 }}
                                                                onClick={handleBatchDecline}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all text-[10px] font-black uppercase tracking-widest"
                                                            >
                                                                <UserX className="w-3 h-3" />
                                                                Decline All
                                                            </motion.button>
                                                            <motion.button
                                                                whileTap={{ scale: 0.93 }}
                                                                onClick={handleSendReminder}
                                                                disabled={isSendingReminder}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                                                            >
                                                                <Bell className="w-3 h-3" />
                                                                {isSendingReminder ? "Sending…" : "Remind"}
                                                            </motion.button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Guest Rows */}
                                        <div className="grid gap-2">
                                            {guests.filter(g => ["ACCEPTED", "MAYBE"].includes(g.status)).length === 0 ? (
                                                <div className="py-10 text-center bg-white/[0.02] border border-dashed border-white/5 rounded-2xl">
                                                    <p className="text-xs text-white/20 font-bold uppercase tracking-widest">No confirmed guests yet</p>
                                                </div>
                                            ) : (
                                                guests.filter(g => ["ACCEPTED", "MAYBE"].includes(g.status)).map((guest, idx) => {
                                                    const isSelected = selectedGuests.has(guest.rsvpId || guest.id);
                                                    return (
                                                        <motion.div
                                                            key={guest.id}
                                                            initial={{ opacity: 0, x: -8 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: idx * 0.02, type: "spring", stiffness: 350, damping: 28 }}
                                                            onClick={() => selectionMode ? toggleGuestSelection(guest.rsvpId || guest.id) : (onSelectGuest?.(guest), onClose())}
                                                            className="flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group"
                                                            style={{
                                                                background: isSelected ? `${primaryColor}10` : "rgba(255,255,255,0.02)",
                                                                borderColor: isSelected ? `${primaryColor}40` : "rgba(255,255,255,0.05)",
                                                            }}
                                                        >
                                                            {/* Checkbox */}
                                                            <AnimatePresence>
                                                                {selectionMode && (
                                                                    <motion.div
                                                                        initial={{ width: 0, opacity: 0 }}
                                                                        animate={{ width: "auto", opacity: 1 }}
                                                                        exit={{ width: 0, opacity: 0 }}
                                                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                                                        className="flex-shrink-0 overflow-hidden"
                                                                    >
                                                                        <motion.div
                                                                            animate={{ scale: isSelected ? [1, 1.2, 1] : 1 }}
                                                                            transition={{ duration: 0.2 }}
                                                                            className="w-5 h-5 rounded-md border flex items-center justify-center mr-1"
                                                                            style={{
                                                                                background: isSelected ? primaryColor : "transparent",
                                                                                borderColor: isSelected ? primaryColor : "rgba(255,255,255,0.2)",
                                                                            }}
                                                                        >
                                                                            {isSelected && (
                                                                                <motion.svg
                                                                                    initial={{ pathLength: 0 }}
                                                                                    animate={{ pathLength: 1 }}
                                                                                    width="10" height="10" viewBox="0 0 10 10" fill="none"
                                                                                >
                                                                                    <motion.path
                                                                                        d="M2 5L4.5 7.5L8 3"
                                                                                        stroke="white"
                                                                                        strokeWidth="1.5"
                                                                                        strokeLinecap="round"
                                                                                        strokeLinejoin="round"
                                                                                        initial={{ pathLength: 0 }}
                                                                                        animate={{ pathLength: 1 }}
                                                                                        transition={{ duration: 0.2 }}
                                                                                    />
                                                                                </motion.svg>
                                                                            )}
                                                                        </motion.div>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>

                                                            {/* Avatar */}
                                                            <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                                {guest.image ? (
                                                                    <Image src={guest.image} width={36} height={36} alt={guest.name} className="object-cover" unoptimized referrerPolicy="no-referrer" />
                                                                ) : (
                                                                    <span className="text-xs font-bold opacity-40">{guest.name?.charAt(0)}</span>
                                                                )}
                                                            </div>

                                                            {/* Info */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-sm font-bold text-white/90 truncate">{guest.name}</p>
                                                                    {guest.status === "MAYBE" && (
                                                                        <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-white/5 text-white/40 border border-white/10 rounded flex-shrink-0">Maybe</span>
                                                                    )}
                                                                </div>
                                                                <p className="text-[10px] font-medium text-white/20 uppercase tracking-widest truncate">
                                                                    {guest.email || "No Email"}
                                                                </p>
                                                            </div>

                                                            {/* Actions (non-selection mode) */}
                                                            {hasAdminAccess && !selectionMode && (
                                                                <motion.button
                                                                    whileTap={{ scale: 0.9 }}
                                                                    onClick={e => { e.stopPropagation(); onGuestAction?.(guest.rsvpId || guest.id, "DECLINED"); }}
                                                                    className="p-1.5 text-white/20 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                                    title="Remove"
                                                                >
                                                                    <X className="w-3.5 h-3.5" />
                                                                </motion.button>
                                                            )}
                                                        </motion.div>
                                                    );
                                                })
                                            )}
                                        </div>

                                        <button
                                            disabled={!hasAdminAccess}
                                            className="w-full py-4 mt-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="text-[11px] font-bold text-white/40">Want to collect info from your guests?</span>
                                            <span className="text-xs font-black uppercase tracking-widest"><span style={{ color: primaryColor }}>Add a questionnaire</span></span>
                                        </button>
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === "Privacy" && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <section>
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="text-2xl font-black tracking-tight">Display & Privacy</h3>
                                        <HelpCircle className="w-5 h-5 text-white/20 cursor-help" />
                                    </div>
                                    <p className="text-sm text-white/40 font-medium leading-relaxed mb-8">
                                        Guest List and Activity Feed are hidden pre-RSVP
                                    </p>

                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between pb-6 border-b border-white/5">
                                            <span className="text-sm font-bold">Show Activity Timestamps</span>
                                             <label className={`relative inline-flex items-center ${isHost ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                                                <input
                                                    type="checkbox"
                                                    disabled={!isHost}
                                                    checked={settings.privacy?.showTimestamps}
                                                    onChange={(e) => updateSetting("privacy", "showTimestamps", e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div
                                                    className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all transition-all"
                                                    style={{ backgroundColor: settings.privacy?.showTimestamps ? (selectedTheme === 'streak' ? '#6366f1' : primaryColor) : 'rgba(255,255,255,0.1)' }}
                                                ></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between pb-4 border-b border-white/5">
                                            <span className="text-[13px] font-bold">Show Guest Names</span>
                                             <label className={`relative inline-flex items-center ${isHost ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                                                <input
                                                    type="checkbox"
                                                    disabled={!isHost}
                                                    checked={settings.privacy?.showNames}
                                                    onChange={(e) => updateSetting("privacy", "showNames", e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div
                                                    className="w-10 h-5 bg-white/10 peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-none after:h-4 after:w-4 after:transition-all transition-all"
                                                    style={{ backgroundColor: settings.privacy?.showNames ? (selectedTheme === 'streak' ? '#6366f1' : primaryColor) : 'rgba(255,255,255,0.1)' }}
                                                ></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between pb-4 border-b border-white/5">
                                            <span className="text-[13px] font-bold">Show Guest Count</span>
                                             <label className={`relative inline-flex items-center ${isHost ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                                                <input
                                                    type="checkbox"
                                                    disabled={!isHost}
                                                    checked={settings.privacy?.showCount}
                                                    onChange={(e) => updateSetting("privacy", "showCount", e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div
                                                    className="w-10 h-5 bg-white/10 peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-none after:h-4 after:w-4 after:transition-all transition-all"
                                                    style={{ backgroundColor: settings.privacy?.showCount ? (selectedTheme === 'streak' ? '#6366f1' : primaryColor) : 'rgba(255,255,255,0.1)' }}
                                                ></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between pb-4 border-b border-white/5">
                                            <span className="text-[13px] font-bold">Event Password</span>
                                             <label className={`relative inline-flex items-center ${isHost ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                                                <input
                                                    type="checkbox"
                                                    disabled={!isHost}
                                                    checked={settings.privacy?.requirePassword}
                                                    onChange={(e) => updateSetting("privacy", "requirePassword", e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div
                                                    className="w-10 h-5 bg-white/10 peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-none after:h-4 after:w-4 after:transition-all transition-all"
                                                    style={{ backgroundColor: settings.privacy?.requirePassword ? (selectedTheme === 'streak' ? '#6366f1' : primaryColor) : 'rgba(255,255,255,0.1)' }}
                                                ></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between pb-4 border-b border-white/5">
                                            <div className="space-y-1">
                                                <span className="text-[13px] font-bold">Private Event</span>
                                                <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">Only invited guests can view and RSVP</p>
                                            </div>
                                             <label className={`relative inline-flex items-center ${isHost ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                                                <input
                                                    type="checkbox"
                                                    disabled={!isHost}
                                                    checked={settings.privacy?.isPrivate}
                                                    onChange={(e) => updateSetting("privacy", "isPrivate", e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div
                                                    className="w-10 h-5 bg-white/10 peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-none after:h-4 after:w-4 after:transition-all transition-all"
                                                    style={{ backgroundColor: settings.privacy?.isPrivate ? (selectedTheme === 'streak' ? '#6366f1' : primaryColor) : 'rgba(255,255,255,0.1)' }}
                                                ></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between pb-4 border-b border-white/5">
                                            <div className="space-y-1">
                                                <span className="text-[13px] font-bold">Hide Guest List</span>
                                                <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">Guests cannot see who else is coming</p>
                                            </div>
                                             <label className={`relative inline-flex items-center ${isHost ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                                                <input
                                                    type="checkbox"
                                                    disabled={!isHost}
                                                    checked={settings.privacy?.guestListHidden}
                                                    onChange={(e) => updateSetting("privacy", "guestListHidden", e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div
                                                    className="w-10 h-5 bg-white/10 peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-none after:h-4 after:w-4 after:transition-all transition-all"
                                                    style={{ backgroundColor: settings.privacy?.guestListHidden ? (selectedTheme === 'streak' ? '#6366f1' : primaryColor) : 'rgba(255,255,255,0.1)' }}
                                                ></div>
                                            </label>
                                        </div>

                                        <button className="w-full py-5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-none flex items-center justify-center gap-3 transition-all mt-8 group">
                                            <span className="text-[11px] font-bold text-white/40 group-hover:text-white/60 transition-colors uppercase tracking-widest">Want to control who can RSVP?</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white"><span style={{ color: primaryColor }}>Turn on Guest Approval</span></span>
                                        </button>
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === "Photo Album" && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <section>
                                    <div className="flex items-center gap-2 mb-8">
                                        <h3 className="text-2xl font-black tracking-tight">Photo Album</h3>
                                        <HelpCircle className="w-5 h-5 text-white/20 cursor-help" />
                                    </div>
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between pb-4 border-b border-white/5">
                                            <div className="space-y-1">
                                                <span className="text-[13px] font-bold">Allow Guests to Upload Photos</span>
                                                <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">Invited guests and attendees can add to the album</p>
                                            </div>
                                             <label className={`relative inline-flex items-center ${isHost ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                                                <input
                                                    type="checkbox"
                                                    disabled={!isHost}
                                                    checked={settings.photos?.allowGuestUpload ?? true}
                                                    onChange={(e) => updateSetting("photos", "allowGuestUpload", e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div
                                                    className="w-10 h-5 bg-white/10 peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-none after:h-4 after:w-4 after:transition-all transition-all"
                                                    style={{ backgroundColor: (settings.photos?.allowGuestUpload ?? true) ? (selectedTheme === 'streak' ? '#6366f1' : primaryColor) : 'rgba(255,255,255,0.1)' }}
                                                ></div>
                                            </label>
                                        </div>
                                    </div>
                                </section>
                                <section className="pt-4 border-t border-white/5">
                                    <PhotoAlbum eventId={event?.id || ""} isHost={isHost} primaryColor={primaryColor} allowGuestUpload={settings.photos?.allowGuestUpload ?? true} />
                                </section>
                            </div>
                        )}

                        {["Questionnaire", "Audience", "Chip In"].includes(activeTab) && (
                            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
                                <div className="w-16 h-16 rounded-none bg-white/5 border border-white/10 flex items-center justify-center">
                                    <Settings className="w-8 h-8 text-white/20 animate-spin-slow" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-black tracking-tighter uppercase">{activeTab}</h3>
                                    <p className="text-[11px] text-white/40 font-bold max-w-xs mx-auto uppercase tracking-widest leading-relaxed">
                                        This module is currently in development and will be available in a future update.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setActiveTab("Hosts")}
                                    className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-none text-[10px] font-black uppercase tracking-widest transition-all"
                                    style={{ color: primaryColor, borderColor: `${primaryColor}40` }}
                                >
                                    Back to Hosts
                                </button>
                            </div>
                        )}

                        {activeTab === "Auto-Reminders" && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <section>
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-2xl font-black tracking-tight">Auto-Reminders</h3>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const currentReminders = Array.isArray(settings.reminders) ? settings.reminders : [];
                                                const newReminders = [...currentReminders, { hoursBefore: 24, message: "" }];
                                                
                                                // Double-update: Force local component mutation to guarantee re-render
                                                settings.reminders = newReminders; 
                                                
                                                updateSetting("reminders", null, newReminders);
                                            }}
                                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
                                        >
                                            + Add Reminder {Array.isArray(settings.reminders) && settings.reminders.length > 0 ? `(${settings.reminders.length})` : ""}
                                        </button>
                                    </div>

                                    {!Array.isArray(settings.reminders) || settings.reminders.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-white/10 bg-white/[0.02]">
                                            <p className="text-[11px] text-white/40 font-bold uppercase tracking-widest mb-4">No reminders set</p>
                                            <p className="text-[10px] text-white/30 max-w-xs">We'll automatically send an email to accepted guests at these intervals.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {settings.reminders.map((reminder: any, index: number) => (
                                                <div key={index} className="p-4 border border-white/5 bg-white/[0.02] space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <select
                                                            value={reminder.hoursBefore}
                                                            onChange={(e) => {
                                                                const newReminders = [...settings.reminders];
                                                                newReminders[index].hoursBefore = parseInt(e.target.value);
                                                                updateSetting("reminders", null, newReminders);
                                                            }}
                                                            className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm outline-none text-white [&>option]:bg-zinc-900"
                                                        >
                                                            <option value={1} className="bg-zinc-900">1 hour before</option>
                                                            <option value={2} className="bg-zinc-900">2 hours before</option>
                                                            <option value={12} className="bg-zinc-900">12 hours before</option>
                                                            <option value={24} className="bg-zinc-900">1 day before</option>
                                                            <option value={48} className="bg-zinc-900">2 days before</option>
                                                            <option value={168} className="bg-zinc-900">1 week before</option>
                                                        </select>
                                                        <button
                                                            onClick={() => {
                                                                const newReminders = settings.reminders.filter((_: any, i: number) => i !== index);
                                                                updateSetting("reminders", null, newReminders);
                                                            }}
                                                            className="p-2 hover:bg-red-500/10 text-red-500/50 hover:text-red-500 rounded transition-colors"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <textarea
                                                        placeholder="Custom note for this reminder (optional)..."
                                                        value={reminder.message || ""}
                                                        onChange={(e) => {
                                                            const newReminders = [...settings.reminders];
                                                            newReminders[index].message = e.target.value;
                                                            updateSetting("reminders", null, newReminders);
                                                        }}
                                                        className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-sm min-h-[80px] outline-none focus:border-white/20 placeholder:text-white/20"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
