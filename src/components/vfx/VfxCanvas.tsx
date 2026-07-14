"use client";

import React, { useEffect, useRef, useState } from 'react';
import { MotionEngine } from '@/lib/vfx/MotionEngine';
import { RandomFloatStrategy } from '@/lib/vfx/strategies/RandomFloatStrategy';
import { GravityFallStrategy } from '@/lib/vfx/strategies/GravityFallStrategy';
import { FloralEmergenceStrategy } from '@/lib/vfx/strategies/FloralEmergenceStrategy';
import { Agent, MotionStrategy } from '@/lib/vfx/types';

interface VfxCanvasProps {
    type: 'bubbles' | 'confetti' | 'clones' | 'floral';
    count?: number;
    color?: string;
    imageUrl?: string | string[];
    className?: string;
    speed?: number;
}

export default function VfxCanvas({
    type,
    count = 20,
    color = '#ffffff',
    imageUrl,
    className = '',
    speed = 1
}: VfxCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<MotionEngine | null>(null);
    const requestRef = useRef<number | undefined>(undefined);
    const lastTimeRef = useRef<number>(0);
    const imageAssetsRef = useRef<(HTMLImageElement | HTMLCanvasElement)[]>([]);
    const [isAssetsLoaded, setIsAssetsLoaded] = useState(false);

    // Local Illustrated Assets for Floral (Exclusive White Lotus)
    const FLORAL_ASSETS = [
        "/assets/vfx/floral/-a-symmetrical--minimalist-white-lotus-flower-illu.png",
    ];

    // Initialize Engine and Images
    useEffect(() => {
        engineRef.current = new MotionEngine(Math.max(count, 100));

        const urls = type === 'floral' ? FLORAL_ASSETS : (Array.isArray(imageUrl) ? imageUrl : (imageUrl ? [imageUrl] : []));

        if (urls.length > 0) {
            let loaded = 0;
            imageAssetsRef.current = [];
            urls.forEach(url => {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.src = url;
                img.onload = () => {
                    imageAssetsRef.current.push(img);
                    loaded++;
                    if (loaded === urls.length) setIsAssetsLoaded(true);
                };
            });
        } else {
            setIsAssetsLoaded(true);
        }

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [imageUrl, count, type]);

    // Handle Animation and Spawning
    useEffect(() => {
        if (!isAssetsLoaded || !engineRef.current) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Resize handler with DPI scaling
        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            ctx.scale(dpr, dpr);
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;
        };

        window.addEventListener('resize', resize);
        resize();

        // Strategy selection
        let strategy: MotionStrategy;
        if (type === 'confetti') {
            strategy = new GravityFallStrategy(2 * speed, 5, 0.002);
        } else if (type === 'floral') {
            strategy = new FloralEmergenceStrategy(0.002 * speed, 0.0005 * speed);
        } else {
            strategy = new RandomFloatStrategy(0.02 * speed, 20);
        }

        // Helper to draw an elegant flower (Procedural fallback)
        const drawElegantFlower = (ctx: CanvasRenderingContext2D, size: number, color: string) => {
            const petals = 5;
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(0,0,0,0.1)';

            for (let layer = 0; layer < 2; layer++) {
                const layerSize = size * (1 - layer * 0.3);
                for (let i = 0; i < petals; i++) {
                    ctx.save();
                    ctx.rotate((Math.PI * 2 / petals) * i);
                    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, layerSize);
                    grad.addColorStop(0, '#ffffff');
                    grad.addColorStop(1, color);
                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.bezierCurveTo(layerSize / 1.5, -layerSize, layerSize, -layerSize / 1.5, 0, 0);
                    ctx.fill();
                    ctx.restore();
                }
            }
        };

        // Initial Spawn
        engineRef.current.clear();

        // Specialized Spawning logic for Cinematic Branches (Minimalist: Few Flowers)
        const spawnBranch = () => {
            const side = Math.random() > 0.5 ? 1 : -1;
            const startX = side === 1 ? -150 : window.innerWidth + 150;
            const startY = window.innerHeight * 0.1 + Math.random() * window.innerHeight * 0.7;

            const branchSeed = Math.random() * 1000;
            const flowerCount = 2 + Math.floor(Math.random() * 2); // Only 2-3 flowers per branch for a premium feel

            for (let i = 0; i < flowerCount; i++) {
                const offset = i * 110; // Spaced out more
                const x = startX + (side * offset) + (Math.random() - 0.5) * 60;
                const y = startY + (offset * 0.25) + (Math.random() - 0.5) * 60;

                const randImg = imageAssetsRef.current[Math.floor(Math.random() * imageAssetsRef.current.length)];

                engineRef.current?.spawn({
                    x, y,
                    scale: 0,
                    opacity: 0,
                    color: color,
                    image: (type === 'floral' || (imageUrl && imageAssetsRef.current.length > 0)) ? randImg : undefined,
                    lifetime: 18000 + Math.random() * 8000,
                    seed: branchSeed
                });
            }
        };

        const spawnAgent = (initial: boolean = false) => {
            if (type === 'floral') {
                spawnBranch();
                return;
            }

            const edge = Math.floor(Math.random() * 4);
            let x = 0, y = 0;

            if (edge === 0) { x = Math.random() * window.innerWidth; y = -150; }
            else if (edge === 1) { x = window.innerWidth + 150; y = Math.random() * window.innerHeight; }
            else if (edge === 2) { x = Math.random() * window.innerWidth; y = window.innerHeight + 150; }
            else { x = -150; y = Math.random() * window.innerHeight; }

            const randImg = imageAssetsRef.current[Math.floor(Math.random() * imageAssetsRef.current.length)];

            engineRef.current?.spawn({
                x, y,
                scale: 0.5 + Math.random() * 0.5,
                opacity: 0.4 + Math.random() * 0.6,
                color: color,
                image: (imageUrl && imageAssetsRef.current.length > 0) ? randImg : undefined,
                lifetime: Infinity
            });
        };

        for (let i = 0; i < (type === 'floral' ? 1 : count); i++) {
            if (type === 'floral') {
                spawnBranch();
            } else {
                spawnAgent(true);
            }
        }

        // Floral continuous spawning
        let spawnInterval: any;
        if (type === 'floral') {
            spawnInterval = setInterval(() => {
                if (engineRef.current && engineRef.current.getActiveAgents().length < 6) {
                    spawnBranch();
                }
            }, 8000);
        }

        const animate = (time: number) => {
            const deltaTime = time - lastTimeRef.current;
            lastTimeRef.current = time;

            // Clear canvas for transparency (Supports any theme underneath)
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

            // Update Engine
            if (engineRef.current) {
                const bounds = { width: window.innerWidth, height: window.innerHeight };
                engineRef.current.update(deltaTime || 16.6, bounds, strategy);

                // Batch Draw
                const agents = engineRef.current.getActiveAgents();
                for (const agent of agents) {
                    ctx.save();

                    // Shared Branch Sway
                    const t = time / 1000;
                    const sway = type === 'floral' ? Math.sin(t * 0.4 + agent.seed) * 20 : 0;

                    // Cinematic DOF Blur
                    if (type === 'floral') {
                        const blur = Math.max(0, (1.1 - agent.scale) * 6);
                        if (blur > 0.5) ctx.filter = `blur(${blur}px)`;
                    }

                    ctx.globalAlpha = agent.opacity;
                    ctx.translate(agent.x + sway, agent.y + (sway * 0.15));
                    ctx.rotate(agent.rotation + (sway * 0.002));

                    const size = (type === 'floral' ? 160 : 20) * agent.scale;

                    // Soft Directional Shadow for 3D depth
                    ctx.shadowColor = 'rgba(0,0,0,0.08)'; // Subtle for ANY theme
                    ctx.shadowBlur = 30 * agent.scale;
                    ctx.shadowOffsetX = 10 * agent.scale;
                    ctx.shadowOffsetY = 15 * agent.scale;

                    if (agent.image) {
                        ctx.drawImage(agent.image, -size, -size, size * 2, size * 2);
                    } else if (type === 'floral') {
                        drawElegantFlower(ctx, size, agent.color || '#fff');
                    } else {
                        ctx.beginPath();
                        ctx.arc(0, 0, size, 0, Math.PI * 2);
                        ctx.fillStyle = agent.color || '#fff';
                        ctx.fill();
                    }
                    ctx.restore();
                    ctx.filter = 'none';
                }
            }

            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', resize);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (spawnInterval) clearInterval(spawnInterval);
        };
    }, [type, count, color, isAssetsLoaded, speed, imageUrl]);

    return (
        <canvas
            ref={canvasRef}
            className={`pointer-events-none fixed inset-0 z-[80] ${className}`}
        />
    );
}
