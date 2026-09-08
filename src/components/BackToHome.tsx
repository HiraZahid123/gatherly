import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function BackToHome({ className = "" }: { className?: string }) {
    return (
        <Link
            href="/"
            className={`inline-flex items-center gap-2 text-sm font-semibold text-white/60 hover:text-white transition-colors ${className}`}
            aria-label="Back to home"
        >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to home</span>
        </Link>
    );
}
