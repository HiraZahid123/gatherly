"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, Sparkles, PerspectiveCamera } from "@react-three/drei";
import { EffectComposer, Bloom, Noise, Vignette, TiltShift } from "@react-three/postprocessing";
import { motion, AnimatePresence } from "framer-motion";
import StreakTheme from "@/components/themes/streak";
import CrystalTheme from "@/components/themes/crystal";
import WavesTheme from "@/components/themes/waves";
import { Suspense } from "react";

interface InteractiveBackgroundProps {
    currentTheme?: string;
    currentEffect?: string;
}

export default function InteractiveBackground({ currentTheme, currentEffect }: InteractiveBackgroundProps) {
    const isStreak = currentTheme === 'streak';
    const isMeadow = currentTheme === 'meadow';
    const isCrystal = currentTheme === 'crystal';
    const isWaves = currentTheme === 'waves';
    const has3DBackground = isStreak || isMeadow || isCrystal || isWaves;

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={currentTheme ?? 'default'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: "easeInOut" }}
                className={`absolute inset-0 z-0 ${isMeadow ? 'bg-emerald-950' : 'bg-[#050510]'}`}
            >
                {/* ── Streak atmosphere ─────────────────────────────────────── */}
                {isStreak && (
                    <>
                        {/* Deep emerald-black gradient base */}
                        <div className="absolute inset-0 bg-gradient-to-b from-[#050510] via-[#080818] to-[#030308] pointer-events-none" />
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(30,60,140,0.18) 0%, transparent 70%)'
                            }}
                        />
                        <motion.div
                            className="absolute inset-0 pointer-events-none"
                            animate={{ opacity: [0.4, 0.7, 0.4] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                            style={{
                                background: 'radial-gradient(ellipse 50% 30% at 50% 50%, rgba(20,40,100,0.12) 0%, transparent 70%)'
                            }}
                        />
                    </>
                )}

                {/* ── Meadow atmosphere ─────────────────────────────────────── */}
                {isMeadow && (
                    <>
                        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950 via-emerald-900/20 to-black pointer-events-none" />
                        <motion.div
                            className="absolute inset-0 pointer-events-none"
                            animate={{ opacity: [0.2, 0.4, 0.2] }}
                            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                            style={{
                                background: 'radial-gradient(circle at 50% 50%, rgba(16,185,129,0.1) 0%, transparent 70%)'
                            }}
                        />
                    </>
                )}

                <Canvas
                    dpr={[1, 1.5]}
                    gl={{ antialias: false, stencil: false, depth: !isStreak, alpha: true }}
                    camera={{ position: [0, 0, 1], near: 0.1, far: 10 }}
                >
                    {/* ── Streak: fullscreen GLSL quad ── */}
                    {isStreak && (
                        <Suspense fallback={null}>
                            <StreakTheme />
                        </Suspense>
                    )}

                    {/* ── Crystal ── */}
                    {isCrystal && (
                        <Suspense fallback={null}>
                            <CrystalTheme />
                        </Suspense>
                    )}

                    {/* ── Waves ── */}
                    {isWaves && (
                        <Suspense fallback={null}>
                            <WavesTheme />
                        </Suspense>
                    )}

                    {/* ── Default / Meadow ── */}
                    {!isStreak && !isCrystal && !isWaves && (
                        <>
                            <PerspectiveCamera
                                makeDefault
                                position={[0, 2, 8]}
                                fov={50}
                            />

                            <ambientLight
                                intensity={0.5}
                                color="#ffffff"
                            />

                            <>
                                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
                                <Environment preset="city" />
                            </>

                            <Suspense fallback={null}>
                                <Sparkles count={200} scale={[20, 20, 20]} size={3} speed={1} opacity={0.6} color="#ffffff" />
                            </Suspense>

                            <EffectComposer multisampling={0}>
                                <Bloom
                                    luminanceThreshold={0.5}
                                    intensity={1.5}
                                    mipmapBlur
                                    radius={0.7}
                                />
                                <Noise opacity={0.05} />
                                <Vignette eskil={false} offset={0.15} darkness={1.1} />
                            </EffectComposer>
                        </>
                    )}
                </Canvas>
            </motion.div>
        </AnimatePresence>
    );
}
