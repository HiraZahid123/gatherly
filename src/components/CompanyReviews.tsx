"use client";

import React from 'react';

export default function CompanyReviews() {
    const reviews = [
        {
            company: "Premium Times Nigeria",
            quote: "\"Evites are so last decade\"",
            fontClass: "font-serif font-black tracking-widest text-red-700"
        },
        {
            company: "The State House, Abuja",
            quote: "\"This is where my social calendar exists\"",
            fontClass: "font-serif font-bold italic text-green-700"
        },
        {
            company: "THISDAY",
            quote: "\"A mainstay of my social life\"",
            fontClass: "font-sans font-black tracking-tighter"
        },
        {
            company: "The Guardian",
            quote: "\"The primary party platform\"",
            fontClass: "font-serif font-bold"
        }
    ];

    return (
        <section className="py-24 bg-white border-y border-gray-100 overflow-hidden relative">
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10"></div>
            
            <div className="flex animate-marquee hover:pause whitespace-nowrap">
                {/* Double the array for seamless looping */}
                {[...reviews, ...reviews, ...reviews].map((review, i) => (
                    <div key={i} className="flex flex-col items-center justify-center min-w-[400px] px-12 opacity-80 hover:opacity-100 transition-opacity">
                        <span className={`text-2xl mb-4 text-gray-900 ${review.fontClass}`}>
                            {review.company}
                        </span>
                        <p className="text-gray-500 font-medium text-lg">
                            {review.quote}
                        </p>
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
                    animation: marquee 20s linear infinite;
                    width: max-content;
                }
                .hover\\:pause:hover {
                    animation-play-state: paused;
                }
            `}} />
        </section>
    );
}
