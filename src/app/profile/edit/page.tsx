"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AvatarUpload from "@/components/AvatarUpload";

export default function EditProfilePage() {
    const { data: session, status, update } = useSession();
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        image: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
            return;
        }

        if (session?.user) {
            setFormData({
                name: session.user.name || "",
                phone: (session.user as any).phone || "",
                image: session.user.image || "",
            });
        }
    }, [session, status, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleImageChange = async (imageUrl: string) => {
        setFormData({
            ...formData,
            image: imageUrl,
        });
        
        // Auto-update session instantly when avatar uploads
        if (session) {
            await update({
                ...session,
                user: {
                    ...session.user,
                    image: imageUrl,
                },
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess(false);
        setIsLoading(true);

        try {
            const response = await fetch("/api/profile/update", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Something went wrong");
                setIsLoading(false);
                return;
            }

            // Update session with new data
            await update({
                ...session,
                user: {
                    ...session?.user,
                    name: data.user.name,
                    phone: data.user.phone,
                    image: data.user.image,
                },
            });

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            setError("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!session) {
        return null;
    }

    return (

        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b] px-4 relative overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-600/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="w-full max-w-2xl z-10 py-12">
                {/* Header */}
                <div className="mb-8 pl-2">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center text-gray-400 hover:text-white font-medium mb-4 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Dashboard
                    </Link>
                    <h1 className="text-4xl font-bold text-white mb-2">Edit Profile</h1>
                    <p className="text-gray-400">Update your personal information</p>
                </div>

                {/* Edit Profile Card */}
                <div className="bg-[#161618] backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl p-8 sm:p-10">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Avatar Upload */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-6 text-center">
                                Profile Picture
                            </label>
                            <div className="flex justify-center">
                                <AvatarUpload
                                    currentImage={formData.image}
                                    onImageChange={handleImageChange}
                                    isLoading={isLoading}
                                />
                            </div>
                        </div>

                        {/* Email (Read-only) */}
                        <div className="space-y-3">
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-300 ml-1">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={session.user.email || ""}
                                disabled
                                className="w-full bg-[#1e1e20] border border-white/5 text-gray-500 px-5 py-4 rounded-2xl cursor-not-allowed font-medium"
                            />
                            <p className="text-xs text-gray-600 ml-1">Email cannot be changed</p>
                        </div>

                        {/* Name Input */}
                        <div className="space-y-3">
                            <label htmlFor="name" className="block text-sm font-semibold text-gray-300 ml-1">
                                Full Name
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full bg-[#1e1e20] border border-white/10 text-white px-5 py-4 rounded-2xl focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all outline-none placeholder:text-gray-600 font-medium text-lg"
                                placeholder="John Doe"
                            />
                        </div>

                        {/* Phone Input */}
                        <div className="space-y-3">
                            <label htmlFor="phone" className="block text-sm font-semibold text-gray-300 ml-1">
                                Phone Number
                            </label>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full bg-[#1e1e20] border border-white/10 text-white px-5 py-4 rounded-2xl focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all outline-none placeholder:text-gray-600 font-medium text-lg"
                                placeholder="+1 (555) 123-4567"
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-2xl text-sm flex items-center gap-2 animate-shake">
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {error}
                            </div>
                        )}

                        {/* Success Message */}
                        {success && (
                            <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-2xl text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Profile updated successfully!
                            </div>
                        )}

                        {/* Save Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg group relative overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {isLoading ? "Saving..." : "Save Changes"}
                            </span>
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </button>
                    </form>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-shake {
                    animation: shake 0.2s ease-in-out 0s 2;
                }
            `}} />
        </div>
    );
}
