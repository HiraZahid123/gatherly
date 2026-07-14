"use client";

import { useEffect, useRef } from "react";

export default function Rain() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let width = window.innerWidth;
        let height = window.innerHeight;

        canvas.width = width;
        canvas.height = height;

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        window.addEventListener("resize", resize);

        const drops: any[] = [];
        for (let i = 0; i < 200; i++) {
            drops.push({
                x: Math.random() * width,
                y: Math.random() * height,
                l: Math.random() * 20 + 10,
                ys: Math.random() * 10 + 10,
            });
        }

        const render = () => {
            ctx.clearRect(0, 0, width, height);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
            ctx.lineWidth = 1.5;
            ctx.lineCap = "round";

            for (let i = 0; i < drops.length; i++) {
                const drop = drops[i];
                ctx.beginPath();
                ctx.moveTo(drop.x, drop.y);
                ctx.lineTo(drop.x + drop.ys * 0.1, drop.y + drop.l);
                ctx.stroke();

                drop.y += drop.ys;
                drop.x += drop.ys * 0.1; // slight wind

                if (drop.y > height) {
                    drop.y = -20;
                    drop.x = Math.random() * width;
                }
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[10]"
            style={{ mixBlendMode: 'screen' }}
        />
    );
}
