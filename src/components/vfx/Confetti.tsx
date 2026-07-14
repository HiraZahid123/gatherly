"use client";

import { useEffect, useRef } from "react";

export default function Confetti() {
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

        const colors = ["#a864fd", "#29cdff", "#78ff44", "#ff718d", "#fdff6a"];
        const particles: any[] = [];

        for (let i = 0; i < 150; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height, // Start immediately on screen
                r: Math.random() * 6 + 2,
                dx: Math.random() * 2 - 1,
                dy: Math.random() * 3 + 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                tilt: Math.floor(Math.random() * 10) - 10,
                tiltAngleIncrement: (Math.random() * 0.07) + 0.05,
                tiltAngle: 0,
            });
        }

        const render = () => {
            ctx.clearRect(0, 0, width, height);

            particles.forEach((p) => {
                p.tiltAngle += p.tiltAngleIncrement;
                p.y += (Math.cos(p.tiltAngle) + p.dy + p.r / 2) / 2;
                p.x += Math.sin(p.tiltAngle) * 2;
                p.tilt = Math.sin(p.tiltAngle) * 15;

                ctx.beginPath();
                ctx.lineWidth = p.r;
                ctx.strokeStyle = p.color;
                ctx.moveTo(p.x + p.tilt + p.r, p.y);
                ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r);
                ctx.stroke();

                if (p.y > height) {
                    p.x = Math.random() * width;
                    p.y = -20;
                    p.tilt = Math.floor(Math.random() * 10) - 10;
                }
            });

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
        />
    );
}
