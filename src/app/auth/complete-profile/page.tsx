"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLoader } from "@/lib/contexts/LoaderContext";
import { countries } from "@/lib/countries";

export default function CompleteProfilePage() {
    const router = useRouter();
    const { data: session, update: updateSession } = useSession();
    const { showLoader, hideLoader } = useLoader();

    const [phone, setPhone] = useState("");
    const [selectedCountry, setSelectedCountry] = useState("+92");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState<"phone" | "otp">("phone");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // If session loads and user already has a phone, redirect to dashboard
    useEffect(() => {
        if (session?.user && (session.user as any).phone) {
            router.push("/dashboard");
        }
    }, [session, router]);

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        showLoader();

        try {
            const fullPhone = selectedCountry + phone.replace(/\D/g, '').replace(/^0+/, '');

            const res = await fetch("/api/auth/otp/send-verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: fullPhone }),
            });

            const data = await res.json();

            if (res.ok) {
                setStep("otp");
                setOtp("");
            } else {
                setError(data.error || "Failed to send code");
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
            hideLoader();
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        showLoader();

        try {
            const fullPhone = selectedCountry + phone.replace(/\D/g, '').replace(/^0+/, '');

            const res = await fetch("/api/auth/complete-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: fullPhone, otp: otp.trim() }),
            });

            const data = await res.json();

            if (res.ok) {
                // Update the local session to include the new phone
                await updateSession({
                    ...session,
                    user: {
                        ...session?.user,
                        phone: fullPhone
                    }
                });

                router.push("/dashboard");
                router.refresh();
            } else {
                setError(data.error || "Verification failed");
            }
        } catch (error) {
            setError("Something went wrong");
        } finally {
            setIsLoading(false);
            hideLoader();
        }
    };

    if (!session?.user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b] px-4 relative overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-600/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="w-full max-w-md z-10 m-10">
                <div className="text-center mb-10">
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <Link href="/" className="flex items-center">
                            <Image
                                src="/logo/favicon.svg"
                                alt="JollyWitMe"
                                width={48}
                                height={48}
                                className="w-12 h-12 rounded-xl"
                            />
                        </Link>
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight">
                        Complete Your Profile
                    </h1>
                    <p className="text-gray-400 mt-2 text-sm">
                        Please add your phone number to continue
                    </p>
                </div>

                <div className="bg-[#141416]/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
                    {step === "phone" ? (
                        <form onSubmit={handleSendOTP} className="space-y-6">
                            <div className="space-y-2">
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-300">
                                    Phone Number
                                </label>
                                <div className="flex gap-2">
                                    <select
                                        value={selectedCountry}
                                        onChange={(e) => setSelectedCountry(e.target.value)}
                                        className="bg-[#1e1e20] border border-white/10 text-white px-3 py-4 rounded-2xl focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none w-[110px] text-sm"
                                    >
                                        {countries.map((c) => (
                                            <option key={`${c.code}-${c.dial}`} value={c.dial} className="bg-[#1e1e20]">
                                                {c.code} ({c.dial})
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        id="phone"
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        required
                                        className="flex-1 bg-[#1e1e20] border border-white/10 text-white px-5 py-4 rounded-2xl focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none text-base"
                                        placeholder="300 1234567"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-2xl text-sm flex items-center gap-2">
                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                {isLoading ? "Sending Code..." : "Get Verification Code"}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOTP} className="space-y-8">
                            <div className="space-y-3 text-center">
                                <label htmlFor="otp" className="block text-sm font-semibold text-gray-300">
                                    6-Digit Verification Code
                                </label>
                                <input
                                    id="otp"
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                    maxLength={6}
                                    className="w-full bg-[#1e1e20] border border-white/10 text-white px-5 py-5 rounded-2xl tracking-[0.8em] text-center text-3xl font-bold focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                                    placeholder="000000"
                                />
                                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mt-3 text-left">
                                    <p className="text-xs text-emerald-400 font-semibold">📧 Code sent to:</p>
                                    <p className="text-white text-sm font-medium mt-0.5">{session?.user?.email || "your registered email"}</p>
                                    <p className="text-xs text-gray-400 mt-1">Please check your inbox (and spam folder) for the 6-digit code.</p>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-2xl text-sm flex items-center gap-2">
                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {error}
                                </div>
                            )}

                            <div className="flex flex-col gap-3">
                                <button
                                    type="submit"
                                    disabled={isLoading || otp.length < 6}
                                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] disabled:opacity-50 transition-all active:scale-[0.98]"
                                >
                                    {isLoading ? "Verifying..." : "Verify & Complete"}
                                </button>
                                
                                <div className="flex justify-between items-center px-1 pt-1">
                                    <button
                                        type="button"
                                        onClick={handleSendOTP}
                                        disabled={isLoading}
                                        className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                                    >
                                        Resend Code
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStep("phone")}
                                        className="text-xs text-gray-400 hover:text-gray-300 font-medium transition-colors"
                                    >
                                        Change Phone Number
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
