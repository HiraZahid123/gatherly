"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DisplayTemplate {
    id: string;
    title: string;
    previewImage: string;
    bgClass: string;
    theme: string;
    effect: string;
    poster: string;
    vibeId: string;
}

export default function TrendingTemplates() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [templates, setTemplates] = useState<DisplayTemplate[]>([]);

    useEffect(() => {
        const fetchTrending = async () => {
            try {
                const res = await fetch("/api/templates?trending=true");
                const data = await res.json();
                if (data.success && Array.isArray(data.templates) && data.templates.length > 0) {
                    setTemplates(
                        data.templates.map((t: any) => ({
                            id: t.id,
                            title: t.title,
                            previewImage: t.previewImage,
                            bgClass: t.bgClass || "bg-emerald-950",
                            theme: t.theme || "meadow",
                            effect: t.effect || "particles",
                            poster: t.poster || t.previewImage,
                            vibeId: t.vibeId || "fancy",
                        }))
                    );
                }
            } catch (e) {
                console.warn("Could not load dynamic trending templates, using defaults:", e);
            }
        };

        fetchTrending();
    }, []);

    const scroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = direction === "left" ? -400 : 400;
            current.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
    };

    return (
        <section className="py-24 bg-white">
            <div className="container mx-auto px-4 max-w-7xl">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                    <div>
                        <h2 className="text-4xl md:text-5xl font-black mb-2 text-gray-900">
                            Trending Templates
                        </h2>
                        <p className="text-gray-600 text-lg">
                            Customize the perfect invite. 100% free, always.
                        </p>
                    </div>

                    <div className="hidden md:flex gap-4">
                        <button
                            onClick={() => scroll("left")}
                            className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
                            aria-label="Previous template"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                            onClick={() => scroll("right")}
                            className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
                            aria-label="Next template"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div
                    ref={scrollRef}
                    className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory scrollbar-hide"
                    style={{ scrollbarWidth: "none" }}
                >
                    {templates.map((template) => (
                        <Link
                            key={template.id}
                            href={`/events/create?theme=${template.theme}&effect=${template.effect}&vibeId=${template.vibeId}&poster=${encodeURIComponent(template.poster)}`}
                            className="snap-center shrink-0 w-[80vw] md:w-[400px] aspect-[4/3] rounded-3xl overflow-hidden relative group cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 block"
                        >
                            <div className={`absolute inset-0 opacity-50 ${template.bgClass}`}></div>
                            <Image
                                src={template.previewImage}
                                alt={template.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                            {/* Inner Glass border */}
                            <div className="absolute inset-4 border border-white/20 rounded-2xl pointer-events-none"></div>

                            {/* Badge */}
                            <div className="absolute top-6 left-6 z-10">
                                <span className="px-3.5 py-1.5 bg-black/60 backdrop-blur-md rounded-full text-xs font-bold text-white border border-white/10 shadow">
                                    {template.title}
                                </span>
                            </div>

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                                <span className="bg-white text-gray-900 px-6 py-3 rounded-full font-bold shadow-xl translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                    Use Template
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}

