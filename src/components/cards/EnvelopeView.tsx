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
        } else if (onChangeImage) {
            onChangeImage();
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[700px] w-full relative perspective-[2500px]">
            {/* Main Envelope & Card Group */}
            <motion.div
                className="relative w-[280px] md:w-[360px] h-[280px] md:h-[360px] cursor-pointer flex items-center justify-center"
                onClick={handleOpen}
                initial={false}
                animate={isOpened ? {
                    y: 60,
                    rotateZ: 0,
                    rotateY: 0,
                    rotateX: 0
                } : {
                    y: 0,
                    rotateZ: 0,
                    rotateY: 0,
                    rotateX: 0
                }}
                whileHover={!isOpened ? { scale: 1.05, transition: { duration: 0.3 } } : {}}
                transition={{ type: "spring", stiffness: 35, damping: 15 }}
                style={{ transformStyle: "preserve-3d" }}
            >
                {/* ENVELOPE IMAGE (Background) */}
                <div className="absolute inset-0 z-0 pointer-events-none drop-shadow-2xl flex items-end justify-center pb-8">
                    <img src="/envelope.png" alt="Envelope" className="w-[100%] h-auto object-contain" />
                </div>

                {/* MASKED CONTAINER FOR THE CARD */}
                <div 
                    className="absolute inset-0 z-10 pointer-events-none"
                    style={{
                        // This clip path creates a V-shape mask that exactly follows the envelope's front flap.
                        // Anything below this V-shape will be hidden, creating the "tucked in" illusion.
                        clipPath: 'polygon(-50% -100%, 150% -100%, 150% 54%, 100% 54%, 50% 78%, 0 54%, -50% 54%)'
                    }}
                >
                    {/* THE CARD (Slides out from behind the mask) */}
                    <motion.div
                        className="absolute left-[15%] bottom-[20%] w-[70%] aspect-square bg-white shadow-2xl flex flex-col items-center overflow-hidden border border-black/5 rounded-2xl z-10 pointer-events-auto"
                        initial={false}
                        animate={isOpened ? {
                            y: -160,
                            x: 0,
                            rotateZ: -6,
                            rotateY: 0,
                            scale: 1.15,
                            zIndex: 10
                        } : {
                            y: 40, // Pushed down deep into the pocket
                            x: 0,
                            rotateZ: 0,
                            rotateY: 0,
                            scale: 0.95,
                            zIndex: 10
                        }}
                    transition={{
                        type: "spring",
                        stiffness: 35,
                        damping: 14,
                        delay: isOpened ? 0.2 : 0
                    }}
                >
                    <div className="w-full h-full relative group bg-white">
                        {coverImage ? (
                            <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-50">
                                <span className="text-4xl">✉️</span>
                            </div>
                        )}

                        {/* Change Image Button Overlay */}
                        {onChangeImage && (
                            <motion.div
                                className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[70] opacity-0 group-hover:opacity-100"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onChangeImage();
                                    }}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-bold shadow-xl border border-white/20 rounded-full hover:bg-black/80 transition-colors whitespace-nowrap"
                                >
                                    <ImagePlus className="w-4 h-4" />
                                    <span>Change image</span>
                                </button>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
                </div>
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
