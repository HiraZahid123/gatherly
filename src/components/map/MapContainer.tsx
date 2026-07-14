"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const MapComponent = dynamic(() => import("./MapComponent"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-white/5 rounded-2xl border border-white/10 animate-pulse">
            <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Loading Map...</span>
            </div>
        </div>
    ),
});

interface MapContainerProps {
    center: [number, number];
    zoom: number;
    onLocationSelect: (lat: number, lng: number) => void;
    markerPosition: [number, number] | null;
}

export default function MapContainer({ center, zoom, onLocationSelect, markerPosition }: MapContainerProps) {
    return (
        <div className="w-full h-full min-h-[300px] relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
            <MapComponent 
                center={center} 
                zoom={zoom} 
                onLocationSelect={onLocationSelect} 
                markerPosition={markerPosition} 
            />
            
            {/* Overlay hint */}
            <div className="absolute bottom-4 left-4 right-4 z-[10] pointer-events-none transition-opacity duration-500 group-hover:opacity-0 opacity-100">
                <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 inline-flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest whitespace-nowrap">Click map to pick location</span>
                </div>
            </div>
        </div>
    );
}
