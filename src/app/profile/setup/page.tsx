"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AvatarUpload from "@/components/AvatarUpload";

export default function ProfileSetupPage() {
    const { data: session, update } = useSession();
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        image: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (session?.user) {
            setFormData({
                name: session.user.name || "",
                phone: (session.user as any).phone || "",
                image: session.user.image || "",
            });
        }
    }, [session]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleImageChange = (imageUrl: string) => {
        setFormData({
            ...formData,
            image: imageUrl,
        });
    };

    const handleSkip = () => {
        router.push("/dashboard");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
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

            // Redirect to dashboard
            router.push("/dashboard");
            router.refresh();
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
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                        Complete Your Profile
                    </h1>
                    <p className="text-gray-600">
                        Add your details to personalize your experience
                    </p>
                </div>

                {/* Profile Setup Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Avatar Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                                Profile Picture
                            </label>
                            <AvatarUpload
                                currentImage={formData.image}
                                onImageChange={handleImageChange}
                                isLoading={isLoading}
                            />
                        </div>

                        {/* Name Input */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                Full Name
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none placeholder:text-gray-400"
                                placeholder="John Doe"
                            />
                        </div>

                        {/* Phone Input */}
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                                Phone Number (Optional)
                            </label>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none placeholder:text-gray-400"
                                placeholder="+1 (555) 123-4567"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                We'll use this to send you event updates
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="flex gap-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                            >
                                {isLoading ? "Saving..." : "Save Profile"}
                            </button>
                            <button
                                type="button"
                                onClick={handleSkip}
                                disabled={isLoading}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Skip for Now
                            </button>
                        </div>
                    </form>

                    {/* Info Box */}
                    <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                        <p className="text-sm text-emerald-800">
                            <strong>💡 Tip:</strong> Complete your profile to make your events more personal and trustworthy!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
