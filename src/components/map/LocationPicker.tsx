"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MapPin, X, Navigation, Loader2 } from "lucide-react";
import MapContainer from "./MapContainer";

interface LocationPickerProps {
    value: string;
    onChange: (value: string) => void;
}

interface Suggestion {
    display_name: string;
    lat: string;
    lon: string;
    address?: {
        building?: string;
        house_number?: string;
        road?: string;
        suburb?: string;
        city?: string;
    };
}

export default function LocationPicker({ value, onChange }: LocationPickerProps) {
    const [searchQuery, setSearchQuery] = useState(value);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [mapCenter, setMapCenter] = useState<[number, number]>([9.082, 8.6753]); // Default Nigeria center
    const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
    const [zoom, setZoom] = useState(6);
    const searchRef = useRef<HTMLDivElement>(null);

    // Initial center if value exists
    useEffect(() => {
        if (value && !markerPosition) {
            handleSearch(value, true);
        }
    }, []);

    // Close suggestions on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setSuggestions([]);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearch = async (query: string, silent = false) => {
        if (!query.trim() || query.length < 3) {
            setSuggestions([]);
            return;
        }

        if (!silent) setIsLoading(true);
        try {
            const response = await fetch(`/api/location/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error("Search failed");
            
            const data = await response.json();
            if (Array.isArray(data)) {
                setSuggestions(data);
                
                if (silent && data.length > 0) {
                    const lat = parseFloat(data[0].lat);
                    const lon = parseFloat(data[0].lon);
                    setMapCenter([lat, lon]);
                    setMarkerPosition([lat, lon]);
                    setZoom(16);
                }
            }
        } catch (error) {
            console.error("Geocoding error:", error);
            setSuggestions([]);
        } finally {
            if (!silent) setIsLoading(false);
        }
    };

    const handleSelectSuggestion = (suggestion: Suggestion) => {
        const lat = parseFloat(suggestion.lat);
        const lon = parseFloat(suggestion.lon);
        
        setMapCenter([lat, lon]);
        setMarkerPosition([lat, lon]);
        setZoom(17);
        
        setSearchQuery(suggestion.display_name);
        onChange(suggestion.display_name);
        setSuggestions([]);
        setIsOpen(true);
    };

    const handleMapSelect = async (lat: number, lng: number) => {
        setMarkerPosition([lat, lng]);
        
        try {
            const response = await fetch(`/api/location/reverse?lat=${lat}&lon=${lng}`);
            if (!response.ok) throw new Error("Reverse geocoding failed");
            
            const data = await response.json();
            if (data && data.display_name) {
                setSearchQuery(data.display_name);
                onChange(data.display_name);
            }
        } catch (error) {
            console.error("Reverse geocoding error:", error);
        }
    };

    const clearLocation = () => {
        setSearchQuery("");
        onChange("");
        setMarkerPosition(null);
        setSuggestions([]);
    };

    return (
        <div className="space-y-2">
            <div className="relative" ref={searchRef}>
                <div className="flex items-center gap-4 px-6 py-5 group transition-all">
                    <MapPin className={`w-5 h-5 transition-colors ${value ? 'text-white' : 'text-white/40'}`} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            handleSearch(e.target.value);
                            onChange(e.target.value);
                        }}
                        placeholder="Location"
                        className="bg-transparent border-none outline-none w-full text-base font-bold text-white placeholder:text-white/20 focus:placeholder:text-transparent"
                    />
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
                    ) : searchQuery ? (
                        <button onClick={clearLocation} type="button" className="p-1 hover:bg-white/10 rounded-full transition-colors">
                            <X className="w-4 h-4 text-white/40 hover:text-white" />
                        </button>
                    ) : (
                        <Search className="w-5 h-5 text-white/20" />
                    )}
                </div>

                {/* Suggestions Dropdown */}
                {suggestions.length > 0 && (
                    <div className="absolute top-full left-6 right-6 z-[110] mt-1 bg-black/90 backdrop-blur-3xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 rounded-xl">
                        {suggestions.map((s, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => handleSelectSuggestion(s)}
                                className="w-full text-left px-5 py-3 hover:bg-white/10 flex items-start gap-3 border-b border-white/5 last:border-0 group transition-all"
                            >
                                <Navigation className="w-3.5 h-3.5 text-white/20 group-hover:text-white mt-1 shrink-0" />
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-bold text-white/90 group-hover:text-white truncate">
                                        {s.display_name.split(',')[0]}
                                    </span>
                                    <span className="text-[10px] font-medium text-white/40 group-hover:text-white/60 truncate">
                                        {s.display_name}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Map Trigger */}
            <div className="flex justify-between items-center px-6 pb-2">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-all flex items-center gap-2 group"
                >
                    <div className={`p-1 rounded-full border transition-all ${isOpen ? 'bg-white border-white' : 'border-white/20 group-hover:border-white/40'}`}>
                        <div className={`w-1 h-1 rounded-full ${isOpen ? 'bg-black' : 'bg-transparent'}`} />
                    </div>
                    {isOpen ? 'Hide Map' : 'Set location on map'}
                </button>
            </div>

            {/* Map Area */}
            {isOpen && (
                <div className="h-[350px] animate-in fade-in zoom-in-95 duration-500">
                    <MapContainer
                        center={mapCenter}
                        zoom={zoom}
                        onLocationSelect={handleMapSelect}
                        markerPosition={markerPosition}
                    />
                </div>
            )}
        </div>
    );
}
