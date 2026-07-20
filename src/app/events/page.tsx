"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { X, Sparkles, Pencil } from "lucide-react";
import PublicEventClient from "@/components/event-page/PublicEventClient";

// ---------------------------------------------------------------------------
// Hardcoded example event — no database required
// ---------------------------------------------------------------------------
const EXAMPLE_EVENT = {
    id: "example-demo-event-000",
    title: "Tech Innovators Summit 2026",
    slug: "example",
    description:
        "Join the brightest minds in tech for an evening of keynotes, networking, and bold ideas that will shape the next decade. Expect live demos, panel discussions, and the kind of energy you only get when innovators collide.\n\nDress code: Smart casual. Drinks and canapés provided.",
    startDate: new Date("2026-06-14T18:00:00").toISOString(),
    endDate: new Date("2026-06-14T22:00:00").toISOString(),
    location: "The Ritz-Carlton, San Francisco, CA",
    locationType: "PHYSICAL",
    hostId: "example-host-id-000",
    visibility: "PUBLIC",
    status: "PUBLISHED",
    coverImage:
        "/partiful/bitchy-shrek-sophia.avif",
    guestListHidden: false,
    capacity: 200,
    isPrivate: false,
    theme: {
        primaryColor: "#6366f1",
        backgroundTheme: "default",
        effect: "particles",
        vibeId: "futuristic",
        showRSVP: true,
        settings: {
            rsvp: {
                requireApproval: false,
                capacity: 200,
                plusOnes: 0,
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
        name: "Alex Rivera",
        email: "alex@example.com",
        image: null,
    },
    staff: [],
    _count: { rsvps: 47 },
};

const EXAMPLE_GUESTS = [
    { id: "g1", rsvpId: "r1", name: "Sarah Chen", email: "sarah@example.com", image: null, status: "ACCEPTED", qrToken: null, updatedAt: new Date().toISOString() },
    { id: "g2", rsvpId: "r2", name: "Marcus Johnson", email: "marcus@example.com", image: null, status: "ACCEPTED", qrToken: null, updatedAt: new Date().toISOString() },
    { id: "g3", rsvpId: "r3", name: "Priya Patel", email: "priya@example.com", image: null, status: "ACCEPTED", qrToken: null, updatedAt: new Date().toISOString() },
    { id: "g4", rsvpId: "r4", name: "David Kim", email: "david@example.com", image: null, status: "ACCEPTED", qrToken: null, updatedAt: new Date().toISOString() },
    { id: "g5", rsvpId: "r5", name: "Emma Wilson", email: "emma@example.com", image: null, status: "MAYBE", qrToken: null, updatedAt: new Date().toISOString() },
    { id: "g6", rsvpId: "r6", name: "Liam Torres", email: "liam@example.com", image: null, status: "ACCEPTED", qrToken: null, updatedAt: new Date().toISOString() },
    { id: "g7", rsvpId: "r7", name: "Olivia Zhang", email: "olivia@example.com", image: null, status: "ACCEPTED", qrToken: null, updatedAt: new Date().toISOString() },
    { id: "g8", rsvpId: "r8", name: "Noah Adams", email: "noah@example.com", image: null, status: "ACCEPTED", qrToken: null, updatedAt: new Date().toISOString() },
];

const EXAMPLE_COMMENTS = [
    {
        id: "c1",
        eventId: "example-demo-event-000",
        content: "So excited for this! The lineup looks incredible 🚀",
        type: "TEXT",
        mediaUrl: null,
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        user: { id: "g1", name: "Sarah Chen", image: null },
    },
    {
        id: "c2",
        eventId: "example-demo-event-000",
        content: "Can't wait to see the live demos. See everyone there!",
        type: "TEXT",
        mediaUrl: null,
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        user: { id: "g2", name: "Marcus Johnson", image: null },
    },
    {
        id: "c3",
        eventId: "example-demo-event-000",
        content: "Will there be recordings available for those who can't make it?",
        type: "TEXT",
        mediaUrl: null,
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        user: { id: "g5", name: "Emma Wilson", image: null },
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
