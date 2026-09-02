"use client";

import React from 'react';
import { Camera, Hotel, UtensilsCrossed, Music2, Sparkles, PartyPopper, MapPin } from 'lucide-react';

export default function CompanyReviews() {
    const vendors = [
        {
            category: "Party Vendors & Rentals",
            title: "Event Decor & Styling",
            desc: "Custom canopies, mood lighting & luxury party rentals",
            icon: Sparkles,
            badge: "Top Rated",
            location: "Lagos & Abuja"
        },
        {
            category: "Hotels & AirBnB",
            title: "Boutique Hotels & Villas",
            desc: "Curated stays & luxury apartments for your out-of-town guests",
            icon: Hotel,
            badge: "Guest Favorite",
            location: "Nationwide"
        },
        {
            category: "Photographers & Video",
            title: "Pro Photographers & 4K Video",
            desc: "Cinematic drone coverage, candid portraits & instant photo booths",
            icon: Camera,
            badge: "Verified Pros",
            location: "All Cities"
        },
        {
            category: "Caterers & Private Chefs",
            title: "Gourmet Catering & Small Chops",
            desc: "Signature jollof, grill masters, cocktail bars & dessert tables",
            icon: UtensilsCrossed,
            badge: "Top Caterer",
            location: "Event Catering"
        },
        {
            category: "DJs, MCs & Sound",
            title: "Live DJs & Hypemen",
            desc: "Concert-grade sound systems, MCs & high-energy playlists",
            icon: Music2,
            badge: "5-Star Energy",
            location: "Live Booking"
        },
        {
            category: "Party Supplies & Favors",
            title: "Custom Party Favors & Gifts",
            desc: "Branded souvenirs, gift boxes & party merch for your crowd",
            icon: PartyPopper,
            badge: "Popular",
            location: "Fast Delivery"
        }
    ];

    return (
        <section className="py-20 bg-gradient-to-b from-white via-gray-50/60 to-white border-y border-gray-100 overflow-hidden relative">
            <div className="container mx-auto px-6 max-w-7xl mb-10 text-center">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black uppercase tracking-widest">
                    <MapPin className="w-3 h-3 text-emerald-600" />
                    Trusted Event Network
                </span>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mt-3 tracking-tight">
                    Party Vendors, Hotels, Photographers & Caterers
                </h3>
                <p className="text-gray-500 text-sm sm:text-base mt-2 max-w-xl mx-auto font-medium">
                    Everything you and your guests need for an unforgettable celebration
                </p>
            </div>

            {/* Gradient fades on edges */}
            <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-40 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-40 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none"></div>

            <div className="flex animate-marquee hover:pause whitespace-nowrap py-2">
                {[...vendors, ...vendors, ...vendors].map((vendor, i) => (
                    <div
                        key={i}
                        className="inline-flex flex-col justify-between min-w-[320px] sm:min-w-[360px] mx-3 p-5 rounded-2xl bg-white border border-gray-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:border-emerald-300 transition-all duration-300"
                    >
                        <div className="flex items-center justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                                    <vendor.icon className="w-4 h-4" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">
                                        {vendor.category}
                                    </span>
                                    <h4 className="text-sm font-bold text-gray-900 truncate">
                                        {vendor.title}
                                    </h4>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 shrink-0">
                                {vendor.badge}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 font-normal leading-relaxed whitespace-normal line-clamp-2">
                            {vendor.desc}
                        </p>
                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 font-medium">
                            <span className="flex items-center gap-1 text-gray-500">
                                <MapPin className="w-3 h-3 text-emerald-500" />
                                {vendor.location}
                            </span>
                            <span className="text-emerald-600 font-bold hover:underline cursor-pointer">
                                Explore &rarr;
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes marquee {
                    0% { transform: translateX(0%); }
                    100% { transform: translateX(-33.33%); }
                }
                .animate-marquee {
                    animation: marquee 28s linear infinite;
                    width: max-content;
                }
                .hover\\:pause:hover {
                    animation-play-state: paused;
                }
            `}} />
        </section>
    );
}
