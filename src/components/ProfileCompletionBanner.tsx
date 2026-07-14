"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ProfileCompletionBannerProps {
    user: {
        name?: string | null;
        phone?: string | null;
        image?: string | null;
    };
}

export default function ProfileCompletionBanner({ user }: ProfileCompletionBannerProps) {
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        // Check if banner was previously dismissed
        const dismissed = localStorage.getItem("profileBannerDismissed");
        if (dismissed === "true") {
            setIsDismissed(true);
        }
    }, []);

    const handleDismiss = () => {
        setIsDismissed(true);
        localStorage.setItem("profileBannerDismissed", "true");
    };

    // Calculate profile completion
    const fields = [
        { name: "name", value: user.name },
        { name: "phone", value: user.phone },
        { name: "image", value: user.image },
    ];

    const completedFields = fields.filter((field) => field.value).length;
    const totalFields = fields.length;
    const completionPercentage = Math.round((completedFields / totalFields) * 100);
    const isComplete = completionPercentage === 100;

    // Don't show banner if profile is complete or dismissed
    if (isComplete || isDismissed) {
        return null;
    }

    return (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-6 relative">
            {/* Dismiss Button */}
            <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Dismiss"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                    </svg>
                </div>

                {/* Content */}
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        Complete Your Profile
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                        Add your details to make your events more personal and trustworthy
                    </p>

                    {/* Progress Bar */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-700">
                                {completedFields} of {totalFields} fields completed
                            </span>
                            <span className="text-xs font-semibold text-green-600">
                                {completionPercentage}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-gradient-to-r from-green-600 to-emerald-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${completionPercentage}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Missing Fields */}
                    <div className="mb-4">
                        <p className="text-xs text-gray-600 mb-2">Missing:</p>
                        <div className="flex flex-wrap gap-2">
                            {!user.name && (
                                <span className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-700">
                                    Name
                                </span>
                            )}
                            {!user.phone && (
                                <span className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-700">
                                    Phone
                                </span>
                            )}
                            {!user.image && (
                                <span className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-700">
                                    Profile Picture
                                </span>
                            )}
                        </div>
                    </div>

                    {/* CTA Button */}
                    <Link
                        href="/profile/setup"
                        className="inline-block px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-semibold hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-[1.02] shadow-md"
                    >
                        Complete Profile
                    </Link>
                </div>
            </div>
        </div>
    );
}
