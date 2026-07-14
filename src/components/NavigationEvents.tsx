"use client";

import { useEffect, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useLoader } from "@/lib/contexts/LoaderContext";

/**
 * Inner component — must be wrapped in <Suspense> because useSearchParams()
 * opts the subtree into dynamic rendering in Next.js App Router.
 */
function NavigationWatcher() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { showLoader, hideLoader } = useLoader();

    // Track the previous path so we only trigger on *actual* navigation
    const prevPathRef = useRef<string | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const currentPath = pathname + searchParams.toString();

        // On first mount, just record the path — don't show the loader
        if (prevPathRef.current === null) {
            prevPathRef.current = currentPath;
            return;
        }

        // Only trigger if the path actually changed
        if (prevPathRef.current === currentPath) return;
        prevPathRef.current = currentPath;

        // Clear any lingering timer from a previous navigation
        if (timerRef.current) clearTimeout(timerRef.current);

        showLoader();

        // Auto-hide after a short delay as a safety net in case the new
        // page doesn't explicitly call hideLoader (e.g. static routes)
        timerRef.current = setTimeout(() => {
            hideLoader();
        }, 700);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [pathname, searchParams, showLoader, hideLoader]);

    return null;
}

/**
 * Drop this anywhere inside <LoaderProvider> (e.g. in Providers.tsx).
 * It automatically shows the splash loader on every client-side navigation.
 */
export default function NavigationEvents() {
    return (
        <Suspense fallback={null}>
            <NavigationWatcher />
        </Suspense>
    );
}
