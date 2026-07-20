"use client";

import React, { useState } from 'react';
import VfxCanvas from '@/components/vfx/VfxCanvas';
import { Sparkles, Cloud, Trash2, Home } from 'lucide-react';
import Link from 'next/link';

export default function VfxTestPage() {
    const [effect, setEffect] = useState<'bubbles' | 'confetti' | 'floral'>('bubbles');
    const [count, setCount] = useState(25);
    const [color, setColor] = useState('#ffffff');
    const [useClones, setUseClones] = useState(false);

    // Sample image for cloning demo
    const cloneUrl = "/partiful/cutie-pie-blue.avif";

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans overflow-hidden">
            {/* Background VFX */}
            <VfxCanvas
                type={effect}
                count={count}
                color={color}
                imageUrl={useClones ? cloneUrl : undefined}
                speed={0.6}
            />

            <div className="relative z-10 p-10 max-w-2xl">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/30">
                        <Sparkles className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">VFX Engine Lab</h1>
                        <p className="text-white/40 text-sm">Testing scalable motion architectures</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl">
                    <div className="space-y-6">
                        <div>
                            <label className="text-xs font-black uppercase tracking-widest text-white/30 block mb-3">Motion Strategy</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setEffect('bubbles')}
                                    className={`flex-1 py-3 rounded-xl border transition-all flex flex-col items-center gap-1 ${effect === 'bubbles' ? 'bg-emerald-600 border-emerald-400' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                >
                                    <Cloud className="w-4 h-4" />
                                    <span className="text-[10px] font-bold">Floating</span>
                                </button>
                                <button
                                    onClick={() => setEffect('confetti')}
                                    className={`flex-1 py-3 rounded-xl border transition-all flex flex-col items-center gap-1 ${effect === 'confetti' ? 'bg-emerald-600 border-emerald-400' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                >
                                    <Trash2 className="w-4 h-4 rotate-180" />
                                    <span className="text-[10px] font-bold">Falling</span>
                                </button>
                                <button
                                    onClick={() => { setEffect('floral'); setCount(5); setColor('#ffffff'); }}
                                    className={`flex-1 py-3 rounded-xl border transition-all flex flex-col items-center gap-1 ${effect === 'floral' ? 'bg-emerald-600 border-emerald-400' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                >
                                    <Sparkles className="w-4 h-4 text-white" />
                                    <span className="text-[10px] font-bold text-white">Floral</span>
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-black uppercase tracking-widest text-white/30 block mb-3">Density: {count}</label>
                            <input
                                type="range" min="1" max="200" step="1"
                                value={count}
                                onChange={(e) => setCount(parseInt(e.target.value))}
                                className="w-full h-1.5 bg-white/10 rounded-full appearance-none accent-emerald-500 cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="space-y-6 border-l border-white/10 pl-6">
                        <div>
                            <label className="text-xs font-black uppercase tracking-widest text-white/30 block mb-3">Asset Type</label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-12 h-6 rounded-full transition-all relative ${useClones ? 'bg-green-500' : 'bg-white/10'}`}>
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${useClones ? 'left-7' : 'left-1'}`} />
                                </div>
                                <input type="checkbox" className="hidden" checked={useClones} onChange={() => setUseClones(!useClones)} />
                                <span className="text-sm font-bold text-white/70 group-hover:text-white transition-colors">
                                    {useClones ? "Image Clones" : "Vector Circles"}
                                </span>
                            </label>
                        </div>

                        <div>
                            <label className="text-xs font-black uppercase tracking-widest text-white/30 block mb-3">Base Color</label>
                            <div className="flex gap-2">
                                {['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ffffff'].map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setColor(c)}
                                        className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-white scale-125' : 'border-transparent shadow-lg'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <Link
                    href="/dashboard"
                    className="mt-8 inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm font-medium"
                >
                    <Home className="w-4 h-4" />
                    Back to Platform
                </Link>
            </div>
        </div>
    );
}
