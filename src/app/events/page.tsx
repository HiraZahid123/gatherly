"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { X, Sparkles, Pencil } from "lucide-react";
import PublicEventClient from "@/components/event-page/PublicEventClient";

// ---------------------------------------------------------------------------
// Hardcoded example event — Nigerian Owambe Lagos Celebration
// ---------------------------------------------------------------------------
const EXAMPLE_EVENT = {
    id: "example-demo-event-000",
    title: "Chief & Chief Mrs. Balogun's 50th Grand Owambe",
    slug: "example",
    description:
        "Join us for an unforgettable evening of high-energy celebration, live Fuji & Afrobeats music, gourmet Nigerian cuisine, and vibrant cultural elegance as we celebrate 50 glorious years in grand style!\n\nDress Code: Emerald & Gold Aso-Ebi / Traditional Luxe. Drinks, small chops, and banquet provided.",
    startDate: new Date("2026-11-28T17:00:00").toISOString(),
    endDate: new Date("2026-11-28T23:30:00").toISOString(),
    location: "Landmark Event Centre, Victoria Island, Lagos",
    locationType: "PHYSICAL",
    hostId: "example-host-id-000",
    visibility: "PUBLIC",
    status: "PUBLISHED",
    coverImage:
        "/partiful/awards-night.avif",
    guestListHidden: false,
    capacity: 350,
    isPrivate: false,
    theme: {
        primaryColor: "#10b981",
        backgroundTheme: "meadow",
        effect: "glow",
        vibeId: "royal",
        showRSVP: true,
        settings: {
            rsvp: {
                requireApproval: false,
                capacity: 350,
                plusOnes: 1,
                allowMutuals: true,
                allowMaybe: true,
            },
            privacy: {
                showTimestamps: true,
                showNames: true,
                showCount: true,
                requirePassword: false,
                isPrivate: false,
                guestListHidden: false,
            },
            hosts: { cohosts: [], linkSharing: true },
        },
    },
    host: {
        id: "example-host-id-000",
        name: "Chief & Chief Mrs. Balogun",
        email: "balogun.owambe@jollywitme.com",
        image: "/guests/ng-b3.webp",
    },
    staff: [],
    _count: { rsvps: 184 },
};

const EXAMPLE_GUESTS = [
    { id: "g1", rsvpId: "r1", name: "Ola", email: "ola@example.com", image: "/guests/ng-b2.webp", status: "ACCEPTED", qrToken: null, updatedAt: "2026-11-20T10:00:00.000Z" },
    { id: "g2", rsvpId: "r2", name: "Semilore", email: "semilore@example.com", image: "/guests/ng-g1.webp", status: "ACCEPTED", qrToken: null, updatedAt: "2026-11-20T10:05:00.000Z" },
    { id: "g3", rsvpId: "r3", name: "Babatunde", email: "babatunde@example.com", image: "/guests/ng-b3.webp", status: "ACCEPTED", qrToken: null, updatedAt: "2026-11-20T10:10:00.000Z" },
    { id: "g4", rsvpId: "r4", name: "Ifeoma", email: "ifeoma@example.com", image: "/guests/ng-g2.webp", status: "ACCEPTED", qrToken: null, updatedAt: "2026-11-20T10:15:00.000Z" },
    { id: "g5", rsvpId: "r5", name: "Shegzy", email: "shegzy@example.com", image: "/guests/ng-b4.webp", status: "ACCEPTED", qrToken: null, updatedAt: "2026-11-20T10:20:00.000Z" },
    { id: "g6", rsvpId: "r6", name: "Chigozie", email: "chigozie@example.com", image: "/guests/ng-b1.webp", status: "ACCEPTED", qrToken: null, updatedAt: "2026-11-20T10:25:00.000Z" },
    { id: "g7", rsvpId: "r7", name: "Folake Adebayo", email: "folake@example.com", image: "/guests/ng-g1.webp", status: "ACCEPTED", qrToken: null, updatedAt: "2026-11-20T10:30:00.000Z" },
    { id: "g8", rsvpId: "r8", name: "Tunde Bakare", email: "tunde@example.com", image: "/guests/ng-b2.webp", status: "ACCEPTED", qrToken: null, updatedAt: "2026-11-20T10:35:00.000Z" },
];

