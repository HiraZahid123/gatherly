"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GifPickerProps {
    onSelect: (url: string, type: "GIF" | "STICKER") => void;
    onClose: () => void;
    primaryColor?: string;
}

interface GifResult {
    id: string;
    url: string;
    preview: string;
    title: string;
}

const FALLBACK_GIFS: GifResult[] = [
    { id: "1", url: "https://media.giphy.com/media/l0amJbHuX8zggJuHo5/giphy.gif", preview: "https://media.giphy.com/media/l0amJbHuX8zggJuHo5/giphy.gif", title: "party" },
    { id: "2", url: "https://media.giphy.com/media/3o7TKSHAX8M3u0D0DI/giphy.gif", preview: "https://media.giphy.com/media/3o7TKSHAX8M3u0D0DI/giphy.gif", title: "celebrate" },
    { id: "3", url: "https://media.giphy.com/media/l0HlHFRbmaZtBRhXG/giphy.gif", preview: "https://media.giphy.com/media/l0HlHFRbmaZtBRhXG/giphy.gif", title: "dancing" },
    { id: "4", url: "https://media.giphy.com/media/3o7TKDkDbIDJieKbVm/giphy.gif", preview: "https://media.giphy.com/media/3o7TKDkDbIDJieKbVm/giphy.gif", title: "fire" },
    { id: "5", url: "https://media.giphy.com/media/xT5LMHxhOfscxPfIfm/giphy.gif", preview: "https://media.giphy.com/media/xT5LMHxhOfscxPfIfm/giphy.gif", title: "confetti" },
    { id: "6", url: "https://media.giphy.com/media/3o6UB3VhArvomJHtdK/giphy.gif", preview: "https://media.giphy.com/media/3o6UB3VhArvomJHtdK/giphy.gif", title: "yes" },
    { id: "7", url: "https://media.giphy.com/media/l2JHRhAtnJSDNJ2py/giphy.gif", preview: "https://media.giphy.com/media/l2JHRhAtnJSDNJ2py/giphy.gif", title: "wow" },
    { id: "8", url: "https://media.giphy.com/media/3o7TKy7hIfM3U4Sgk8/giphy.gif", preview: "https://media.giphy.com/media/3o7TKy7hIfM3U4Sgk8/giphy.gif", title: "love" },
];

const FALLBACK_STICKERS: GifResult[] = [
    { id: "s1", url: "https://media.giphy.com/media/l41lFw057lAJQMxv2/giphy.gif", preview: "https://media.giphy.com/media/l41lFw057lAJQMxv2/giphy.gif", title: "star" },
    { id: "s2", url: "https://media.giphy.com/media/3o7btQ0BH6JUr6f32w/giphy.gif", preview: "https://media.giphy.com/media/3o7btQ0BH6JUr6f32w/giphy.gif", title: "heart" },
    { id: "s3", url: "https://media.giphy.com/media/xT5LMB2WiOdjpB7K4o/giphy.gif", preview: "https://media.giphy.com/media/xT5LMB2WiOdjpB7K4o/giphy.gif", title: "ok" },
    { id: "s4", url: "https://media.giphy.com/media/3o7TKUM3IgJBX2as9O/giphy.gif", preview: "https://media.giphy.com/media/3o7TKUM3IgJBX2as9O/giphy.gif", title: "clap" },
    { id: "s5", url: "https://media.giphy.com/media/l0HlCqV35hdEg2PGM/giphy.gif", preview: "https://media.giphy.com/media/l0HlCqV35hdEg2PGM/giphy.gif", title: "fire" },
    { id: "s6", url: "https://media.giphy.com/media/3o6Zt481isNVuQI1l6/giphy.gif", preview: "https://media.giphy.com/media/3o6Zt481isNVuQI1l6/giphy.gif", title: "eyes" },
];

