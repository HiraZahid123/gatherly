"use client";

import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";

interface EventCardProps {
    event: {
        id: string;
        title: string;
        description?: string | null;
        slug: string;
        location?: string | null;
        startDate: Date | string;
        endDate?: Date | string | null;
        capacity?: number | null;
        visibility: "PUBLIC" | "PRIVATE" | "UNLISTED";
        rsvpCount?: number;
        coverImage?: string | null;
    };
    onDelete?: (eventId: string) => void;
    isOwner?: boolean;
}

export default function EventCard({ event, onDelete, isOwner = false }: EventCardProps) {
    const startDate = new Date(event.startDate);
    const isPast = startDate < new Date();

    const handleDelete = () => {
        if (onDelete && confirm(`Are you sure you want to delete "${event.title}"?${event.rsvpCount ? ` This event has ${event.rsvpCount} RSVP(s).` : ""}`)) {
            onDelete(event.id);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-all flex flex-col">
            {/* Cover Image */}
            {event.coverImage && (
                <div className="h-40 w-full overflow-hidden relative">
                    <Image
                        src={event.coverImage}
                        alt={event.title}
                        fill
                        className="object-cover transition-transform hover:scale-105"
                        unoptimized
                    />
                </div>
            )}

            <div className="p-6 flex-1 flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {event.title}
                        </h3>
                        {event.visibility === "PRIVATE" && (
                            <span className="inline-block px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100 rounded">
                                Private
                            </span>
                        )}
                        {event.visibility === "UNLISTED" && (
                            <span className="inline-block px-2 py-1 text-xs font-semibold text-emerald-600 bg-emerald-100 rounded">
                                Unlisted
                            </span>
                        )}
                    </div>
                    {isPast && (
                        <span className="px-3 py-1 text-xs font-semibold text-gray-500 bg-gray-100 rounded-full">
                            Past
                        </span>
                    )}
                </div>

                {/* Description */}
                {event.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {event.description}
                    </p>
                )}

                {/* Details */}
                <div className="space-y-2 mb-4">
                    {/* Date */}
                    <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>
                            {startDate.toLocaleDateString()} at {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>

                    {/* Location */}
                    {event.location && (
                        <div className="flex items-center text-sm text-gray-600">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="truncate">{event.location}</span>
                        </div>
                    )}

                    {/* RSVP Count */}
                    <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>
                            {event.rsvpCount || 0} {event.capacity ? `/ ${event.capacity}` : ""} RSVPs
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <Link
                        href={`/e/${event.slug}`}
                        className="flex-1 text-center px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all text-sm"
                    >
                        View Event
                    </Link>
                    {isOwner && (
                        <>
                            <Link
                                href={`/events/${event.id}/edit`}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all text-sm"
                            >
                                Edit
                            </Link>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition-all text-sm"
                            >
                                Delete
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
