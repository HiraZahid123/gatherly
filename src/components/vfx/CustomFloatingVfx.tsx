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
    count = 35, // Increased count for more chaos
    speed = 1
}: CustomFloatingVfxProps) {
    useEffect(() => {
        console.log("CustomFloatingVfx mounted with image:", imageUrl);
    }, [imageUrl]);

    const particles = useMemo(() => {
        return Array.from({ length: count }).map((_, i) => {
            const directionType = Math.floor(Math.random() * 4); // 0, 1, 2, 3
            
            let initialX: string | number, initialY: string | number;
            let animateX: any, animateY: any;
            const startOffset = Math.random() * 100;
            const wobble = Math.random() * 20;

            if (directionType === 0) { // Top to Bottom
                initialX = `${startOffset}vw`;
                initialY = "-20vh";
                animateX = [`${startOffset}vw`, `${startOffset + wobble}vw`, `${startOffset - wobble}vw`, `${startOffset}vw`];
                animateY = "120vh";
            } else if (directionType === 1) { // Bottom to Top
                initialX = `${startOffset}vw`;
                initialY = "120vh";
                animateX = [`${startOffset}vw`, `${startOffset - wobble}vw`, `${startOffset + wobble}vw`, `${startOffset}vw`];
                animateY = "-20vh";
            } else if (directionType === 2) { // Left to Right
                initialX = "-20vw";
                initialY = `${startOffset}vh`;
                animateX = "120vw";
                animateY = [`${startOffset}vh`, `${startOffset + wobble}vh`, `${startOffset - wobble}vh`, `${startOffset}vh`];
            } else { // Right to Left
                initialX = "120vw";
                initialY = `${startOffset}vh`;
                animateX = "-20vw";
                animateY = [`${startOffset}vh`, `${startOffset - wobble}vh`, `${startOffset + wobble}vh`, `${startOffset}vh`];
            }

            return {
                id: i,
                initialX,
                initialY,
                animateX,
                animateY,
                size: 25 + Math.random() * 45, // Varying sizes
                duration: (15 + Math.random() * 25) / speed, // Slow and smooth
                delay: Math.random() * -30, // Heavy negative delay to start already filled
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 360), // Smooth rotation
            };
        });
    }, [count, speed]);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    className="absolute"
                    initial={{
                        x: p.initialX,
                        y: p.initialY,
                        rotate: p.rotation,
                        scale: 0,
                        opacity: 0
                    }}
                    animate={{
                        x: p.animateX,
                        y: p.animateY,
                        rotate: p.rotation + p.rotationSpeed,
                        scale: [0, 1, 1.2, 1, 0],
                        opacity: [0, 0.9, 0.9, 0.9, 0]
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
