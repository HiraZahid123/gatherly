"use client";

import Image from "next/image";
import { Star } from "lucide-react";
import { motion } from "framer-motion";

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
        <motion.section
            initial={{ opacity: 0, y: 48 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="py-24 bg-gray-50"
        >
            <div className="container mx-auto px-4 max-w-7xl text-center">
                <motion.h2
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15, duration: 0.5 }}
                    className="text-4xl md:text-5xl font-black mb-4 text-gray-900"
                >
                    Loved by hosts everywhere
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.22, duration: 0.5 }}
                    className="text-gray-600 text-lg mb-16 max-w-2xl mx-auto"
                >
                    Don't just take our word for it. Here's what our community has to say.
                </motion.p>

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.15 }}
                    variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left"
                >
                    {reviews.map((review, i) => (
                        <motion.div
                            key={i}
                            variants={{ hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0 } }}
                            transition={{ duration: 0.5 }}
                            className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-shadow duration-300"
                        >
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
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </motion.section>
    );
}
