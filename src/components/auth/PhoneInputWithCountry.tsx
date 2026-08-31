"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { countries, Country, getCountryFlag, POPULAR_COUNTRY_CODES } from "@/lib/countries";
import { ChevronDown, Search, Check, X } from "lucide-react";

interface PhoneInputWithCountryProps {
    value: string;
    onChange: (phone: string) => void;
    selectedDial: string;
    onDialChange: (dial: string) => void;
    id?: string;
    name?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    autoFocus?: boolean;
    className?: string;
}

export default function PhoneInputWithCountry({
    value,
    onChange,
    selectedDial,
    onDialChange,
    id = "phone",
    name = "phone",
    placeholder = "802 345 6789",
    required = true,
    disabled = false,
    autoFocus = false,
    className = "",
}: PhoneInputWithCountryProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [openUpwards, setOpenUpwards] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isFocused, setIsFocused] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const phoneInputRef = useRef<HTMLInputElement>(null);

    const handleToggle = () => {
        if (disabled) return;
        if (!isOpen && dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            // If less than 280px below and there's enough room above, open upwards
            if (spaceBelow < 280 && rect.top > spaceBelow) {
                setOpenUpwards(true);
            } else {
                setOpenUpwards(false);
            }
        }
        setIsOpen(!isOpen);
    };

    // Find currently selected country object
    const selectedCountry = useMemo(() => {
        return countries.find((c) => c.dial === selectedDial) || {
            name: "Nigeria",
            code: "NGA",
            dial: "+234",
        };
    }, [selectedDial]);

    // Popular countries
    const popularCountries = useMemo(() => {
        return POPULAR_COUNTRY_CODES.map((code) => countries.find((c) => c.code === code)).filter(Boolean) as Country[];
    }, []);

    // Filtered countries
    const filteredCountries = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return countries;
        return countries.filter(
            (c) =>
                c.name.toLowerCase().includes(query) ||
                c.code.toLowerCase().includes(query) ||
                c.dial.includes(query)
        );
    }, [searchQuery]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            setTimeout(() => searchInputRef.current?.focus(), 50);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const handleSelectCountry = (country: Country) => {
        onDialChange(country.dial);
        setIsOpen(false);
        setSearchQuery("");
        setTimeout(() => phoneInputRef.current?.focus(), 100);
    };

    // Format phone number visually
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        // Keep only digits and spaces
        const cleaned = raw.replace(/[^\d\s]/g, "");
        onChange(cleaned);
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {/* Unified Input Container */}
            <div
                className={`flex items-center bg-[#18181b] border rounded-2xl transition-all duration-200 overflow-hidden ${
                    isFocused
                        ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-lg shadow-emerald-500/10"
                        : "border-white/10 hover:border-white/20"
                } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
                {/* Country Trigger Button */}
                <button
                    type="button"
                    onClick={handleToggle}
                    disabled={disabled}
                    className="flex items-center gap-2 px-3.5 sm:px-4 py-3.5 bg-white/[0.03] hover:bg-white/[0.07] transition-colors border-r border-white/10 text-white flex-shrink-0 select-none group"
                    title={`${selectedCountry.name} (${selectedCountry.dial})`}
                >
                    <span className="text-xl leading-none">
                        {getCountryFlag(selectedCountry.code)}
                    </span>
                    <span className="font-mono text-sm sm:text-base font-bold text-gray-200 group-hover:text-white">
                        {selectedCountry.dial}
                    </span>
                    <ChevronDown
                        className={`w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-transform duration-200 ${
                            isOpen ? "rotate-180 text-emerald-400" : ""
                        }`}
                    />
                </button>

                {/* Phone Number Input */}
                <div className="relative flex-1">
                    <input
                        ref={phoneInputRef}
                        id={id}
                        name={name}
                        type="tel"
                        value={value}
                        onChange={handlePhoneChange}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder={placeholder}
                        required={required}
                        disabled={disabled}
                        autoFocus={autoFocus}
                        className="w-full bg-transparent text-white px-4 py-3.5 outline-none placeholder:text-gray-600 font-mono tracking-wider text-base sm:text-lg"
                    />
                </div>
            </div>

            {/* Country Selector Dropdown Popover - Full width matching input */}
            {isOpen && (
                <div
                    className={`absolute ${
                        openUpwards ? "bottom-[calc(100%+8px)]" : "top-[calc(100%+8px)]"
                    } left-0 w-full bg-[#161618] border border-white/15 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] z-[100] overflow-hidden animate-in fade-in ${
                        openUpwards ? "slide-in-from-bottom-2" : "slide-in-from-top-2"
                    } duration-150 backdrop-blur-2xl`}
                >
                    {/* Search Header */}
                    <div className="p-3 border-b border-white/10 bg-black/50">
                        <div className="relative">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search country or code..."
                                className="w-full bg-[#1e1e20] border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Quick Popular Chips (when not searching) */}
                        {!searchQuery && (
                            <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-white/5">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider self-center mr-1">
                                    Popular:
                                </span>
                                {popularCountries.slice(0, 5).map((pop) => (
                                    <button
                                        key={pop.code}
                                        type="button"
                                        onClick={() => handleSelectCountry(pop)}
                                        className={`px-2 py-0.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                                            selectedCountry.code === pop.code
                                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                                : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
                                        }`}
                                    >
                                        <span>{getCountryFlag(pop.code)}</span>
                                        <span>{pop.dial}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Scrollable Country List */}
                    <div className="max-h-48 sm:max-h-52 overflow-y-auto divide-y divide-white/5 custom-scrollbar">
                        {filteredCountries.length > 0 ? (
                            filteredCountries.map((c) => {
                                const isSelected = selectedCountry.code === c.code || selectedCountry.dial === c.dial;
                                return (
                                    <button
                                        key={`${c.code}-${c.dial}`}
                                        type="button"
                                        onClick={() => handleSelectCountry(c)}
                                        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left transition-colors ${
                                            isSelected
                                                ? "bg-emerald-500/10 text-white font-bold"
                                                : "hover:bg-white/5 text-gray-300"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                            <span className="text-xl flex-shrink-0">
                                                {getCountryFlag(c.code)}
                                            </span>
                                            <span className="text-xs sm:text-sm truncate">
                                                {c.name}
                                            </span>
                                            <span className="text-[10px] font-mono text-gray-400 uppercase bg-white/5 px-1.5 py-0.5 rounded">
                                                {c.code}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className="font-mono text-xs text-emerald-400 font-semibold">
                                                {c.dial}
                                            </span>
                                            {isSelected && (
                                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                            )}
                                        </div>
                                    </button>
                                );
                            })
                        ) : (
                            <div className="py-6 text-center text-gray-500 text-xs">
                                No countries found for &ldquo;{searchQuery}&rdquo;
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
