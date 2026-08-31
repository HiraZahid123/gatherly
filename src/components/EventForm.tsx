"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Settings, Calendar, Crown, Plus, Link as LinkIcon, Info, Music, Gift, Shirt, Utensils, Car, Bed, X, User } from "lucide-react";
import { VIBE_THEMES } from "@/lib/theme";
import CustomDatePicker from "./CustomDatePicker";
import LocationPicker from "./map/LocationPicker";
import { format } from "date-fns";

// Hoisted outside component — these are static and must not be re-created on every render
const LINK_ICONS = [
    { id: 'Link', icon: LinkIcon },
    { id: 'Info', icon: Info },
    { id: 'Music', icon: Music },
    { id: 'Gift', icon: Gift },
    { id: 'Shirt', icon: Shirt },
    { id: 'Utensils', icon: Utensils },
    { id: 'Car', icon: Car },
    { id: 'Bed', icon: Bed },
];

const QUICK_ACTIONS = [
    { id: 'registry', label: 'Registry', icon: 'Gift', defaultText: 'Registry' },
    { id: 'food', label: 'Food situation', icon: 'Utensils', defaultText: 'Food situation' },
    { id: 'accommodations', label: 'Accommodations', icon: 'Bed', defaultText: 'Accommodations' },
    { id: 'info', label: 'Additional info', icon: 'Info', defaultText: 'Additional info' },
    { id: 'link', label: 'Link', icon: 'Link', defaultText: '' },
    { id: 'playlist', label: 'Playlist', icon: 'Music', defaultText: 'Playlist' },
    { id: 'dresscode', label: 'Dress code', icon: 'Shirt', defaultText: 'Dress code' },
    { id: 'parking', label: 'Parking', icon: 'Car', defaultText: 'Parking' },
];


interface EventFormProps {
    initialData?: {
        title?: string;
        description?: string;
        location?: string;
        startDate?: string;
        endDate?: string;
        capacity?: number | null;
        visibility?: "PUBLIC" | "PRIVATE" | "UNLISTED";
        coverImage?: string;
        theme?: any;
    };
    onSubmit: (data: any) => Promise<void>;
    onDataChange?: (data: any) => void;
    rsvpStyle?: string;
    effect?: string; // Add effect prop
    hostName?: string;
    hostImage?: string;
    onAddCohosts?: () => void;
    onCancel?: () => void;
    submitLabel?: string;
    isLoading?: boolean;
}

// Helper to format ISO strings for datetime-local inputs (YYYY-MM-DDTHH:mm)
const formatForDateTimeLocal = (isoString?: string | null) => {
    if (!isoString) return "";
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return "";
        // Use local time for the input
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (e) {
        return "";
    }
};

