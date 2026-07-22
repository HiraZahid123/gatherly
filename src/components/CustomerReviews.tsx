"use client";

import Image from "next/image";
import { Star } from "lucide-react";

export default function CustomerReviews() {
    const reviews = [
        {
            name: "Semilore A.",
            role: "Event Organizer",
            avatar: "/assets/g-1.avif",
            content: "This platform completely changed how I organize my events. The customizable templates are stunning and the guest management is incredibly intuitive."
        },
        {
            name: "Babatunde O.",
            role: "Host",
            avatar: "/assets/b-1.avif",
            content: "I used to dread collecting RSVPs and tracking who was coming. Now it's the easiest part of throwing a party. Highly recommend to everyone!"
        },
        {
            name: "Ifeoma N.",
            role: "Wedding Planner",
            avatar: "/assets/g-2.avif",
            content: "The aesthetic quality of the invites is unmatched. My clients are always blown away by how professional and beautiful their event pages look."
        }
    ];

    return (
        <section className="py-24 bg-gray-50">
            <div className="container mx-auto px-4 max-w-7xl text-center">
                <h2 className="text-4xl md:text-5xl font-black mb-4 text-gray-900">
                    Loved by hosts everywhere
                </h2>
                <p className="text-gray-600 text-lg mb-16 max-w-2xl mx-auto">
                    Don't just take our word for it. Here's what our community has to say.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                    {reviews.map((review, i) => (
                        <div key={i} className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-shadow duration-300">
                            <div className="flex items-center gap-1 text-yellow-400 mb-6">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star key={star} className="w-5 h-5 fill-current" />
                                ))}
                            </div>
                            <p className="text-gray-700 text-lg mb-8 leading-relaxed">
                                "{review.content}"
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full overflow-hidden relative">
                                    <Image src={review.avatar} alt={review.name} fill className="object-cover" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">{review.name}</h4>
                                    <p className="text-sm text-gray-500">{review.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
