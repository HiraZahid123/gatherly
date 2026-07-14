"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function ForgotPasswordPage() {
    const [identifier, setIdentifier] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [resetToken, setResetToken] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ identifier }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Something went wrong");
                setIsLoading(false);
                return;
            }

            setSuccess(true);
            setResetToken(data.token); // MVP: Display token (remove in production)
        } catch (error) {
            setError("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b] px-4 relative overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-600/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="w-full max-w-md z-10 m-10">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <div className="relative w-16 h-16">
                            <Image
                                src="/logo/logo-white.svg"
                                alt="Gatherly Logo"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                        <h1 className="text-4xl font-extrabold text-white tracking-tight">Gatherly</h1>
                    </div>
                </div>

                {/* Forgot Password Card */}
                <div className="bg-[#161618] backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl p-8 sm:p-10">
                    {!success ? (
                        <>
                            <div className="mb-6 text-center">
                                <h2 className="text-2xl font-bold text-white mb-2">Forgot Password?</h2>
                                <p className="text-sm text-gray-400">
                                    Enter your email or phone number to receive a reset token.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Identifier Input */}
                                <div>
                                    <label htmlFor="identifier" className="block text-sm font-semibold text-gray-300 ml-1 mb-2">
                                        Email or Phone Number
                                    </label>
                                    <input
                                        id="identifier"
                                        type="text"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        required
                                        className="w-full bg-[#1e1e20] border border-white/10 text-white px-5 py-4 rounded-2xl focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all outline-none placeholder:text-gray-600 font-medium text-lg"
                                        placeholder="you@example.com or +123456789"
                                    />
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-2xl text-sm flex items-center gap-2">
                                        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {error}
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        {isLoading ? "Sending..." : "Send Reset Token"}
                                    </span>
                                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </button>
                            </form>

                            {/* Back to Sign In */}
                            <p className="mt-8 text-center text-sm text-gray-500">
                                Remember your password?{" "}
                                <Link href="/auth/signin" className="text-green-400 hover:text-green-300 font-semibold transition-colors">
                                    Sign in
                                </Link>
                            </p>
                        </>
                    ) : (
                        <div className="text-center">
                            {/* Success Icon */}
                            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
                            <p className="text-gray-400 mb-8">
                                We've sent a password reset token to your associated email address.
                            </p>

                            {/* MVP: Display token */}
                            {/* {resetToken && (
                                <div className="bg-[#1e1e20] border border-white/10 rounded-2xl p-6 mb-8 text-left">
                                    <p className="text-sm text-gray-400 mb-3 font-medium">Your Reset Token:</p>
                                    <code className="block w-full bg-[#161618] border border-white/5 text-green-400 px-5 py-4 rounded-xl tracking-wider text-center text-lg font-mono font-bold break-all">
                                        {resetToken}
                                    </code>
                                    <p className="text-xs text-gray-500 mt-4 text-center">Copy this token to reset your password</p>
                                </div>
                            )} */}



                            <p className="mt-6 text-sm text-gray-500">
                                Didn't receive the token?{" "}
                                <button
                                    onClick={() => {
                                        setSuccess(false);
                                        setResetToken("");
                                        setIdentifier("");
                                    }}
                                    className="text-green-400 hover:text-green-300 font-semibold transition-colors"
                                >
                                    Try again
                                </button>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
