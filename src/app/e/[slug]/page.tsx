import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import PublicEventClient from "@/components/event-page/PublicEventClient";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

const getEventBySlug = (slug: string) => unstable_cache(
    async () => {
        if (!slug || slug === "undefined" || slug === "null") return null;
        let decoded = slug;
        try {
            decoded = decodeURIComponent(slug);
        } catch (_) {}
        return prisma.event.findFirst({
            where: {
                OR: [
                    { slug: { equals: decoded, mode: "insensitive" } },
                    { slug: { equals: slug, mode: "insensitive" } },
                    { id: decoded },
                    { id: slug }
                ]
            },
            include: {
                host: { select: { id: true, name: true, email: true, image: true } },
                _count: { select: { rsvps: { where: { status: "ACCEPTED" } } } },
                staff: true,
                reminders: { select: { hoursBefore: true, message: true, isSent: true } },
            },
        });
    },
    ["event-by-slug", slug],
    { revalidate: 10, tags: [`event-by-slug-${slug}`] }
)();

interface PublicEventPageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ inviteToken?: string; invite?: string; ticket?: string }>;
}

export default async function PublicEventPage({ params, searchParams }: PublicEventPageProps) {
    let resolvedSlug = "";
    try {
        const { slug } = await params;
        resolvedSlug = slug;
        const rawSearchParams = await searchParams;
        // Support both ?inviteToken= (legacy) and ?invite= (new invitation emails)
        const inviteToken = rawSearchParams.inviteToken || rawSearchParams.invite;
        const ticketToken = rawSearchParams.ticket;

        const { auth } = await import("@/lib/auth");
        const session = await auth();

        // Fetch essential data — cached 5 min; session/privacy checks remain dynamic
        const event = await getEventBySlug(slug);

        if (!event) {
            notFound();
        }

        const isHost = !!session?.user?.id && session.user.id === event.hostId;
        const isAdmin = session?.user?.role === "ADMIN";

        // Hidden events are accessible by the host and platform admins
        if (event.isHidden && !isHost && !isAdmin) {
            notFound();
        }

        // Parse theme if it's a string (Move up so we can use it for restricted screen)
        if (event.theme && typeof event.theme === 'string') {
            try {
                event.theme = JSON.parse(event.theme);
            } catch (e) {
                console.error("Failed to parse event theme", e);
                event.theme = { settings: {} };
            }
        } else if (!event.theme) {
            event.theme = { settings: {} };
        }
        
        const theme: any = event.theme;
        if (!theme.settings) theme.settings = {};
        theme.settings.reminders = event.reminders;

        // Check Permissions for Private Events
        if (event.visibility === "PRIVATE" || event.isPrivate) {
            let isInvited = false;

            if (!isHost && !isAdmin) {
                // 1. If user arrived with a valid RSVP ticket token, they are already an approved attendee!
                if (ticketToken) {
                    const ticketRsvp = await (prisma as any).rSVP.findFirst({
                        where: {
                            eventId: event.id,
                            qrToken: ticketToken,
                            status: { in: ["ACCEPTED", "WAITLISTED"] }
                        }
                    });
                    if (ticketRsvp) {
                        isInvited = true;
                    }
                }

                // 2. Otherwise check invitations or session
                if (!isInvited) {
                    const orConditions: any[] = [];
                    // Check token (from invite link)
                    if (inviteToken) {
                        orConditions.push({ token: inviteToken.trim() });
                    }
                    // Check signed-in user's email (case-insensitive)
                    if (session?.user?.email) {
                        const cleanEmail = session.user.email.trim().toLowerCase();
                        orConditions.push({ email: cleanEmail });
                        orConditions.push({ email: { equals: cleanEmail, mode: "insensitive" } });
                    }
                    // Check signed-in user's phone
                    const userPhone = (session?.user as any)?.phone;
                    if (userPhone) {
                        orConditions.push({ phone: userPhone.trim() });
                    }

                    if (orConditions.length > 0) {
                        const invitation = await (prisma as any).invitation.findFirst({
                            where: { eventId: event.id, OR: orConditions }
                        });
                        isInvited = !!invitation;
                    }
                }
            }

            if (!isHost && !isAdmin && !isInvited) {
                const EventRestricted = (await import("@/components/event-page/EventRestricted")).default;
                return (
                    <EventRestricted
                        theme={event.theme}
                        eventTitle={event.title}
                        userEmail={session?.user?.email || null}
                        isLoggedIn={!!session?.user}
                        slug={slug}
                    />
                );
            }
        }

        // Fetch guests, comments, and ticket tiers in parallel.
        const [guestsData, commentsData, ticketTiersData] = await Promise.all([
            (prisma as any).rSVP.findMany({
                where: { eventId: event.id },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            image: true
                        }
                    }
                },
                orderBy: [{ status: "asc" }, { createdAt: "desc" }],
                take: 50,
            }),
            prisma.comment.findMany({
                where: { eventId: event.id },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            image: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
                take: 30,
            }),
            prisma.ticketTier.findMany({
                where: { eventId: event.id, isActive: true },
                orderBy: { sortOrder: "asc" },
            }),
        ]);

        // If a ticket token was provided, ensure that guest's RSVP is included in guestsData so PublicEventClient can mount it
        let guestsList = [...guestsData];
        if (ticketToken && !guestsList.some((g: any) => g.qrToken === ticketToken)) {
            const ticketRsvp = await (prisma as any).rSVP.findFirst({
                where: { eventId: event.id, qrToken: ticketToken },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            image: true
                        }
                    }
                }
            });
            if (ticketRsvp) {
                guestsList.unshift(ticketRsvp);
            }
        }

        // Format guests (similar to the API logic)
        const guests = guestsList.map((rsvp: any) => ({
            id: rsvp.userId || rsvp.guestEmail || rsvp.id,
            rsvpId: rsvp.id,
            name: rsvp.user?.name || rsvp.guestName || "Guest",
            email: rsvp.user?.email || rsvp.guestEmail,
            image: rsvp.user?.image,
            status: rsvp.status,
            qrToken: rsvp.qrToken,
            updatedAt: rsvp.updatedAt
        }));

        return (
            <PublicEventClient
                initialEvent={event}
                initialGuests={guests}
                initialComments={commentsData}
                initialTicketTiers={ticketTiersData}
                slug={slug}
            />
        );
    } catch (error: any) {
        // If it's a Next.js internal control error (notFound or redirect), rethrow it
        if (
            error?.digest?.startsWith?.("NEXT_") ||
            error?.message?.includes?.("NEXT_HTTP_ERROR_FALLBACK") ||
            error?.message?.includes?.("NEXT_REDIRECT")
        ) {
            throw error;
        }
        console.error("Public event page error:", error);

        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6 relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

                {/* Glassmorphism Card */}
                <div className="relative z-10 w-full max-w-md bg-black/40 backdrop-blur-2xl rounded-3xl p-8 sm:p-10 border border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] text-center space-y-6">
                    <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
                        <AlertCircle className="w-8 h-8" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-2xl font-black uppercase tracking-tight text-white">
                            Unable to Load Event
                        </h1>
                        <p className="text-white/60 text-sm leading-relaxed">
                            We're having trouble loading this event right now. Please check your connection and try refreshing the page.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <Link
                            href={resolvedSlug ? `/e/${resolvedSlug}` : "/"}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-black font-bold text-sm rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all shadow-lg"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span>Try Again</span>
                        </Link>
                        <Link
                            href="/"
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-white/5 border border-white/10 text-white/80 font-bold text-sm rounded-xl hover:bg-white/10 hover:text-white active:scale-[0.98] transition-all"
                        >
                            <Home className="w-4 h-4" />
                            <span>Home</span>
                        </Link>
                    </div>

                    {process.env.NODE_ENV === "development" && (
                        <div className="mt-4 pt-4 border-t border-white/10 text-left">
                            <p className="text-xs font-mono text-red-400 break-all">{error.message}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}
