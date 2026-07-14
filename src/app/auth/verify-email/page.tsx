"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useLoader } from "@/lib/contexts/LoaderContext";

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const router = useRouter();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");
    const { showLoader, hideLoader } = useLoader();

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("Invalid verification link.");
            return;
        }

        const verifyAndLogin = async () => {
            // We use signIn to verify AND log in at the same time
            // The "verification-token" provider handles the DB logic
            const result = await signIn("verification-token", {
                token,
                redirect: false,
            });

            if (result?.error) {
                setStatus("error");
                if (result.error === "InvalidToken") {
                    setMessage("The verification link is invalid or has expired.");
                } else {
                    setMessage(result.error);
                }
            } else {
                setStatus("success");
                // Redirect to create event page
                router.push("/events/create");
            }
        };

        verifyAndLogin();
    }, [token, router]);

    if (status === "loading") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <div className="text-white text-xl animate-pulse">Verifying your email...</div>
            </div>
        );
    }

    if (status === "error") {
        return (
            <div className="bg-[#161618] border border-red-500/20 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
                <p className="text-gray-400 mb-8">{message}</p>
                <Link
                    href="/auth/signin"
                    className="block w-full bg-white/10 text-white py-3 rounded-xl font-bold hover:bg-white/20 transition-all"
                >
                    Back to Sign In
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-[#161618] border border-green-500/20 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Email Verified!</h2>
            <p className="text-gray-400 mb-8 text-lg">
                Your account has been successfully verified. You can now start creating events.
            </p>

            <div className="space-y-4">
                <Link
                    href="/auth/signin?verified=true&callbackUrl=/events/create"
                    className="block w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all active:scale-[0.98]"
                >
                    Sign In to Create Event
                </Link>
                <Link
                    href="/dashboard"
                    className="block w-full bg-white/5 text-gray-400 py-3 rounded-2xl font-medium hover:bg-white/10 hover:text-white transition-all"
                >
                    Go to Dashboard
                </Link>
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b] px-4 py-12 relative overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-600/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="w-full max-w-md z-10 flex justify-center">
                <Suspense fallback={<div className="text-white">Loading...</div>}>
                    <VerifyEmailContent />
                </Suspense>
            </div>
        </div>
    );
}
