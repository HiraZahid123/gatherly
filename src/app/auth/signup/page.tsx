"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useLoader } from "@/lib/contexts/LoaderContext";
import { countries } from "@/lib/countries";
import AvatarUpload from "@/components/AvatarUpload";
import { passwordSchema } from "@/lib/validation";

export default function SignUpPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
    });
    const [selectedCountry, setSelectedCountry] = useState("+92"); // Default to Pakistan
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { showLoader, hideLoader } = useLoader();

    const [avatarFile, setAvatarFile] = useState<File | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleAvatarSelect = (file: File) => {
        setAvatarFile(file);
    };

    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        const passwordValidation = passwordSchema.safeParse(formData.password);
        if (!passwordValidation.success) {
            setError(passwordValidation.error.issues[0].message);
            return;
        }

        setIsLoading(true);
        showLoader();

        try {
            const fullPhone = selectedCountry + formData.phone.replace(/\D/g, '').replace(/^0+/, '');

            const submitData = new FormData();
            submitData.append("name", formData.name);
            submitData.append("email", formData.email);
            submitData.append("phone", fullPhone);
            submitData.append("password", formData.password);

            if (avatarFile) {
                submitData.append("image", avatarFile);
            }

            // Register user
            const response = await fetch("/api/auth/register", {
                method: "POST",
                body: submitData,
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Something went wrong");
                setIsLoading(false);
                hideLoader();
                return;
            }

            // Success! Show check email message
            setIsSuccess(true);
            setIsLoading(false);
            hideLoader();

        } catch (error) {
            setError("Something went wrong");
            setIsLoading(false);
            hideLoader();
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b] px-4 py-12 relative overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-600/20 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="w-full max-w-md z-10 text-center">
                    <div className="bg-[#161618] backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl p-10 animate-in fade-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-4">Check your email</h2>
                        <p className="text-gray-400 mb-8 text-lg">
                            We've sent a verification link to <span className="text-white font-medium">{formData.email}</span>. Please verify your email to continue.
                        </p>
                        <Link
                            href="/auth/signin"
                            className="block w-full bg-white/10 text-white py-4 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all"
                        >
                            Back to Sign In
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const handleGoogleSignUp = () => {
        signIn("google", { callbackUrl: "/dashboard" });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b] px-4 pt-24 pb-12 relative overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-600/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="w-full max-w-md z-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Create your account</h1>
                    <p className="text-gray-400 mt-2 text-lg">Sign up to get started</p>
                </div>

                {/* Sign Up Card */}
                <div className="bg-[#161618] backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="flex justify-center mb-6">
                            <AvatarUpload
                                onImageChange={() => { }} // Not used in select mode
                                onFileSelect={handleAvatarSelect}
                                currentImage={null}
                            />
                        </div>

                        {/* Name Input */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                                Full Name
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full bg-[#1e1e20] border border-white/10 text-white px-5 py-3 rounded-2xl focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all outline-none placeholder:text-gray-600"
                                placeholder="John Doe"
                            />
                        </div>

                        {/* Email Input */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                Email Address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full bg-[#1e1e20] border border-white/10 text-white px-5 py-3 rounded-2xl focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all outline-none placeholder:text-gray-600"
                                placeholder="you@example.com"
                            />
                        </div>

                        {/* Phone Input */}
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                                Phone Number (WhatsApp)
                            </label>
                            <div className="flex gap-3">
                                <div className="relative w-[40%]">
                                    <select
                                        value={selectedCountry}
                                        onChange={(e) => setSelectedCountry(e.target.value)}
                                        aria-label="Select Country Code"
                                        className="w-full appearance-none bg-[#1e1e20] border border-white/10 text-white px-4 py-3 rounded-2xl focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all outline-none text-sm font-medium cursor-pointer"
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
                                    name="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                    className="flex-1 min-w-0 bg-[#1e1e20] border border-white/10 text-white px-5 py-3 rounded-2xl focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all outline-none placeholder:text-gray-600 font-mono tracking-wider"
                                    placeholder="300 1234567"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="w-full bg-[#1e1e20] border border-white/10 text-white px-5 py-3 rounded-2xl focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all outline-none placeholder:text-gray-600"
                                placeholder="Abc1@..."
                            />
                            <p className="text-[10px] text-gray-500 mt-1 italic ml-1">Min 6 chars. Include uppercase, number & special char.</p>
                        </div>

                        {/* Confirm Password Input */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                className="w-full bg-[#1e1e20] border border-white/10 text-white px-5 py-3 rounded-2xl focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all outline-none placeholder:text-gray-600"
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

                        {/* Sign Up Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                            {isLoading ? "Creating account..." : "Create Account"}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase tracking-widest">
                            <span className="px-4 bg-[#161618] text-gray-500">Or continue with</span>
                        </div>
                    </div>

                    {/* Google Sign Up */}
                    <button
                        type="button"
                        onClick={handleGoogleSignUp}
                        className="w-full flex items-center justify-center gap-3 px-4 py-4 border border-white/10 bg-white/5 rounded-2xl hover:bg-white/10 transition-all font-medium text-white"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Sign up with Google
                    </button>

                    {/* Sign In Link */}
                    <p className="mt-6 text-center text-sm text-gray-500">
                        Already have an account?{" "}
                        <Link href="/auth/signin" className="text-green-400 hover:text-green-300 font-semibold transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div >
        </div >
    );
}