export default function EventForm({
    initialData,
    onSubmit,
    onDataChange,

    rsvpStyle: rsvpStyleProp,
    effect, // Destructure effect
    hostName,
    hostImage,
    onAddCohosts,
}: EventFormProps) {
    const [formData, setFormData] = useState({
        title: initialData?.title || "",
        description: initialData?.description || "",
        location: initialData?.location || "",
        startDate: initialData?.startDate || "",
        endDate: initialData?.endDate || "",
        capacity: initialData?.capacity || "",
        visibility: initialData?.visibility || "PUBLIC",
        coverImage: (initialData as any)?.coverImage || "",
        cost: "",
        vibeId: (initialData as any)?.theme?.vibeId || "classic",
        rsvp_going: (initialData as any)?.theme?.rsvpLabels?.going || "Going",
        rsvp_maybe: (initialData as any)?.theme?.rsvpLabels?.maybe || "Maybe",
        rsvp_notGoing: (initialData as any)?.theme?.rsvpLabels?.notGoing || "Can't Go",
        rsvpStyle: (initialData as any)?.theme?.rsvpStyle || "standard",
        showRSVP: (initialData as any)?.theme?.showRSVP !== undefined ? (initialData as any)?.theme?.showRSVP : true,
        requireApproval: (initialData as any)?.theme?.settings?.rsvp?.requireApproval || false,
        rsvpDeadline: formatForDateTimeLocal((initialData as any)?.rsvpDeadline),
        checkInWindowStart: (initialData as any)?.checkInWindowStart || 60,
        maxCheckIns: (initialData as any)?.maxCheckIns || 2,
        isPaid: (initialData as any)?.isPaid || false,
        links: (initialData as any)?.theme?.links || [],
        sections: (initialData as any)?.theme?.sections || [],
    });

    const [error, setError] = useState("");
    const [showRSVPCustomization, setShowRSVPCustomization] = useState(false);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

    // Ref always points to the latest formData — used by the debounce timer below
    const formDataRef = useRef(formData);
    formDataRef.current = formData;

    // Timer handle for debounced onDataChange (text inputs only)
    const dataChangeDebouncerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Section Editor State
    const [isSectionEditorOpen, setIsSectionEditorOpen] = useState(false);
    const [tempSection, setTempSection] = useState({
        title: "",
        content: ""
    });

    // Link Editor State
    const [isLinkEditorOpen, setIsLinkEditorOpen] = useState(false);
    const [tempLink, setTempLink] = useState({
        text: "",
        url: "",
        icon: "Link"
    });

    // Quick Add Actions State
    const [showAllQuickActions, setShowAllQuickActions] = useState(false);

    const visibleQuickActions = useMemo(
        () => showAllQuickActions ? QUICK_ACTIONS : QUICK_ACTIONS.slice(0, 3),
        [showAllQuickActions]
    );

    // Memoize the font class lookup — only re-runs when vibeId changes, not on every keystroke
    const activeFontClass = useMemo(
        () => VIBE_THEMES.find(v => v.id === formData.vibeId)?.fontClass || "font-playfair",
        [formData.vibeId]
    );

    // Update form when initialData changes
    useEffect(() => {
        if (initialData) {
            setFormData(prev => {
                // Only update fields that have actually changed in initialData
                // to avoid resetting unsaved changes
                const updates: any = {};
                if (initialData.title !== undefined && initialData.title !== prev.title) updates.title = initialData.title || "";
                if (initialData.description !== undefined && initialData.description !== prev.description) updates.description = initialData.description || "";
                if (initialData.location !== undefined && initialData.location !== prev.location) updates.location = initialData.location || "";
                if (initialData.startDate !== undefined && initialData.startDate !== prev.startDate) updates.startDate = initialData.startDate || "";
                if (initialData.endDate !== undefined && initialData.endDate !== prev.endDate) updates.endDate = initialData.endDate || "";
                if (initialData.capacity !== undefined && initialData.capacity !== prev.capacity) updates.capacity = initialData.capacity ?? "";
                if (initialData.visibility !== undefined && initialData.visibility !== prev.visibility) updates.visibility = initialData.visibility || "PUBLIC";
                if ((initialData as any).coverImage !== undefined && (initialData as any).coverImage !== prev.coverImage) updates.coverImage = (initialData as any).coverImage || "";
                if ((initialData as any).cost !== undefined && (initialData as any).cost !== prev.cost) updates.cost = (initialData as any).cost || "";
                if ((initialData as any).theme?.links !== undefined) updates.links = (initialData as any).theme.links || [];

                const theme = (initialData as any).theme;
                if (theme) {
                    if (theme.vibeId !== undefined && theme.vibeId !== prev.vibeId) updates.vibeId = theme.vibeId || "classic";
                    if (theme.rsvpLabels?.going !== undefined && theme.rsvpLabels.going !== prev.rsvp_going) updates.rsvp_going = theme.rsvpLabels.going || "Going";
                    if (theme.rsvpLabels?.maybe !== undefined && theme.rsvpLabels.maybe !== prev.rsvp_maybe) updates.rsvp_maybe = theme.rsvpLabels.maybe || "Maybe";
                    if (theme.rsvpLabels?.notGoing !== undefined && theme.rsvpLabels.notGoing !== prev.rsvp_notGoing) updates.rsvp_notGoing = theme.rsvpLabels.notGoing || "Can't Go";
                    if (theme.rsvpStyle !== undefined && theme.rsvpStyle !== prev.rsvpStyle) updates.rsvpStyle = theme.rsvpStyle || "standard";
                    if (theme.showRSVP !== undefined && theme.showRSVP !== prev.showRSVP) updates.showRSVP = theme.showRSVP;
                    if (theme.settings?.rsvp?.requireApproval !== undefined && theme.settings.rsvp.requireApproval !== prev.requireApproval) {
                        updates.requireApproval = theme.settings.rsvp.requireApproval;
                    }
                }

                if ((initialData as any).rsvpDeadline !== undefined && (initialData as any).rsvpDeadline !== prev.rsvpDeadline) {
                    updates.rsvpDeadline = formatForDateTimeLocal((initialData as any).rsvpDeadline);
                }
                if ((initialData as any).checkInWindowStart !== undefined && (initialData as any).checkInWindowStart !== prev.checkInWindowStart) updates.checkInWindowStart = (initialData as any).checkInWindowStart || 60;
                if ((initialData as any).maxCheckIns !== undefined && (initialData as any).maxCheckIns !== prev.maxCheckIns) updates.maxCheckIns = (initialData as any).maxCheckIns || 2;

                if (Object.keys(updates).length > 0) {
                    if ((initialData as any).theme?.sections !== undefined) updates.sections = (initialData as any).theme.sections || [];
                    return { ...prev, ...updates };
                }
                return prev;
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        let newData: any;
        if (type === "checkbox") {
            const checked = (e.target as HTMLInputElement).checked;
            newData = { ...formData, [name]: checked };
            // Checkbox changes are discrete — fire parent immediately
            setFormData(newData);
            onDataChange?.(newData);
            return;
        } else if (name === "capacity") {
            const val = value === "" ? "" : parseInt(value);
            newData = { ...formData, [name]: val };
        } else {
            newData = { ...formData, [name]: value };
        }

        // Update local state instantly so the input feels responsive
        setFormData(newData);

        // Debounce the expensive parent cascade: fires 300 ms after the user pauses typing.
        // formDataRef.current is updated every render so the callback always gets the latest value.
        if (dataChangeDebouncerRef.current) clearTimeout(dataChangeDebouncerRef.current);
        dataChangeDebouncerRef.current = setTimeout(() => {
            onDataChange?.(formDataRef.current);
        }, 300);
    };

    // Sync rsvpStyle from parent (Live Canvas header)
    useEffect(() => {
        if (rsvpStyleProp && rsvpStyleProp !== formData.rsvpStyle) {
            setFormData(prev => ({
                ...prev,
                rsvpStyle: rsvpStyleProp,
            }));
        }
    }, [rsvpStyleProp, formData.rsvpStyle]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Basic validation
        if (!formData.title.trim()) {
            setError("Title is required");
            return;
        }

        if (!formData.startDate) {
            setError("Start date is required");
            return;
        }

        // Numerical validations
        if (formData.capacity !== "" && Number(formData.capacity) <= 0) {
            setError("Capacity must be a positive number");
            return;
        }

        if (Number(formData.maxCheckIns) < 1) {
            setError("Maximum check-ins per QR must be at least 1");
            return;
        }

        if (Number(formData.checkInWindowStart) < 0) {
            setError("Check-in window cannot be negative");
            return;
        }

        // Prepare data for submission
        const submitData = {
            title: formData.title.trim(),
            description: formData.description.trim(),
            location: formData.location.trim(),
            startDate: new Date(formData.startDate).toISOString(),
            endDate: formData.endDate ? new Date(formData.endDate).toISOString() : "",
            capacity: formData.capacity === "" ? null : Number(formData.capacity),
            rsvpDeadline: formData.rsvpDeadline ? new Date(formData.rsvpDeadline).toISOString() : null,
            checkInWindowStart: Number(formData.checkInWindowStart),
            maxCheckIns: Number(formData.maxCheckIns),
            visibility: formData.visibility,
            coverImage: formData.coverImage.trim() || undefined,
            status: "PUBLISHED", // Always publish events immediately
            isPaid: formData.isPaid,
            cost: formData.cost,
            theme: {
                vibeId: formData.vibeId,
                rsvpLabels: {
                    going: formData.rsvp_going,
                    maybe: formData.rsvp_maybe,
                    notGoing: formData.rsvp_notGoing,
                },
                rsvpStyle: formData.rsvpStyle,
                showRSVP: formData.showRSVP,
                settings: {
                    rsvp: {
                        requireApproval: formData.requireApproval,
                    },
                    cost: formData.cost,
                },
                links: formData.links,
                effect: effect, // Include effect in theme
            },
        };

        try {
            await onSubmit(submitData);
        } catch (err: any) {
            console.error("Form submission error:", err);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-10 text-white max-w-xl animate-in fade-in slide-in-from-left-4 duration-700">
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-6 py-4 rounded-2xl text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span className="font-bold">{error}</span>
                </div>
            )}
            {/* Serif Title Section */}
            <div className="bg-black/40 backdrop-blur-3xl rounded-none border border-white/10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.7)] overflow-hidden">
                <div className="p-6 pb-4">
                    <input
                        id="title"
                        name="title"
                        type="text"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        className={`w-full text-3xl md:text-4xl bg-transparent border-none outline-none placeholder:text-white/20 tracking-tight transition-all focus:placeholder:text-transparent ${activeFontClass}`}
                        placeholder="Untitled Event"
                    />
                </div>

                {/* Theme Selector Pills Area */}
                <div className="bg-black/30 px-6 py-3 border-t border-white/5">
                    <div className="flex flex-wrap gap-2">
                        {VIBE_THEMES.map((vibe) => {
                            const isSelected = formData.vibeId === vibe.id;
                            return (
                                <button
                                    key={vibe.id}
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const newData = { ...formData, vibeId: vibe.id };
                                        setFormData(newData);
                                        onDataChange?.(newData);
                                    }}
                                    className={`
                                        px-4 py-1.5 text-xs font-bold transition-all duration-300
                                        ${vibe.buttonClass || "rounded-full border border-white/20 text-white/60 bg-white/5 hover:text-white hover:bg-white/10"}
                                        ${isSelected ? "ring-2 ring-white/70 ring-offset-1 ring-offset-black scale-105" : "opacity-70 hover:opacity-100"}
                                    `.trim()}
                                >
                                    {vibe.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Date Input with Picker Trigger */}
            <div className="space-y-4 pt-2 relative">
                <div className="relative">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsDatePickerOpen(!isDatePickerOpen);
                        }}
                        className={`w-full text-left bg-black/40 backdrop-blur-3xl rounded-none px-6 py-4 border transition-all hover:bg-white/[0.03] group ${isDatePickerOpen ? 'border-white/20 ring-1 ring-white/10' : 'border-white/10 shadow-lg'}`}
                    >
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 group-hover:text-white/40 transition-colors">
                                Event Date & Time
                            </span>
                            <div className="flex items-center justify-between">
                                <span className={`text-2xl font-medium tracking-tight ${formData.startDate ? 'text-white' : 'text-white/40'}`}>
                                    {formData.startDate ? (
                                        <>
                                            {format(new Date(formData.startDate), "EEE, MMM d • h:mm a")}
                                            {formData.endDate && (
                                                <span className="text-white/40 ml-2">
                                                    — {format(new Date(formData.endDate), "h:mm a")}
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        "Set a date..."
                                    )}
                                </span>
                                <Calendar className="w-6 h-6 text-white/20 group-hover:text-white/40 transition-all" />
                            </div>
                        </div>
                    </button>

                    {isDatePickerOpen && (
                        <div className="absolute top-full left-0 right-0 z-[100] pt-4">
                            <CustomDatePicker
                                startDate={formData.startDate}
                                endDate={formData.endDate}
                                onChange={(dates) => {
                                    const newData = { ...formData, ...dates };
                                    setFormData(newData);
                                    onDataChange?.(newData);
                                }}
                                onClose={() => setIsDatePickerOpen(false)}
                                vibeId={formData.vibeId}
                            />
                        </div>
                    )}
                </div>

            </div>

            {/* Cohesive Stacked Input Group */}
            <div className="rounded-none overflow-hidden border border-white/10 bg-black/40 backdrop-blur-3xl shadow-lg">


                {/* Main Host */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 hover:bg-white/[0.01] transition-all">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            {hostName ? (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FD0BD7] to-[#9D00FF] border border-white/20 flex items-center justify-center overflow-hidden shadow-lg ring-2 ring-white/10">
                                    {hostImage ? (
                                        <img src={hostImage} alt={hostName} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-lg font-bold text-white leading-none">{hostName.charAt(0).toUpperCase()}</span>
                                    )}
                                </div>
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                                    <User className="w-5 h-5 text-white/20" />
                                </div>
                            )}
                            {hostName && (
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-lg border border-black/5 ring-1 ring-black/5">
                                    <Crown className="w-3 h-3 text-black" fill="currentColor" />
                                </div>
                            )}
                        </div>
                        <span className={`text-lg font-bold tracking-tight transition-colors ${hostName ? "text-white" : "text-white/40"}`}>
                            {hostName || "Your Name"}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={onAddCohosts}
                        disabled={!hostName}
                        className={`px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs font-bold transition-all flex items-center gap-2 group/btn ${hostName
                            ? "hover:bg-white/10 text-white cursor-pointer"
                            : "opacity-40 text-white/50 cursor-not-allowed"
                            }`}
                    >
                        <Plus className={`w-3.5 h-3.5 transition-colors ${hostName ? "text-white/40 group-hover/btn:text-white" : "text-white/20"}`} />
                        Add cohosts
                    </button>
                </div>

                {/* Location */}
                <div className="border-b border-white/5 group hover:bg-white/[0.01] transition-all">
                    <LocationPicker 
                        value={formData.location} 
                        onChange={(val) => {
                            const newData = { ...formData, location: val };
                            setFormData(newData);
                            onDataChange?.(newData);
                        }} 
                    />
                </div>


                {/* Cost */}
                <div className="flex flex-col border-b border-white/5 group hover:bg-white/[0.01] transition-all">
                    <div className="flex items-center gap-4 px-6 py-4">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-5 h-5 text-white/40">
                            <path d="M5 12h14M12 5l7 7-7 7" className="rotate-[-45deg] origin-center" />
                        </svg>
                        <input
                            name="cost"
                            value={formData.cost}
                            onChange={handleChange}
                            placeholder="Cost per person"
                            className="bg-transparent border-none outline-none w-full text-base font-bold text-white/40 placeholder:text-white/20 focus:placeholder:text-transparent"
                        />
                        {formData.cost && (
                            <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
                                <input
                                    type="checkbox"
                                    name="isPaid"
                                    checked={formData.isPaid}
                                    onChange={(e) => {
                                        const newData = { ...formData, isPaid: e.target.checked };
                                        setFormData(newData);
                                        onDataChange?.(newData);
                                    }}
                                    className="sr-only peer"
                                />
                                <div className="w-10 h-5 bg-white/10 rounded-full relative peer-checked:bg-green-500 transition-colors after:content-[''] after:absolute after:top-1 after:left-1 after:w-3 after:h-3 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-5"></div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/40 peer-checked:text-white">Paid via Stripe</span>
                            </label>
                        )}
                    </div>
                </div>

                {/* Max Capacity */}
                <div className="flex items-center gap-4 px-6 py-4 border-b border-white/5 group hover:bg-white/[0.01] transition-all">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 text-white/40">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <input
                        type="number"
                        id="capacity"
                        name="capacity"
                        value={formData.capacity}
                        onChange={handleChange}
                        placeholder="Max Capacity (Unlimited)"
                        aria-label="Max Capacity"
                        title="Max Capacity"
                        className="bg-transparent border-none outline-none w-full text-base font-bold text-white/40 placeholder:text-white/20 focus:placeholder:text-transparent"
                    />
                </div>

                {/* RSVP Deadline */}
                <div className="flex items-center gap-4 px-6 py-4 border-b border-white/5 group hover:bg-white/[0.01] transition-all">
                    <Calendar className="w-5 h-5 text-white/40" />
                    <div className="flex-1 flex flex-col">
                        <label htmlFor="rsvpDeadline" className="text-[10px] font-black uppercase tracking-widest text-white/20">RSVP Deadline</label>
                        <input
                            type="datetime-local"
                            id="rsvpDeadline"
                            name="rsvpDeadline"
                            value={formData.rsvpDeadline}
                            onChange={handleChange}
                            aria-label="RSVP Deadline"
                            title="RSVP Deadline"
                            className="bg-transparent border-none outline-none w-full text-base font-bold text-white/40 placeholder:text-white/20 focus:placeholder:text-transparent"
                        />
                    </div>
                </div>

                {/* Check-in Settings */}
                <div className="grid grid-cols-2 border-b border-white/5 last:border-b-0">
                    <div className="px-6 py-4 border-r border-white/5 group hover:bg-white/[0.01] transition-all">
                        <div className="flex flex-col">
                            <label htmlFor="checkInWindowStart" className="text-[10px] font-black uppercase tracking-widest text-white/20">Check-in Window (Min)</label>
                            <input
                                type="number"
                                id="checkInWindowStart"
                                name="checkInWindowStart"
                                value={formData.checkInWindowStart}
                                onChange={handleChange}
                                aria-label="Check-in Window in Minutes"
                                title="Check-in Window (Minutes)"
                                className="bg-transparent border-none outline-none w-full text-base font-bold text-white/40 placeholder:text-white/20"
                                placeholder="60"
                            />
                        </div>
                    </div>
                    <div className="px-6 py-4 group hover:bg-white/[0.01] transition-all">
                        <div className="flex flex-col">
                            <label htmlFor="maxCheckIns" className="text-[10px] font-black uppercase tracking-widest text-white/20">Max Scans per QR</label>
                            <input
                                type="number"
                                id="maxCheckIns"
                                name="maxCheckIns"
                                value={formData.maxCheckIns}
                                onChange={handleChange}
                                aria-label="Max Scans per QR"
                                title="Max Scans per QR"
                                className="bg-transparent border-none outline-none w-full text-base font-bold text-white/40 placeholder:text-white/20"
                                placeholder="2"
                            />
                        </div>
                    </div>
                </div>

                {/* Settings & Info Actions */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 group hover:bg-white/[0.01] transition-all last:border-b-0">
                    <div className="flex items-center gap-4">
                        <Settings className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
                        <span className="text-sm font-bold text-white/40 group-hover:text-white transition-colors">Advanced RSVP Settings</span>
                    </div>
                    <button
                        type="button"
                        onClick={onAddCohosts}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors"
                        title="Open RSVP Settings"
                    >
                        <Plus className="w-4 h-4 text-white/40 hover:text-white" />
                    </button>
                </div>
                {/* Links */}
                {formData.links.map((link: any) => {
                    const Icon = LINK_ICONS.find(i => i.id === link.icon)?.icon || LinkIcon;
                    return (
                        <div key={link.id} className="flex items-center gap-4 px-6 py-4 group hover:bg-white/[0.01] transition-all border-b border-white/5 relative last:border-b-0">
                            <Icon className="w-5 h-5 text-white/40" />
                            <div className="flex-1 min-w-0">
                                <a href={link.url} target="_blank" rel="noopener noreferrer" className="block text-base font-bold text-white/90 truncate hover:text-white transition-colors">
                                    {link.url.replace(/^https?:\/\//, '')}
                                </a>
                                {link.text && link.text !== 'Link' && (
                                    <div className="text-xs font-bold text-white/40 truncate">{link.text}</div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    const newLinks = formData.links.filter((l: any) => l.id !== link.id);
                                    const newData = { ...formData, links: newLinks };
                                    setFormData(newData);
                                    onDataChange?.(newData);
                                }}
                                aria-label="Remove link"
                                title="Remove link"
                                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all absolute right-4"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    );
                })}
            </div>




            {/* Quick Add Actions Row */}
            <div className="space-y-6 pt-4">
                <div className="flex flex-wrap items-center gap-3">
                    {visibleQuickActions.map((action) => (
                        <button
                            key={action.id}
                            type="button"
                            onClick={() => {
                                setTempLink({ text: action.defaultText, url: "", icon: action.icon });
                                setIsLinkEditorOpen(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold hover:bg-white/10 transition-colors"
                        >
                            <span className="text-white">+ {action.label}</span>
                        </button>
                    ))}

                    <button
                        type="button"
                        onClick={() => setShowAllQuickActions(!showAllQuickActions)}
                        className="text-xs font-bold text-white/60 hover:text-white transition-colors ml-2"
                    >
                        {showAllQuickActions ? 'Show less' : 'Show more'}
                    </button>
                </div>

                {/* Link Editor Overlay */}
                {isLinkEditorOpen && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="text-[11px] font-black uppercase tracking-widest text-white/20 mb-3 px-1">(Optional) Custom Field</div>
                        <div className="bg-[#1a1a1a] rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
                            {/* Header with Gradient */}
                            <div className="bg-gradient-to-r from-[#5c2d15] to-[#8c4a1b] p-6 flex items-center justify-between group">
                                <div className="flex items-center gap-3 flex-1">
                                    <LinkIcon className="w-5 h-5 text-white/60" />
                                    <input
                                        value={tempLink.text}
                                        onChange={(e) => setTempLink({ ...tempLink, text: e.target.value })}
                                        placeholder="Link text"
                                        className="bg-transparent border-none outline-none w-full text-xl font-bold text-white placeholder:text-white/30 focus:placeholder:text-transparent"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsLinkEditorOpen(false)}
                                    aria-label="Close editor"
                                    title="Close"
                                    className="p-1 hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <X className="w-6 h-6 text-white/60" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-8 space-y-8">
                                {/* Icon Selector */}
                                <div className="space-y-4">
                                    <div className="text-sm font-bold text-white/90">Icon</div>
                                    <div className="flex flex-wrap gap-3">
                                        {LINK_ICONS.map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => setTempLink({ ...tempLink, icon: item.id })}
                                                aria-label={item.id}
                                                title={item.id}
                                                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${tempLink.icon === item.id
                                                    ? 'bg-white/10 border-2 border-white/40 ring-1 ring-white/10 shadow-lg'
                                                    : 'bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10'}`}
                                            >
                                                <item.icon className={`w-5 h-5 ${tempLink.icon === item.id ? 'text-white' : 'text-white/40'}`} strokeWidth={2.5} />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Link Input */}
                                <div className="space-y-4">
                                    <div className="text-sm font-bold text-white/90">Link *</div>
                                    <div className="relative">
                                        <input
                                            value={tempLink.url}
                                            onChange={(e) => setTempLink({ ...tempLink, url: e.target.value })}
                                            placeholder={
                                                tempLink.icon === 'Music' ? 'open.spotify.com/playlist/...' :
                                                    tempLink.icon === 'Gift' ? 'amazon.com/registry/...' :
                                                        tempLink.icon === 'Shirt' ? 'custom.link/merch' :
                                                            tempLink.icon === 'Utensils' ? 'yelp.com/biz/...' :
                                                                tempLink.icon === 'Car' ? 'uber.com/link' :
                                                                    tempLink.icon === 'Bed' ? 'airbnb.com/rooms/...' :
                                                                        'https://yourlink.com'
                                            }
                                            className="w-full bg-[#242424] border border-white/10 rounded-2xl py-5 px-6 text-base font-bold text-white placeholder:text-white/10 outline-none focus:border-white/20 transition-all font-sans"
                                        />
                                    </div>
                                </div>

                                {/* Save Button */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (tempLink.url) {
                                            const finalLinkText = tempLink.text.trim() || 'Link';
                                            const newLinks = [...formData.links, { ...tempLink, text: finalLinkText, id: Date.now().toString() }];
                                            const newData = { ...formData, links: newLinks };
                                            setFormData(newData);
                                            onDataChange?.(newData);
                                            setIsLinkEditorOpen(false);
                                            setTempLink({ text: "", url: "", icon: "Link" });
                                        }
                                    }}
                                    disabled={!tempLink.url}
                                    className="w-full py-4 bg-white text-black font-black text-base rounded-2xl hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    Add custom link
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>


            {/* Description Area */}
            <div className="relative pt-2">
                <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full bg-black/40 backdrop-blur-3xl border border-white/10 rounded-none px-6 py-4 outline-none focus:border-white/20 transition-all placeholder:text-white/20 text-base font-bold resize-none shadow-lg"
                    placeholder="Add a description of your event"
                    onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = target.scrollHeight + 'px';
                    }}
                />
            </div>

            {/* Custom Text Sections */}
            {
                formData.sections && formData.sections.length > 0 && (
                    <div className="space-y-6 pt-2">
                        {formData.sections.map((section: any) => (
                            <div key={section.id} className="relative group animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h3 className="text-xl font-black text-white mb-2">{section.title}</h3>
                                <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-none px-8 py-6 text-white/80 text-base font-medium whitespace-pre-wrap shadow-lg">
                                    {section.content}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newSections = formData.sections.filter((s: any) => s.id !== section.id);
                                        const newData = { ...formData, sections: newSections };
                                        setFormData(newData);
                                        onDataChange?.(newData);
                                    }}
                                    aria-label="Remove section"
                                    title="Remove section"
                                    className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity text-white/40 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )
            }

            {/* Section Editor Overlay */}
            {
                isSectionEditorOpen ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 pt-4">
                        <div className="bg-[#1a1a1a] rounded-[1.5rem] border border-white/10 overflow-hidden shadow-2xl">
                            <div className="p-6 space-y-4">
                                <input
                                    value={tempSection.title}
                                    onChange={(e) => setTempSection({ ...tempSection, title: e.target.value })}
                                    placeholder="Section Title (e.g., Travel Info)"
                                    className="w-full bg-transparent border-none outline-none text-xl font-black text-white placeholder:text-white/20"
                                    autoFocus
                                />
                                <div className="h-px bg-white/5 w-full" />
                                <textarea
                                    value={tempSection.content}
                                    onChange={(e) => setTempSection({ ...tempSection, content: e.target.value })}
                                    placeholder="Add details..."
                                    rows={4}
                                    className="w-full bg-transparent border-none outline-none text-base font-medium text-white/80 placeholder:text-white/20 resize-none"
                                />
                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsSectionEditorOpen(false);
                                            setTempSection({ title: "", content: "" });
                                        }}
                                        className="px-4 py-2 text-sm font-bold text-white/60 hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (tempSection.title && tempSection.content) {
                                                const newSections = [...(formData.sections || []), { ...tempSection, id: Date.now().toString() }];
                                                const newData = { ...formData, sections: newSections };
                                                setFormData(newData);
                                                onDataChange?.(newData);
                                                setIsSectionEditorOpen(false);
                                                setTempSection({ title: "", content: "" });
                                            }
                                        }}
                                        disabled={!tempSection.title || !tempSection.content}
                                        className="px-6 py-2 bg-white text-black text-sm font-bold rounded-full hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                                    >
                                        Add Section
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* More to say? Interaction */
                    <div className="flex items-center justify-center gap-4 pt-4">
                        <span className="text-sm font-bold text-white/40">More to say?</span>
                        <button
                            type="button"
                            onClick={() => setIsSectionEditorOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-full text-xs font-bold hover:bg-white/10 transition-colors"
                        >
                            <span className="text-base leading-none">+</span> New section
                        </button>
                    </div>
                )
            }

            {/* Quick Actions for Hosts */}
            <div className="pt-8 space-y-4">
                <h4 className="text-sm font-bold text-white/60">Quick actions for hosts</h4>
                <div className="flex flex-wrap gap-2.5 sm:gap-3">
                    <button type="button" className="flex items-center gap-2.5 px-4 sm:px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-left group shrink-0">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white/40 group-hover:text-white transition-colors">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                        </svg>
                        <span className="text-xs font-bold text-white/80 group-hover:text-white">Collect Info</span>
                    </button>
                    <button type="button" className="flex items-center gap-2.5 px-4 sm:px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-left group shrink-0">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white/40 group-hover:text-white transition-colors">
                            <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zm0-2a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm1-8h4V7h-4v5zm-3 7h1v-4H9v3a1 1 0 0 0 1 1z" />
                        </svg>
                        <span className="text-xs font-bold text-white/80 group-hover:text-white">Reminders</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            const newValue = !formData.requireApproval;
                            const newData = { ...formData, requireApproval: newValue };
                            setFormData(newData);
                            onDataChange?.(newData);
                        }}
                        className={`flex items-center gap-2.5 px-4 sm:px-5 py-3.5 border rounded-2xl transition-all text-left group shrink-0 ${formData.requireApproval
                            ? "bg-white/15 border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.08)]"
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                            }`}
                    >
                        <svg viewBox="0 0 24 24" fill="currentColor" className={`w-4 h-4 transition-colors ${formData.requireApproval ? "text-emerald-400" : "text-white/40 group-hover:text-white"}`}>
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z" />
                        </svg>
                        <span className={`text-xs font-bold ${formData.requireApproval ? "text-white" : "text-white/80 group-hover:text-white"}`}>
                            Require Guest Approval
                        </span>
                    </button>
                    <button type="button" className="flex items-center gap-2 px-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-left group shrink-0">
                        <span className="text-white/40 font-black text-sm group-hover:text-white transition-colors">•••</span>
                        <span className="text-xs font-bold text-white/80 group-hover:text-white">More</span>
                    </button>
                </div>
            </div>

            {/* Hidden logic */}
            <input type="submit" className="hidden" />
        </form >
    );
}
