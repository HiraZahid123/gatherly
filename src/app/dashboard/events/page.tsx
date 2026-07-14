"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import EventCard from "@/components/EventCard";
import Link from "next/link";

export default function DashboardEventsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [events, setEvents] = useState<any[]>([]);
    const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchEvents();
    }, [filter]);

    const fetchEvents = async () => {
        setIsLoading(true);
        setError("");

        try {
            const url = filter === "all"
                ? "/api/events/my-events"
                : `/api/events/my-events?filter=${filter}`;

            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch events");
            }

            setEvents(data.events);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (eventId: string) => {
        try {
            const response = await fetch(`/api/events/${eventId}/delete`, {
                method: "DELETE",
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to delete event");
            }

            // Refresh events list
            fetchEvents();
        } catch (err: any) {
            alert(err.message);
        }
    };

    if (!session) {
        router.push("/auth/signin");
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-12 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                            My Events
                        </h1>
                        <p className="text-gray-600">
                            Manage all your events in one place
                        </p>
                    </div>
                    <Link
                        href="/events/create"
                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-[1.02] shadow-lg"
                    >
                        + Create Event
                    </Link>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-gray-200">
                    <button
                        onClick={() => setFilter("all")}
                        className={`px-6 py-3 font-semibold transition-all ${filter === "all"
                                ? "text-green-600 border-b-2 border-green-600"
                                : "text-gray-600 hover:text-green-600"
                            }`}
                    >
                        All Events
                    </button>
                    <button
                        onClick={() => setFilter("upcoming")}
                        className={`px-6 py-3 font-semibold transition-all ${filter === "upcoming"
                                ? "text-green-600 border-b-2 border-green-600"
                                : "text-gray-600 hover:text-green-600"
                            }`}
                    >
                        Upcoming
                    </button>
                    <button
                        onClick={() => setFilter("past")}
                        className={`px-6 py-3 font-semibold transition-all ${filter === "past"
                                ? "text-green-600 border-b-2 border-green-600"
                                : "text-gray-600 hover:text-green-600"
                            }`}
                    >
                        Past
                    </button>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="text-center py-12">
                        <div className="inline-block w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-600 mt-4">Loading events...</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Events Grid */}
                {!isLoading && !error && events.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {events.map((event) => (
                            <EventCard
                                key={event.id}
                                event={event}
                                onDelete={handleDelete}
                                isOwner={true}
                            />
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !error && events.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {filter === "all" && "No events yet"}
                            {filter === "upcoming" && "No upcoming events"}
                            {filter === "past" && "No past events"}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {filter === "all" && "Create your first event to get started!"}
                            {filter === "upcoming" && "All your events have passed or you haven't created any yet."}
                            {filter === "past" && "You don't have any past events."}
                        </p>
                        {filter === "all" && (
                            <Link
                                href="/events/create"
                                className="inline-block px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg"
                            >
                                Create Your First Event
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
