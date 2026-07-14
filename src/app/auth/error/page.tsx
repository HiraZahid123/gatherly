"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function ErrorContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get("error");

    const errorMap: Record<string, { title: string; message: string }> = {
        Configuration: {
            title: "Configuration Error",
            message: "There is a problem with the server configuration. Please check your environment variables (GOOGLE_CLIENT_ID, etc.).",
        },
        AccessDenied: {
            title: "Access Denied",
            message: "You do not have permission to access this resource, or the sign-in was cancelled.",
        },
        Verification: {
            title: "Verification Failed",
            message: "The verification link has expired or has already been used.",
        },
        Default: {
            title: "Authentication Error",
            message: "An unexpected error occurred during the authentication process.",
        },
    };

    const { title, message } = errorMap[error as keyof typeof errorMap] || errorMap.Default;

    return (
        <div className="bg-[#161618] border border-white/10 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center space-y-6">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>

            <div className="space-y-2">
                <h1 className="text-2xl font-bold text-white">{title}</h1>
                <p className="text-gray-400 text-sm">{message}</p>
                {error && (
                    <div className="mt-4 p-2 bg-black/20 rounded font-mono text-xs text-red-400/70">
                        Error Code: {error}
                    </div>
                )}
            </div>

            <div className="pt-4 flex flex-col gap-3">
                <Link
                    href="/auth/signin"
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all"
                >
                    Try Again
                </Link>
                <Link
                    href="/"
                    className="w-full text-gray-400 hover:text-white text-sm transition-colors py-2"
                >
                    Back to Home
                </Link>
            </div>
        </div>
    );
}

export default function AuthErrorPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center p-4">
            <Suspense fallback={<div className="text-white">Loading...</div>}>
                <ErrorContent />
            </Suspense>
        </div>
    );
}
