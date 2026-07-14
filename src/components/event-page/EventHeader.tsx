import React from "react";
import Image from "next/image";
import { MapPin, Clock } from "lucide-react";

interface EventHeaderProps {
    title: string;
    hostName: string;
    hostImage?: string;
    startDate: Date;
    location?: string;
    vibeId?: string;
}

export default function EventHeader({ title, hostName, hostImage, startDate, location, vibeId }: EventHeaderProps) {
    return (
        <div className="flex flex-col items-start gap-6 w-full">
            {/* Title */}
            <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tight leading-tight font-playfair animate-in fade-in slide-in-from-bottom-4 duration-700">
                {title}
            </h1>

            {/* Date */}
            <div className="text-2xl sm:text-3xl font-medium text-white/90 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
                {startDate ? startDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : "Date & Time TBD"}
                {startDate && <div className="text-lg opacity-60 mt-1">{startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>}
            </div>

            {/* Host & Location Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 text-sm font-bold text-white/60 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
                {/* Host */}
                <div className="flex items-center gap-2">
                    <span className="uppercase tracking-widest text-[10px] font-black opacity-60">Hosted by</span>
                    <div className="flex items-center gap-2 bg-white/5 pr-3 pl-1 py-1 rounded-full border border-white/10">
                        {hostImage ? (
                            <Image src={hostImage} alt={hostName} width={24} height={24} className="rounded-full object-cover" unoptimized referrerPolicy="no-referrer" />
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center text-[10px] text-white">
                                {hostName?.[0]?.toUpperCase() || "H"}
                            </div>
                        )}
                        <span className="text-white">{hostName}</span>
                    </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{location || "No Location Set"}</span>
                </div>
            </div>
        </div>
    );
}
