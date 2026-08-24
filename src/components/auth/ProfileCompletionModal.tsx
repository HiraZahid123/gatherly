
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { passwordSchema } from "@/lib/validation";

export default function ProfileCompletionModal() {
    const { data: session, update } = useSession();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (session?.user) {
            // Check if critical info is missing
            const missingEmail = !session.user.email;
            const missingPhone = !session.user.phone || session.user.phone === "undefined";
            const missingPassword = !(session.user as any).hasPassword;

            if (missingEmail || missingPhone || missingPassword) {
                setIsOpen(true);
            }
        }
    }, [session]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const body: any = {};
            if (!session?.user.email && email) body.email = email;
            if ((!session?.user.phone || session.user.phone === "undefined") && phone) body.phone = phone;
            if (!(session?.user as any).hasPassword && password) {
                const validation = passwordSchema.safeParse(password);
                if (!validation.success) {
                    throw new Error(validation.error.issues[0].message);
                }
                body.password = password;
            }

            const res = await fetch("/api/user/update-profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update profile");
            }

            // Success - update session and close
            await update();
            setIsOpen(false);
            router.refresh();
            window.location.reload();

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const missingEmail = !session?.user.email;
    const missingPhone = !session?.user.phone || session?.user.phone === "undefined";
    const missingPassword = !(session?.user as any).hasPassword;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#161618] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden">
                <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-white mb-2">Complete Your Profile</h2>
                    <p className="text-gray-400 text-sm">
                        To ensure you receive all event updates, we need a bit more info.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {missingEmail && (
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[#1e1e20] border border-white/10 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-green-500/50 outline-none"
                                placeholder="name@example.com"
                                required
                            />
                        </div>
                    )}

                    {missingPhone && (
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Phone Number (WhatsApp)</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full bg-[#1e1e20] border border-white/10 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-green-500/50 outline-none"
                                placeholder="+234 802 345 6789"
                                required
                            />
                        </div>
                    )}

                    {missingPassword && (
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Secure Your Account (Create Password)</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[#1e1e20] border border-white/10 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-green-500/50 outline-none"
                                placeholder="Min 6 characters (Abc1@)"
                                required
                                minLength={6}
                            />
                            <p className="text-[10px] text-gray-500 mt-1 italic">Include uppercase, number & special character.</p>
                        </div>
                    )}

                    {error && (
                        <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all disabled:opacity-50"
                    >
                        {isLoading ? "Saving..." : "Save & Continue"}
                    </button>

                    {/* Optional: Allow skip? User said "refine it", usually implies enforcement. 
                        But legal/UX wise, skip might be needed. For now, strict as per implied request. 
                    */}
                </form>
            </div>
        </div>
    );
}
