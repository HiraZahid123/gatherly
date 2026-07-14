
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple in-memory rate limiter for development/single-server
// In production, use Redis (e.g., @upstash/ratelimit)
const rateLimitMap = new Map();

import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth(async function middleware(request) {
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const path = request.nextUrl.pathname;
    const session = request.auth;

    // Rate limiting for auth and RSVP APIs
    if (path.startsWith("/api/auth") || path.includes("/rsvp")) {
        // Stricter limit for RSVP actions
        const isRsvpAction = path.includes("/rsvp");
        const limit = isRsvpAction ? 10 : 100; // 10 per min for RSVP, 100 for auth
        const windowMs = 60 * 1000;

        if (!rateLimitMap.has(ip)) {
            rateLimitMap.set(ip, { count: 0, lastReset: Date.now() });
        }
        const ipData = rateLimitMap.get(ip);
        if (Date.now() - ipData.lastReset > windowMs) {
            ipData.count = 0;
            ipData.lastReset = Date.now();
        }
        if (ipData.count >= limit) {
            return new NextResponse(
                JSON.stringify({ success: false, message: "Too many requests" }),
                { status: 429, headers: { "content-type": "application/json" } }
            );
        }
        ipData.count += 1;
    }

    // 🔒 Admin Protection
    if (path.startsWith("/admin") && path !== "/admin/login") {
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.redirect(new URL("/admin/login", request.url));
        }
    }

    // 🔒 Phone Capture Redirection
    // If logged in but no phone, and not on complete-profile or public pages
    if (session?.user && !(session.user as any).phone) {
        const isAuthPage = path.startsWith("/auth");
        const isPublicApi = path.startsWith("/api/auth") || path.startsWith("/api/public");
        const isCompleteProfile = path === "/auth/complete-profile";

        if (!isCompleteProfile && !isPublicApi && path !== "/") {
            return NextResponse.redirect(new URL("/auth/complete-profile", request.url));
        }
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - Assets in public folder (logo, hero.png, etc)
         */
        "/((?!api|_next/static|_next/image|favicon.ico|logo|assets|hero.png|guests|uploads|partiful).*)",
    ],
};
