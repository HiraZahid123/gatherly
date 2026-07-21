"use client";

import { useEffect, useRef, memo } from "react";

interface BackgroundVideoProps {
    src: string;
    className?: string;
}

export const BackgroundVideo = memo(function BackgroundVideo({ src, className }: BackgroundVideoProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current) {
            // Ensure it plays even if React re-renders
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch((error) => {
                    console.warn("Background video autoplay failed:", error);
                });
            }
        }
    }, [src]);

    return (
        <video 
            ref={videoRef}
            src={src} 
            autoPlay 
            loop 
            muted 
            playsInline 
            className={className || "absolute inset-0 w-full h-full object-cover opacity-80"}
        />
    );
});