export default function GifPicker({ onSelect, onClose, primaryColor = "#7c3aed" }: GifPickerProps) {
    const [search, setSearch] = useState("");
    const [tab, setTab] = useState<"GIF" | "STICKER">("GIF");
    const [results, setResults] = useState<GifResult[]>(FALLBACK_GIFS);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchGifs = useCallback(async (query: string, type: "GIF" | "STICKER") => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({ type, ...(query ? { q: query } : {}) });
            const res = await fetch(`/api/gifs?${params}`);
            const data = await res.json();
            if (data.results?.length > 0) {
                setResults(data.results);
            } else {
                setResults(type === "GIF" ? FALLBACK_GIFS : FALLBACK_STICKERS);
            }
        } catch {
            setResults(type === "GIF" ? FALLBACK_GIFS : FALLBACK_STICKERS);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGifs("", tab);
        searchRef.current?.focus();
    }, [tab, fetchGifs]);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchGifs(search, tab);
        }, 350);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [search, tab, fetchGifs]);

    const handleSelect = (gif: GifResult) => {
        setSelectedId(gif.id);
        setTimeout(() => onSelect(gif.url, tab), 200);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute bottom-full right-0 mb-3 w-80 rounded-2xl overflow-hidden shadow-[0_30px_60px_-12px_rgba(0,0,0,0.8)] z-50"
            style={{
                background: "rgba(10, 10, 11, 0.75)",
                backdropFilter: "blur(40px)",
                WebkitBackdropFilter: "blur(40px)",
                border: "1px solid rgba(255,255,255,0.08)",
            }}
        >
            {/* Glow accent */}
            <div
                className="absolute top-0 left-0 right-0 h-px opacity-60"
                style={{ background: `linear-gradient(90deg, transparent, ${primaryColor}, transparent)` }}
            />

            {/* Search */}
            <div className="p-3 border-b border-white/5">
                <div className="relative flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                        <input
                            ref={searchRef}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={`Search ${tab === "GIF" ? "GIFs" : "Stickers"}...`}
                            className="w-full bg-white/5 border border-white/5 rounded-full pl-9 pr-4 py-2 text-xs text-white placeholder:text-white/20 outline-none focus:bg-white/10 focus:border-white/15 transition-all"
                        />
                        {isLoading && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 animate-spin" />
                        )}
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={onClose}
                        className="p-1.5 hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
                    >
                        <X className="w-3.5 h-3.5 text-white/40" />
                    </motion.button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/5 relative">
                {(["GIF", "STICKER"] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`flex-1 py-2.5 text-[11px] font-black tracking-widest uppercase transition-all relative ${
                            tab === t ? "text-white" : "text-white/30 hover:text-white/60"
                        }`}
                    >
                        {t}
                        {tab === t && (
                            <motion.div
                                layoutId="gif-tab-indicator"
                                className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
                                style={{ backgroundColor: primaryColor }}
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="h-60 overflow-y-auto p-2 scrollbar-hide">
                <AnimatePresence mode="wait">
                    {isLoading && results.length === 0 ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full flex items-center justify-center"
                        >
                            <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key={`${tab}-${search}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="grid grid-cols-3 gap-1.5"
                        >
                            {results.map((gif, i) => (
                                <motion.button
                                    key={gif.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.02, type: "spring", stiffness: 400, damping: 25 }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleSelect(gif)}
                                    className="relative aspect-square rounded-xl overflow-hidden group"
                                    style={{
                                        boxShadow: selectedId === gif.id ? `0 0 0 2px ${primaryColor}` : "none",
                                    }}
                                >
                                    <img
                                        src={gif.preview}
                                        alt={gif.title}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                    <div
                                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                        style={{ background: `${primaryColor}30` }}
                                    />
                                    {selectedId === gif.id && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute inset-0 flex items-center justify-center"
                                            style={{ background: `${primaryColor}60` }}
                                        >
                                            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                                    <path d="M2 6L5 9L10 3" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="px-3 py-2 border-t border-white/5 flex items-center justify-center">
                <span className="text-[9px] text-white/15 font-black tracking-widest uppercase">Powered by GIPHY</span>
            </div>
        </motion.div>
    );
}
