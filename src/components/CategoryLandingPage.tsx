"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export interface TemplateData {
    id: string;
    image: string;
    label: string;
}

interface CategoryLandingPageProps {
    title: string;
    description: string;
    templates: TemplateData[];
}

export default function CategoryLandingPage({ title, description, templates }: CategoryLandingPageProps) {
    const featuredTemplates = templates.slice(0, 2);

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white overflow-hidden relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#00E676]/10 blur-[120px] rounded-full pointer-events-none" />

            <section className="pt-40 pb-20 px-6 lg:px-20 container mx-auto relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
                    <div className="flex-1 max-w-xl">
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6 leading-tight"
                        >
                            {title}
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-lg md:text-xl text-white/70 mb-10 leading-relaxed font-light"
                        >
                            {description}
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Link 
                                href="/events/create" 
                                className="inline-flex items-center justify-center px-10 py-5 bg-gradient-to-r from-[#00E676] to-[#00C853] text-[#0a0a0c] font-black rounded-full hover:shadow-[0_0_30px_rgba(0,230,118,0.4)] hover:scale-105 transition-all duration-300 text-lg tracking-wide"
                            >
                                Start creating
                            </Link>
                        </motion.div>
                    </div>

                    <div className="flex-1 relative w-full aspect-square md:aspect-video lg:aspect-square max-w-2xl">
                        {featuredTemplates.length > 0 ? (
                            <>
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9, rotateZ: -5 }}
                                    animate={{ opacity: 1, scale: 1, rotateZ: -10 }}
                                    transition={{ delay: 0.2, type: "spring" }}
                                    className="absolute left-[10%] top-[10%] w-[60%] aspect-[9/16] bg-[#16181c] rounded-3xl shadow-2xl border border-white/10 overflow-hidden z-10"
                                >
                                    <div className="w-full h-[60%] bg-gradient-to-br from-[#00E676]/20 to-[#FFB300]/20 relative">
                                        <Image src={featuredTemplates[0]?.image || "/partiful/disco-pride.avif"} alt="Cover" fill className="object-cover opacity-80 mix-blend-overlay" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#16181c] to-transparent" />
                                    </div>
                                    <div className="p-6 text-white absolute bottom-0 w-full bg-[#16181c]/80 backdrop-blur-md">
                                        <h3 className="text-2xl font-black mb-1 capitalize">{featuredTemplates[0]?.label || "Featured"}</h3>
                                        <p className="text-[#00E676] font-medium text-sm">Featured pick</p>
                                    </div>
                                </motion.div>

                                {featuredTemplates[1] && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9, rotateZ: 10 }}
                                        animate={{ opacity: 1, scale: 1, rotateZ: 5 }}
                                        transition={{ delay: 0.3, type: "spring" }}
                                        className="absolute right-[10%] top-[20%] w-[60%] aspect-[9/16] bg-[#1a1c23] rounded-3xl shadow-2xl shadow-black/50 border border-white/10 overflow-hidden z-20"
                                    >
                                        <div className="w-full h-[60%] bg-gradient-to-br from-indigo-500/30 to-purple-500/30 relative">
                                            <Image src={featuredTemplates[1].image || "/partiful/mocktail-party.avif"} alt="Cover" fill className="object-cover opacity-90 mix-blend-overlay" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1c23] to-transparent" />
                                        </div>
                                        <div className="p-6 text-white absolute bottom-0 w-full bg-[#1a1c23]/80 backdrop-blur-md">
                                            <h3 className="text-2xl font-black mb-1 text-[#FFB300] capitalize">{featuredTemplates[1].label}</h3>
                                            <p className="text-white/70 font-medium text-sm">Trending</p>
                                        </div>
                                    </motion.div>
                                )}
                            </>
                        ) : (
                            <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-white/20 bg-white/5 text-white/60 text-lg">
                                No templates published for this category yet.
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <section className="py-24 px-6 lg:px-20 container mx-auto text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
                        Endless design options
                    </h2>
                    <p className="text-xl text-white/60 mb-16 font-light">
                        Start with a premium template, or customize your own.
                    </p>
                </motion.div>

                {templates.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-white/20 bg-white/5 px-8 py-16 text-white/70 text-lg">
                        No published templates are available in this category right now.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
                        {templates.map((template, i) => (
                            <motion.div 
                                key={template.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <Link 
                                    href={`/events/create?poster=${encodeURIComponent(template.image)}`}
                                    className="flex flex-col items-center group cursor-pointer block w-full"
                                >
                                    <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-xl shadow-black/40 mb-6 relative transition-all duration-500 group-hover:scale-[1.03] group-hover:shadow-[0_20px_40px_rgba(0,230,118,0.15)] ring-1 ring-white/10 group-hover:ring-[#00E676]/50">
                                        <Image 
                                            src={template.image}
                                            alt={template.label}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white tracking-wide uppercase">{template.label}</h3>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
