"use client";

import { useLoader } from "@/lib/contexts/LoaderContext";
import Image from "next/image";
import { useEffect, useState } from "react";

const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    angle: (i / 12) * 360,
    size: i % 3 === 0 ? 5 : i % 3 === 1 ? 3.5 : 2,
    delay: i * 0.12,
    radius: i % 2 === 0 ? 90 : 78,
    opacity: i % 3 === 0 ? 0.9 : i % 3 === 1 ? 0.6 : 0.4,
}));

export default function Loader() {
    const { isLoading } = useLoader();
    const [visible, setVisible] = useState(false);
    const [exiting, setExiting] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (isLoading) {
            setExiting(false);
            setProgress(0);
            setVisible(true);

            // Simulate indeterminate progress
            let p = 0;
            const tick = setInterval(() => {
                p += Math.random() * 12;
                if (p >= 88) {
                    clearInterval(tick);
                    p = 88;
                }
                setProgress(Math.min(p, 88));
            }, 180);

            return () => clearInterval(tick);
        } else {
            // Complete the bar then exit
            setProgress(100);
            const finishTimeout = setTimeout(() => {
                setExiting(true);
            }, 350);
            const hideTimeout = setTimeout(() => {
                setVisible(false);
                setExiting(false);
            }, 850);
            return () => {
                clearTimeout(finishTimeout);
                clearTimeout(hideTimeout);
            };
        }
    }, [isLoading]);

    if (!visible) return null;

    return (
        <div
            className="jollywitme-loader-root"
            style={{ opacity: exiting ? 0 : 1 }}
            aria-label="Loading JollyWitMe"
            role="status"
        >
            {/* Ambient background blobs */}
            <div className="jollywitme-blob jollywitme-blob-1" />
            <div className="jollywitme-blob jollywitme-blob-2" />
            <div className="jollywitme-blob jollywitme-blob-3" />

            {/* Central card */}
            <div className="jollywitme-card" style={{ opacity: exiting ? 0 : 1, transform: exiting ? "scale(0.94) translateY(12px)" : "scale(1) translateY(0)" }}>

                {/* Spinning ring */}
                <div className="jollywitme-ring-wrap">
                    <div className="jollywitme-ring" />
                    <div className="jollywitme-ring-inner" />

                    {/* Orbiting particles */}
                    {PARTICLES.map(p => (
                        <span
                            key={p.id}
                            className="jollywitme-particle"
                            style={{
                                width: p.size,
                                height: p.size,
                                opacity: p.opacity,
                                animationDelay: `${p.delay}s`,
                                "--orbit-r": `${p.radius}px`,
                                "--start-angle": `${p.angle}deg`,
                            } as React.CSSProperties}
                        />
                    ))}

                    {/* Logo */}
                    <div className="jollywitme-logo-container">
                        <div className="jollywitme-logo-glow" />
                        <div className="jollywitme-logo-img-wrap rounded-full overflow-hidden">
                            <Image
                                src="/logo/apple-touch-icon.png"
                                alt="JollyWitMe"
                                fill
                                className="object-cover rounded-full"
                                priority
                            />
                        </div>
                    </div>
                </div>

                {/* Brand name */}
                <div className="jollywitme-name-wrap">
                    {"JollyWitMe".split("").map((char, i) => (
                        <span
                            key={i}
                            className="jollywitme-char"
                            style={{ animationDelay: `${i * 0.07}s` }}
                        >
                            {char}
                        </span>
                    ))}
                </div>

                {/* Tagline */}
                <p className="jollywitme-tagline">Creating moments that matter</p>

                {/* Dots */}
                <div className="jollywitme-dots">
                    {[0, 1, 2, 3, 4].map(i => (
                        <div
                            key={i}
                            className="jollywitme-dot"
                            style={{ animationDelay: `${i * 0.15}s` }}
                        />
                    ))}
                </div>
            </div>

            {/* Progress bar */}
            <div className="jollywitme-progress-wrap">
                <div
                    className="jollywitme-progress-bar"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}
