"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useLoader } from "@/lib/contexts/LoaderContext";
import { countries } from "@/lib/countries";
import { Eye, EyeOff } from "lucide-react";

import { Suspense } from "react";

function SignInContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isVerified = searchParams.get("verified") === "true";

    // Common State
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const { showLoader, hideLoader } = useLoader();
    const [signInMethod, setSignInMethod] = useState<"phone" | "email">("email");

    // Phone Auth State
    const [phone, setPhone] = useState("");
    const [selectedCountry, setSelectedCountry] = useState("+92");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState<"phone" | "otp">("phone");
    const [mockCode, setMockCode] = useState(""); // For testing mode

    // Email Auth State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        showLoader();

        try {
            const fullPhone = selectedCountry + phone.replace(/\D/g, '').replace(/^0+/, '');

            const res = await fetch("/api/auth/otp/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: fullPhone }),
            });

            const data = await res.json();

            if (res.ok) {
                setStep("otp");
                if (data.debug) {
                    setMockCode(data.debug);
                }
            } else {
                setError(data.error || "Failed to send code");
            }
        } catch (err) {
            console.error("Fetch Error:", err);
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

            const result = await signIn("phone-otp", {
                phone: fullPhone,
                otp,
                redirect: false,
            });

            if (result?.error) {
                if (result.error === "VerificationNotPossible") {
                    setError("Verification failed. Please request a new code.");
                } else if (result.error === "CodeExpired") {
                    setError("The verification code has expired. Please request a new one.");
                } else if (result.error === "InvalidCode") {
                    setError("The verification code you entered is incorrect.");
                } else if (result.error === "ProfileIncomplete") {
                    setError("Profile incomplete. Please register again.");
                } else {
                    setError(result.error);
                }
            } else {
                const searchParams = new URLSearchParams(window.location.search);
                const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
                router.push(callbackUrl);
                router.refresh();
            }
        } catch (error) {
            setError("Verification failed");
        } finally {
            setIsLoading(false);
            hideLoader();
        }
    };

    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        showLoader();

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                if (result.error === "CredentialsSignin" || result.error === "InvalidPassword") {
                    setError("Invalid email or password");
                } else if (result.error === "UserNotFound") {
                    setError("No account found with this email address");
                } else if (result.error === "PasswordNotSet") {
                    setError("This account doesn't have a password. Please sign in with Google or use WhatsApp.");
                } else if (result.error === "Configuration") {
                    setError("Invalid email or password");
                } else {
                    setError(result.error);
                }
            } else {
                const searchParams = new URLSearchParams(window.location.search);
                const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
                router.push(callbackUrl);
                router.refresh();
            }
        } catch (error) {
            setError("Sign in failed");
        } finally {
            setIsLoading(false);
            hideLoader();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b] px-4 pt-24 pb-12 relative overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-600/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="w-full max-w-md z-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Welcome back</h1>
                    <p className="text-gray-400 mt-2">Sign in to your account</p>
                </div>

                {/* Verification Success Message */}
                {isVerified && (
                    <div className="mb-8 bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-white font-bold">Email Verified!</h3>
                            <p className="text-green-200/80 text-sm">Your account has been successfully verified. Please sign in.</p>
                        </div>
                    </div>
                )}

                {/* Sign In Card */}
                <div className="bg-[#161618] backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl p-8 sm:p-10">

                    {/* Method Toggle (Commented out for now to only show Email)
                    <div className="flex bg-[#1e1e20] p-1 rounded-xl mb-8">
                        <button
                            onClick={() => setSignInMethod("phone")}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${signInMethod === "phone"
                                ? "bg-[#2d2d30] text-white shadow-sm"
                                : "text-gray-400 hover:text-gray-200"
                                }`}
                        >
                            WhatsApp / Phone
                        </button>
                        <button
                            onClick={() => setSignInMethod("email")}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${signInMethod === "email"
                                ? "bg-[#2d2d30] text-white shadow-sm"
                                : "text-gray-400 hover:text-gray-200"
                                }`}
                        >
                            Email / Password
                        </button>
                    </div>
                    */}

                    {signInMethod === "phone" ? (
                        step === "phone" ? (
                            <form onSubmit={handleSendOTP} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-3">
                                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-300 ml-1">
                                        WhatsApp Number
                                    </label>
                                    <div className="flex gap-3">
                                        <div className="relative w-[40%]">
                                            <select
                                                value={selectedCountry}
                                                onChange={(e) => setSelectedCountry(e.target.value)}
                                                aria-label="Select Country Code"
                                                className="w-full appearance-none bg-[#1e1e20] border border-white/10 text-white px-4 py-4 rounded-2xl focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all outline-none text-sm font-medium cursor-pointer"
                                            >
                                                {countries.map((c) => (
                                                    <option key={`${c.code}-${c.dial}`} value={c.dial} className="bg-[#161618]">
                                                        {c.code} {c.dial}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                        <input
                                            id="phone"
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            required
                                            className="flex-1 bg-[#1e1e20] border border-white/10 text-white px-5 py-4 rounded-2xl focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all outline-none placeholder:text-gray-600 font-mono tracking-wider text-lg"
                                            placeholder="300 1234567"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 ml-1">Select country and enter digits (e.g., 300xxxxxxx)</p>
                                </div>

                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-2xl text-sm flex items-center gap-2 animate-shake">
                                        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        {isLoading ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Sending...
                                            </>
                                        ) : (
                                            "Get Verification Code"
                                        )}
                                    </span>
                                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyOTP} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-3 text-center">
                                    <label htmlFor="otp" className="block text-sm font-semibold text-gray-300">
                                        6-Digit Code
                                    </label>
                                    <input
                                        id="otp"
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        required
                                        maxLength={6}
                                        className="w-full bg-[#1e1e20] border border-white/10 text-white px-5 py-5 rounded-2xl tracking-[0.8em] text-center text-3xl font-bold focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all outline-none placeholder:text-gray-800"
                                        placeholder="000000"
                                    />
                                    <p className="text-xs text-gray-500">Sent to your WhatsApp</p>
                                    {mockCode && (
                                        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl animate-in fade-in zoom-in duration-300">
                                            <p className="text-xs font-bold text-green-400 uppercase tracking-widest mb-1">Testing Mode</p>
                                            <p className="text-white text-sm">Enter code: <span className="text-xl font-mono font-black text-green-400 ml-1">{mockCode}</span></p>
                                        </div>
                                    )}
                                </div>

                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-2xl text-sm flex items-center gap-2 animate-shake">
                                        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {error}
                                    </div>
                                )}

                                <div className="flex flex-col gap-4">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? "Verifying..." : "Verify & Sign In"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStep("phone")}
                                        className="text-sm text-gray-400 hover:text-green-400 font-medium transition-colors py-2"
                                    >
                                        Back to Login
                                    </button>
                                </div>
                            </form>
                        )
                    ) : (
                        <form onSubmit={handleEmailSignIn} className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                            <div className="space-y-3">
                                <label htmlFor="email" className="block text-sm font-semibold text-gray-300 ml-1">
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full bg-[#1e1e20] border border-white/10 text-white px-5 py-4 rounded-2xl focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all outline-none placeholder:text-gray-600 font-medium text-lg"
                                    placeholder="you@example.com"
                                />
                            </div>

                            <div className="space-y-3">
                                <label htmlFor="password" className="block text-sm font-semibold text-gray-300 ml-1">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full bg-[#1e1e20] border border-white/10 text-white pl-5 pr-12 py-4 rounded-2xl focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all outline-none placeholder:text-gray-600 font-medium text-lg"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors focus:outline-none"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                <div className="flex justify-end">
                                    <Link
                                        href="/auth/forgot-password"
                                        className="text-sm font-semibold text-green-400 hover:text-green-300 transition-colors"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-2xl text-sm flex items-center gap-2 animate-shake">
                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    {isLoading ? "Signing in..." : "Sign In"}
                                </span>
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </button>
                        </form>
                    )}

                    {/* Social Divider */}
                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/5"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase tracking-widest">
                            <span className="bg-[#161618] px-4 text-gray-500 font-bold">Or continue with</span>
                        </div>
                    </div>

                    {/* Google Login Button */}
                    <div className="space-y-3">
                        {/* Google Login Button */}
                        <button
                            type="button"
                            onClick={() => {
                                showLoader();
                                signIn("google", { callbackUrl: "/dashboard" });
                            }}
                            className="w-full bg-white text-black py-3.5 rounded-2xl font-bold text-base flex items-center justify-center gap-3 hover:bg-gray-100 transition-all active:scale-[0.98]"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Continue with Google
                        </button>

                        {/* Facebook Login Button */}
                        <button
                            type="button"
                            onClick={() => {
                                showLoader();
                                signIn("facebook", { callbackUrl: "/dashboard" });
                            }}
                            className="w-full bg-[#1877F2] text-white py-3.5 rounded-2xl font-bold text-base flex items-center justify-center gap-3 hover:bg-[#166fe5] transition-all active:scale-[0.98]"
                        >
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                            Continue with Facebook
                        </button>

                        {/* Instagram Login Button */}
                        <button
                            type="button"
                            onClick={() => {
                                showLoader();
                                signIn("facebook", { callbackUrl: "/dashboard" });
                            }}
                            className="w-full bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white py-3.5 rounded-2xl font-bold text-base flex items-center justify-center gap-3 hover:opacity-90 transition-all active:scale-[0.98]"
                        >
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                            Continue with Instagram
                        </button>
                    </div>

                    <div className="mt-6 text-center">
                        <p className="mt-4 text-gray-500 text-sm">
                            Don't have an account?{" "}
                            <Link href="/auth/signup" className="text-green-400 hover:text-green-300 font-semibold transition-colors">
                                Sign up
                            </Link>
                        </p>
                    </div>


                    {/* Security Note */}
                    <div className="mt-10 pt-8 border-t border-white/5 flex flex-col items-center gap-3">
                        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            End-to-End Encrypted Login
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes gradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .animate-gradient {
                    animation: gradient 8s ease infinite;
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-shake {
                    animation: shake 0.2s ease-in-out 0s 2;
                }
            `}} />
        </div >
    );
}

export default function SignInPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
        }>
            <SignInContent />
        </Suspense>
    );
}
