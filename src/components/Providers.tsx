"use client";

import { SessionProvider } from "next-auth/react";
import { LoaderProvider } from "@/lib/contexts/LoaderContext";
import { Toaster } from "sonner";
import NavigationEvents from "@/components/NavigationEvents";

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <LoaderProvider>
                {/* <NavigationEvents /> */}
                <Toaster richColors position="top-right" />
                {children}
            </LoaderProvider>
        </SessionProvider>
    );
}
