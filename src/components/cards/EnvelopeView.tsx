"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ImagePlus } from "lucide-react";

interface EnvelopeViewProps {
    coverImage?: string;
    title: string;
    description?: string;
    senderName?: string;
    isOpen?: boolean;
    onOpen?: () => void;
    isPreview?: boolean;
    font?: string; // New prop
    onChangeImage?: () => void; // New prop
    showTextContent?: boolean; // New prop
    autoOpen?: boolean; // New prop
}

export default function EnvelopeView({
    coverImage,
    title,
    description,
    senderName,
    isOpen: controlledIsOpen,
    onOpen,
    isPreview = false,
    font = "var(--font-inter)", // Default font
    onChangeImage,
    showTextContent = true,
    autoOpen = false
}: EnvelopeViewProps) {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const isOpened = controlledIsOpen ?? internalIsOpen;

    // Auto-open logic
    useEffect(() => {
        if (autoOpen && !isOpened) {
            const timer = setTimeout(() => {
                setInternalIsOpen(true);
                onOpen?.();
            }, 1200);
            return () => clearTimeout(timer);
        }
    }, [autoOpen, isOpened, onOpen]);

    const handleOpen = () => {
        if (!isOpened) {
            setInternalIsOpen(true);
            onOpen?.();
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[700px] w-full relative perspective-[2500px]">
            {/* Main Envelope & Card Group */}
            <motion.div
                className="relative w-[210px] md:w-[260px] h-[150px] md:h-[180px] cursor-pointer"
                onClick={handleOpen}
                initial={false}
                animate={isOpened ? {
                    y: 120,
                    rotateY: -10,
                    rotateX: 10
                } : {
                    y: 0,
                    rotateY: 0,
                    rotateX: 0
                }}
                whileHover={!isOpened ? { rotateY: 20, rotateX: -10, scale: 1.05, transition: { duration: 0.3 } } : {}}
                transition={{ type: "spring", stiffness: 35, damping: 15 }}
                style={{ transformStyle: "preserve-3d" }}
            >
                {/* 1. BACK OF ENVELOPE (The Container) */}
                <div className="absolute inset-0 bg-[#dacfb8] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.6)] z-0 overflow-hidden ring-1 ring-black/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent" />
                    <div className="absolute inset-0 opacity-[0.03] mix-blend-multiply" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
                </div>

                {/* 2. THE CARD (Cinematic 3D Spin Reveal) */}
                <motion.div
                    className="absolute left-[2%] top-[2%] w-[96%] aspect-square bg-white shadow-[0_30px_70px_rgba(0,0,0,0.4)] flex flex-col items-center overflow-hidden border border-black/10 rounded-none z-10"
                    initial={false}
                    animate={isOpened ? {
                        y: -150,
                        x: -25,
                        rotateZ: -5,
                        rotateY: 360,
                        scale: 1.1,
                        zIndex: 60
                    } : {
                        y: 0,
                        x: 0,
                        rotateZ: 0,
                        rotateY: 0,
                        scale: 0.92,
                        zIndex: 10
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 30,
                        damping: 12,
                        delay: isOpened ? 0.35 : 0
                    }}
                >
                    <div className="w-full h-full relative p-0.5 bg-white">
                        <div className="h-full w-full bg-white relative overflow-hidden group">
                            {coverImage ? (
                                <img src={coverImage} alt="Cover" className="w-full h-full object-contain" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-50">
                                    <span className="text-4xl">✉️</span>
                                </div>
                            )}

                            {/* Change Image Button Overlay */}
                            {onChangeImage && (
                                <motion.div
                                    className="absolute bottom-4 right-4 z-[70] opacity-0 group-hover:opacity-100"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onChangeImage();
                                        }}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-white text-black text-[12px] font-black shadow-[0_10px_30px_rgba(0,0,0,0.3)] border border-black/10 hover:bg-gray-50 uppercase tracking-tighter"
                                    >
                                        <ImagePlus className="w-4 h-4" />
                                        <span>Change</span>
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* 3. ENVELOPE FRONT FACES (Unified Origami Geometry) */}
                <div className="absolute inset-0 z-20 pointer-events-none">
                    {/* Left Flap */}
                    <div
                        className="absolute inset-0 bg-[#e8e0d5] z-20"
                        style={{
                            clipPath: 'polygon(0 0, 50% 55%, 0 100%)',
                            background: 'linear-gradient(135deg, #e8e0d5 0%, #d8d0c5 100%)'
                        }}
                    >
                        <div className="absolute inset-0 shadow-[inset_-5px_0_15px_rgba(0,0,0,0.05)]" />
                    </div>

                    {/* Right Flap */}
                    <div
                        className="absolute inset-0 bg-[#ded8cc] z-20"
                        style={{
                            clipPath: 'polygon(100% 0, 50% 55%, 100% 100%)',
                            background: 'linear-gradient(-135deg, #ded8cc 0%, #cdc7bb 100%)'
                        }}
                    >
                        <div className="absolute inset-0 shadow-[inset_5px_0_15px_rgba(0,0,0,0.05)]" />
                    </div>

                    {/* Bottom Flap */}
                    <div
                        className="absolute inset-0 z-30"
                        style={{
                            clipPath: 'polygon(0 100%, 50% 55%, 100% 100%)',
                            background: 'linear-gradient(0deg, #f0e8dc 0%, #e0d8cc 100%)',
                            boxShadow: '0 -10px 30px rgba(0,0,0,0.1)'
                        }}
                    >
                        <div className="absolute inset-0 border-t border-white/20" />
                        <div className="absolute inset-0 opacity-[0.03] mix-blend-multiply" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
                    </div>
                </div>

                {/* 4. TOP FLAP (The animated one) */}
                <motion.div
                    className="absolute top-0 left-0 right-0 h-[80%] z-40 origin-top"
                    initial={false}
                    animate={isOpened ? { rotateX: 180, zIndex: 0 } : { rotateX: 0, zIndex: 40 }}
                    transition={{ duration: 0.5, ease: "backOut" }}
                    style={{ transformStyle: "preserve-3d" }}
                >
                    {/* Outside of Flap */}
                    <div
                        className="absolute inset-0 bg-[#dacfb8] shadow-[0_15px_30px_rgba(0,0,0,0.2)]"
                        style={{
                            clipPath: 'polygon(0 0, 50% 68.75%, 100% 0)', // Calculated based on 55% of full height
                            backfaceVisibility: "hidden"
                        }}
                    >
                        <div className="absolute inset-0 opacity-[0.05] mix-blend-multiply" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
                    </div>

                    {/* Inside of Flap (Visible when open) */}
                    <div
                        className="absolute inset-0 bg-[#f4ece0] shadow-inner"
                        style={{
                            clipPath: 'polygon(0 0, 50% 68.75%, 100% 0)',
                            transform: "rotateX(180deg)",
                            backfaceVisibility: "hidden"
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                </motion.div>

            </motion.div>

            {/* Tap hint */}
            <motion.div
                className="absolute bottom-20"
                animate={isOpened ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
            >
                <div className="animate-bounce px-6 py-2 bg-black/60 backdrop-blur-xl text-white text-[10px] font-black tracking-[0.4em] uppercase border border-white/20">
                    Tap to open
                </div>
            </motion.div>

            {/* Title & Description Revealed Below */}
            {showTextContent && (
                <motion.div
                    className="mt-20 max-w-sm text-center space-y-6"
                    initial={false}
                    animate={isOpened ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.95 }}
                    transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
                >
                    <div className="space-y-1">
                        <h1 className="text-4xl md:text-6xl font-black text-white drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] tracking-tighter" style={{ fontFamily: font }}>
                            {title || "Happy New Card!"}
                        </h1>
                        {senderName && (
                            <p className="text-[11px] text-white/50 font-black uppercase tracking-[0.5em] ml-1">
                                from {senderName}
                            </p>
                        )}
                    </div>

                    {description && (
                        <div
                            className="p-10 bg-black/40 backdrop-blur-3xl border border-white/10 shadow-[0_50px_100px_-30px_rgba(0,0,0,0.7)] rounded-sm"
                            style={{ fontFamily: font }}
                        >
                            <p className="text-xl leading-relaxed text-white/90 font-medium tracking-tight">
                                {description}
                            </p>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}
