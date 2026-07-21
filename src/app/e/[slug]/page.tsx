import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import PublicEventClient from "@/components/event-page/PublicEventClient";
import { notFound } from "next/navigation";

const getEventBySlug = (slug: string) => unstable_cache(
    async () => {
        return prisma.event.findUnique({
            where: { slug },
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
    searchParams: Promise<{ inviteToken?: string }>;
}

export default async function PublicEventPage({ params, searchParams }: PublicEventPageProps) {
    try {
        const { slug } = await params;
    const { inviteToken } = await searchParams;

    const { auth } = await import("@/lib/auth");
    const session = await auth();

    // Fetch essential data — cached 5 min; session/privacy checks remain dynamic
    const event = await getEventBySlug(slug);

    if (!event) {
        notFound();
    }

    // Hidden events are only accessible by the host
    if (event.isHidden && session?.user?.id !== event.hostId) {
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
    if (event.visibility === "PRIVATE") {
        const isHost = session?.user?.id === event.hostId;
        let isInvited = false;

        if (!isHost) {
            const invitation = await (prisma as any).invitation.findFirst({
                where: {
                    eventId: event.id,
                    OR: [
                        { token: inviteToken || "invalid-token" },
                        { email: session?.user?.email || "invalid-email" }
                    ]
                }
            });
            isInvited = !!invitation;
        }

        if (!isHost && !isInvited) {
            const EventRestricted = (await import("@/components/event-page/EventRestricted")).default;
            return <EventRestricted theme={event.theme} />;
        }
    }

    // Fetch guests, comments, and ticket tiers in parallel.
    // Caps: 50 RSVPs (ACCEPTED first) and 30 comments for initial paint.
    // Socket.io re-fetches full data client-side immediately on mount.
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
        event.isPaid
            ? prisma.ticketTier.findMany({
                where: { eventId: event.id, isActive: true },
                orderBy: { sortOrder: "asc" },
            })
            : Promise.resolve([]),
    ]);

    // Format guests (similar to the API logic)
    const guests = guestsData.map((rsvp: any) => ({
        id: rsvp.userId || rsvp.guestEmail || rsvp.id,
        rsvpId: rsvp.id,
        name: rsvp.user?.name || rsvp.guestName || "Guest",
        email: rsvp.user?.email || rsvp.guestEmail, // Server component can handle this safely
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
        console.error("Server component crash:", error);
        return (
            <div className="min-h-screen bg-black text-white p-20 font-mono">
                <h1 className="text-3xl text-red-500 font-bold mb-4">Server Component Crash</h1>
                <p className="text-xl mb-8">The exact error details are below:</p>
                <div className="bg-red-950/30 p-8 rounded border border-red-500/30 overflow-auto">
                    <p className="font-bold text-red-400">{error.message}</p>
                    <pre className="mt-4 text-sm text-gray-400">{error.stack}</pre>
                </div>
                <p className="mt-8 text-gray-400">Please send a screenshot or paste this error to Antigravity so we can fix it.</p>
            </div>
        );
    }
}
