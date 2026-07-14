"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Shield, Loader2, Lock } from "lucide-react";

export default function AdminLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Invalid credentials");
            } else {
                router.push("/admin");
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-sans">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/5 border border-white/10 mb-2">
                        <Shield className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tighter text-white uppercase">
                        Admin Terminal
                    </h1>
                    <p className="text-white/40 text-sm font-bold uppercase tracking-widest">
                        High security zone
                    </p>
                </div>

                <div className="bg-[#0a0a0b] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 px-1">Clearance Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 outline-none focus:bg-white/10 focus:border-white/20 text-white font-medium transition-all"
                                placeholder="name@gatherly.admin"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 px-1">Access Key</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 outline-none focus:bg-white/10 focus:border-white/20 text-white font-medium transition-all"
                                    placeholder="••••••••"
                                />
                                <Lock className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                            </div>
                        </div>

                        {error && (
                            <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-neutral-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>Initiate Session</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-[10px] font-black uppercase tracking-widest text-white/10">
                    Proprietary System &copy; Gatherly Ops
                </p>
            </div>
        </div>
    );
}
