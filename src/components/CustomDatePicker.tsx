"use client";

import { useState, useEffect, useRef } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays } from "date-fns";
import { ChevronLeft, ChevronRight, Clock, Globe } from "lucide-react";
import { VIBE_THEMES } from "../lib/theme";

interface CustomDatePickerProps {
    startDate: string;
    endDate: string;
    onChange: (dates: { startDate: string; endDate: string }) => void;
    onClose: () => void;
    vibeId: string;
}

export default function CustomDatePicker({ startDate, endDate, onChange, onClose, vibeId }: CustomDatePickerProps) {
    const theme = VIBE_THEMES.find(v => v.id === vibeId) || VIBE_THEMES[0];
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [activeTab, setActiveTab] = useState<"start" | "end">("start");
    const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(
        startDate ? new Date(startDate) : null
    );
    const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(
        endDate ? new Date(endDate) : null
    );

    const containerRef = useRef<HTMLDivElement>(null);

    // Click outside handler
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                onClose();
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    // Helper to render calendar days
    const renderDays = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate_ = startOfWeek(monthStart);
        const endDate_ = endOfWeek(monthEnd);

        const rows = [];
        let days = [];
        let day = startDate_;
        let formattedDate = "";

        while (day <= endDate_) {
            for (let i = 0; i < 7; i++) {
                formattedDate = format(day, "d");
                const cloneDay = day;
                const isSelected = activeTab === "start"
                    ? selectedStartDate && isSameDay(day, selectedStartDate)
                    : selectedEndDate && isSameDay(day, selectedEndDate);

                const isOtherSelected = activeTab === "start"
                    ? selectedEndDate && isSameDay(day, selectedEndDate)
                    : selectedStartDate && isSameDay(day, selectedStartDate);

                const isInRange = selectedStartDate && selectedEndDate &&
                    day > selectedStartDate && day < selectedEndDate;

                days.push(
                    <div
                        key={day.toString()}
                        className={`relative h-9 w-9 flex items-center justify-center cursor-pointer text-sm transition-all rounded-none
                            ${!isSameMonth(day, monthStart) ? "text-white/10" : "text-white/60"}
                            ${isSelected ? "text-white font-bold z-10" : "hover:bg-white/5"}
                            ${isOtherSelected ? "border border-white/20" : ""}
                            ${isInRange ? "bg-white/5" : ""}
                        `}
                        style={isSelected ? { backgroundColor: theme.primaryColor } : {}}
                        onClick={(e) => {
                            e.preventDefault();
                            if (activeTab === "start") {
                                setSelectedStartDate(cloneDay);
                                if (selectedEndDate && cloneDay > selectedEndDate) {
                                    setSelectedEndDate(null);
                                }
                            } else {
                                if (selectedStartDate && cloneDay < selectedStartDate) {
                                    setSelectedStartDate(cloneDay);
                                    setSelectedEndDate(null);
                                } else {
                                    setSelectedEndDate(cloneDay);
                                }
                            }
                        }}
                    >
                        <span>{formattedDate}</span>
                        {isSameDay(day, new Date()) && !isSelected && (
                            <div className="absolute bottom-1 w-1 h-1 rounded-none opacity-40" style={{ backgroundColor: theme.primaryColor }}></div>
                        )}
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div className="grid grid-cols-7 gap-1" key={day.toString()}>
                    {days}
                </div>
            );
            days = [];
        }
        return <div className="space-y-1">{rows}</div>;
    };

    const handleTimeChange = (type: 'h' | 'm', value: number) => {
        const targetDate = activeTab === "start" ? selectedStartDate : selectedEndDate;
        if (!targetDate) return;

        let newDate = new Date(targetDate);
        if (type === 'h') newDate.setHours(value);
        else newDate.setMinutes(value);

        if (activeTab === "start") setSelectedStartDate(newDate);
        else setSelectedEndDate(newDate);
    };

    const confirmSelection = () => {
        onChange({
            startDate: selectedStartDate ? selectedStartDate.toISOString() : "",
            endDate: selectedEndDate ? selectedEndDate.toISOString() : ""
        });
        onClose();
    };

    return (
        <div
            ref={containerRef}
            className="w-full max-w-[440px] bg-black/40 backdrop-blur-3xl border border-white/10 rounded-none overflow-hidden shadow-[0_60px_100px_-30px_rgba(0,0,0,0.8)] animate-in slide-in-from-top-4 duration-300 flex flex-col pointer-events-auto"
        >
            {/* Background Glow */}
            <div
                className="absolute top-0 left-0 w-full h-32 opacity-10 pointer-events-none"
                style={{ background: `linear-gradient(to b, ${theme.primaryColor}, transparent)` }}
            ></div>

            {/* Tabs */}
            <div className="p-6 pb-0 shrink-0 relative z-10">
                <div className="flex bg-black/20 p-1 rounded-none border border-white/5 relative">
                    <button
                        onClick={(e) => { e.preventDefault(); setActiveTab("start"); }}
                        className={`flex-1 py-3 rounded-none text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "start" ? "text-white shadow-2xl ring-1 ring-white/10" : "text-white/20 hover:text-white/40"
                            }`}
                        style={activeTab === "start" ? { backgroundColor: `${theme.primaryColor}20` } : {}}
                    >
                        Start Date
                    </button>
                    <div className="flex items-center px-1 text-white/10">
                        <ChevronRight className="w-4 h-4" />
                    </div>
                    <button
                        onClick={(e) => { e.preventDefault(); setActiveTab("end"); }}
                        className={`flex-1 py-3 rounded-none text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "end" ? "text-white shadow-2xl ring-1 ring-white/10" : "text-white/20 hover:text-white/40"
                            }`}
                        style={activeTab === "end" ? { backgroundColor: `${theme.primaryColor}20` } : {}}
                    >
                        <span className="block text-[7px] opacity-40 mb-0.5">Optional</span>
                        End Date
                    </button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row p-6 pt-5 gap-8 relative z-10">
                {/* Calendar Section */}
                <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/90">
                            {format(currentMonth, "MMMM yyyy")}
                        </h3>
                        <div className="flex gap-3">
                            <button onClick={(e) => { e.preventDefault(); setCurrentMonth(subMonths(currentMonth, 1)) }} className="text-white/40 hover:text-white transition-colors">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button onClick={(e) => { e.preventDefault(); setCurrentMonth(addMonths(currentMonth, 1)) }} className="text-white/40 hover:text-white transition-colors">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center mb-1">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                            <span key={d} className="text-[9px] font-black uppercase tracking-widest text-white/20">{d}</span>
                        ))}
                    </div>

                    {renderDays()}
                </div>

                {/* Time Section */}
                <div className="flex flex-col items-center justify-center sm:border-l border-white/5 sm:pl-8 py-2 shrink-0">
                    <div className="flex flex-col items-center gap-2 mb-6 group">
                        <div
                            className="w-8 h-8 rounded-none bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors"
                        >
                            <Clock className="w-4 h-4 text-white/40" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/40 group-hover:text-white/60 transition-colors">
                            {activeTab === "start" ? "Start Time" : "End Time"}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex flex-col items-center gap-1">
                            <select
                                className="appearance-none bg-black/40 border border-white/5 rounded-none px-3 py-2 text-xl font-black text-white outline-none hover:bg-black/60 transition-all cursor-pointer"
                                value={(activeTab === "start" ? selectedStartDate : selectedEndDate)?.getHours() || 0}
                                onChange={(e) => handleTimeChange('h', parseInt(e.target.value))}
                                style={{ borderColor: `${theme.primaryColor}30` }}
                            >
                                {Array.from({ length: 24 }).map((_, i) => (
                                    <option key={i} value={i} className="bg-[#1a0c0c]">{i.toString().padStart(2, '0')}</option>
                                ))}
                            </select>
                        </div>
                        <span className="text-xl font-black text-white/10">:</span>
                        <div className="flex flex-col items-center gap-1">
                            <select
                                className="appearance-none bg-black/40 border border-white/5 rounded-none px-3 py-2 text-xl font-black text-white outline-none hover:bg-black/60 transition-all cursor-pointer"
                                value={(activeTab === "start" ? selectedStartDate : selectedEndDate)?.getMinutes() || 0}
                                onChange={(e) => handleTimeChange('m', parseInt(e.target.value))}
                                style={{ borderColor: `${theme.primaryColor}30` }}
                            >
                                {Array.from({ length: 60 }).map((_, i) => (
                                    <option key={i} value={i} className="bg-[#1a0c0c]">{i.toString().padStart(2, '0')}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-black/20 mt-auto relative z-10">
                <div className="flex items-center gap-2 text-white/30 text-[9px] font-black uppercase tracking-widest">
                    <Globe className="w-3 h-3" />
                    <span>PKT GMT+5</span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 group cursor-pointer">
                        <button
                            type="button"
                            className="text-white/80 group-hover:text-white text-[9px] font-black uppercase tracking-widest underline decoration-white/20 underline-offset-4 transition-colors"
                        >
                            Set as TBD
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); confirmSelection(); }}
                        className="text-white px-6 py-2 rounded-none font-black text-[9px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                        style={{ backgroundColor: theme.primaryColor, boxShadow: `0 10px 20px -5px ${theme.primaryColor}40` }}
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}