const EXAMPLE_COMMENTS = [
    {
        id: "c1",
        eventId: "example-demo-event-000",
        content: "Aso-Ebi fabric is ready! Can't wait for this celebration 🎉✨",
        type: "TEXT",
        mediaUrl: null,
        createdAt: "2026-11-20T12:00:00.000Z",
        user: { id: "g1", name: "Semilore", image: "/guests/ng-g1.webp" },
    },
    {
        id: "c2",
        eventId: "example-demo-event-000",
        content: "Counting down the days! Lagos Owambe is about to be legendary 🔥",
        type: "TEXT",
        mediaUrl: null,
        createdAt: "2026-11-20T11:00:00.000Z",
        user: { id: "g2", name: "Babatunde", image: "/guests/ng-b3.webp" },
    },
    {
        id: "c3",
        eventId: "example-demo-event-000",
        content: "Will the live band be starting promptly at 5 PM? We are ready!",
        type: "TEXT",
        mediaUrl: null,
        createdAt: "2026-11-20T09:00:00.000Z",
        user: { id: "g3", name: "Ifeoma", image: "/guests/ng-g2.webp" },
    },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function ExampleEventPage() {
    const [showSignupModal, setShowSignupModal] = useState(false);

    return (
        <div className="relative">
            {/* ----------------------------------------------------------------
                Example banner — fixed at very top, above the navbar
            ---------------------------------------------------------------- */}
            <div className="fixed top-0 left-0 right-0 z-[300] bg-gradient-to-r from-emerald-600 via-green-600 to-yellow-600 text-white text-sm font-medium py-2 px-4 flex items-center justify-center gap-3 shadow-lg">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">
                    This is an example event — see exactly what your guests will experience.
                </span>
                <span className="sm:hidden">Example event preview</span>
                <button
                    onClick={() => setShowSignupModal(true)}
                    className="ml-2 bg-white text-green-700 font-bold text-xs px-3 py-1 rounded-full hover:bg-green-50 transition-colors whitespace-nowrap"
                >
                    Create yours →
                </button>
            </div>

            {/* Push content down so the fixed banner doesn't overlap the navbar */}
            <div className="h-9" />

            {/* ----------------------------------------------------------------
                Real event-page component, fed with hardcoded example data.
                API calls inside will return 404s for the fake ID and fail
                gracefully — initial data stays intact.
            ---------------------------------------------------------------- */}
            <Suspense fallback={
                <div className="min-h-screen bg-black flex items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white/30" />
                </div>
            }>
                <PublicEventClient
                    initialEvent={EXAMPLE_EVENT}
                    initialGuests={EXAMPLE_GUESTS}
                    initialComments={EXAMPLE_COMMENTS}
                    slug="example"
                />
            </Suspense>

            {/* ----------------------------------------------------------------
                "Create your own" floating CTA — acts as the visible "Edit" button
            ---------------------------------------------------------------- */}
            <button
                onClick={() => setShowSignupModal(true)}
                className="fixed bottom-8 right-8 z-[250] flex items-center gap-2 bg-white text-gray-900 font-bold px-5 py-3 rounded-full shadow-2xl hover:scale-105 transition-transform"
            >
                <Pencil className="w-4 h-4" />
                <span>Create your own</span>
            </button>

            {/* ----------------------------------------------------------------
                Sign-up modal
            ---------------------------------------------------------------- */}
            {showSignupModal && (
                <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={() => setShowSignupModal(false)}
                    />

                    {/* Card */}
                    <div className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
                        <button
                            onClick={() => setShowSignupModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>

                        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
                            Make it yours
                        </h2>
                        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                            Create stunning events like this one in minutes. Customise the
                            theme, invite guests, and manage RSVPs — all in one place.
                        </p>

                        <Link
                            href="/auth/signup"
                            className="block w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold py-3 px-6 rounded-full hover:opacity-90 transition-opacity"
                        >
                            Sign up free
                        </Link>
                        <Link
                            href="/auth/signin"
                            className="block w-full mt-3 text-gray-500 text-sm hover:text-gray-700 transition-colors"
                        >
                            Already have an account? Sign in
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
