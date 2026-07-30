"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [formData, setFormData] = useState({
        token: "",
        password: "",
        confirmPassword: "",
    });

    // Auto-fill token from URL
    useEffect(() => {
        const urlToken = searchParams.get("token");
        if (urlToken) {
            setFormData(prev => ({ ...prev, token: urlToken }));
        }
    }, [searchParams]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    token: formData.token,
                    password: formData.password,
                    confirmPassword: formData.confirmPassword,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Something went wrong");
                setIsLoading(false);
                return;
            }

            setSuccess(true);
            // Redirect to signin after 2 seconds
            setTimeout(() => {
                router.push("/auth/signin");
            }, 2000);
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
                                alt="JollyWitMe Logo"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                        <h1 className="text-4xl font-extrabold text-white tracking-tight">JollyWitMe</h1>
                    </div>
                </div>

                {/* Reset Password Card */}
                <div className="bg-[#161618] backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl p-8 sm:p-10">
                    {!success ? (
                        <>
                            <div className="mb-6 text-center">
                                <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
                                <p className="text-sm text-gray-400">
                                    Enter your reset token and choose a new password.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Token Input */}
                                <div>
                                    <label htmlFor="token" className="block text-sm font-semibold text-gray-300 ml-1 mb-2">
                                        Reset Token
                                    </label>
                                    <input
                                        id="token"
                                        name="token"
                                        type="text"
                                        value={formData.token}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-[#1e1e20] border border-white/10 text-white px-5 py-4 rounded-2xl focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all outline-none font-mono tracking-widest text-lg placeholder:text-gray-600 text-center"
                                        placeholder="Enter token"
                                    />
                                </div>

                                {/* New Password Input */}
                                <div>
                                    <label htmlFor="password" className="block text-sm font-semibold text-gray-300 ml-1 mb-2">
                                        New Password
                                    </label>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-[#1e1e20] border border-white/10 text-white px-5 py-4 rounded-2xl focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all outline-none placeholder:text-gray-600 font-medium text-lg"
                                        placeholder="••••••••"
                                    />
                                    <p className="text-[10px] text-gray-500 mt-2 ml-1 italic">Min 6 chars. Include uppercase, number & special char.</p>
                                </div>

                                {/* Confirm Password Input */}
                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-300 ml-1 mb-2">
                                        Confirm New Password
                                    </label>
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-[#1e1e20] border border-white/10 text-white px-5 py-4 rounded-2xl focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all outline-none placeholder:text-gray-600 font-medium text-lg"
                                        placeholder="••••••••"
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
                                        {isLoading ? "Resetting..." : "Reset Password"}
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

                            <h2 className="text-2xl font-bold text-white mb-2">Password Reset Successful!</h2>
                            <p className="text-gray-400 mb-8">
                                Your password has been reset successfully. You can now sign in.
                            </p>

                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 inline-flex items-center gap-3">
                                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <p className="text-sm font-semibold text-emerald-400">Redirecting to login...</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
