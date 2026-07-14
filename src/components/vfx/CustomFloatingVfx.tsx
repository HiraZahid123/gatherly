"use client";

import React, { useMemo, useEffect } from "react";
import { motion } from "framer-motion";

interface CustomFloatingVfxProps {
    imageUrl: string;
    count?: number;
    speed?: number;
}

export default function CustomFloatingVfx({
    imageUrl,
    count = 20, // Increased count
    speed = 1
}: CustomFloatingVfxProps) {
    useEffect(() => {
        console.log("CustomFloatingVfx mounted with image:", imageUrl);
    }, [imageUrl]);

    const particles = useMemo(() => {
        return Array.from({ length: count }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: 20 + Math.random() * 40,
            duration: (10 + Math.random() * 20) / speed,
            delay: Math.random() * -20,
            rotation: Math.random() * 360,
        }));
    }, [count, speed]);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    className="absolute"
                    initial={{
                        x: `${p.x}vw`,
                        y: "110vh",
                        rotate: p.rotation,
                        scale: 0,
                        opacity: 0
                    }}
                    animate={{
                        y: "-20vh",
                        x: [`${p.x}vw`, `${p.x + 5}vw`, `${p.x}vw`],
                        rotate: p.rotation + 360,
                        scale: [0, 1.2, 1.2, 0.8],
                        opacity: [0, 0.8, 0.8, 0] // Increased opacity
                    }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        delay: p.delay,
                        ease: "linear",
                    }}
                    style={{
                        width: p.size,
                        height: p.size,
                        filter: 'blur(1px)'
                    }}
                >
                    <img
                        src={imageUrl}
                        alt=""
                        onLoad={() => console.log("Custom particle image loaded successfully")}
                        onError={() => console.error("Failed to load custom particle image:", imageUrl)}
                        className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]"
                    />
                </motion.div>
            ))}
        </div>
    );
}
