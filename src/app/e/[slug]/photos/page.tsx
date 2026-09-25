import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Camera, Sparkles } from "lucide-react";
import PhotoAlbum from "@/components/event-page/PhotoAlbum";
import { auth } from "@/lib/auth";

interface DedicatedPhotosPageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ inviteToken?: string }>;
}

export async function generateMetadata({ params }: DedicatedPhotosPageProps) {
    const { slug } = await params;
    const event = await prisma.event.findFirst({
        where: { OR: [{ slug }, { id: slug }] },
        select: { title: true }
    });

    return {
        title: event ? `Photo Album · ${event.title} · JollyWitMe` : "Photo Album · JollyWitMe",
        description: `View and share event photos on JollyWitMe.`
    };
}

export default async function DedicatedPhotosPage({ params, searchParams }: DedicatedPhotosPageProps) {
    const { slug } = await params;
    const { inviteToken } = await searchParams;
    const session = await auth();

    const event = await prisma.event.findFirst({
        where: { OR: [{ slug }, { id: slug }] },
        include: {
            host: { select: { id: true, name: true, image: true } }
        }
    });

    if (!event) {
        notFound();
    }

    if (event.isHidden && session?.user?.id !== event.hostId) {
        notFound();
    }

    const isHost = session?.user?.id === event.hostId;

    // Check private event permissions
    if (event.visibility === "PRIVATE" && !isHost) {
        const invitation = await prisma.invitation.findFirst({
            where: {
                eventId: event.id,
                OR: [
                    { token: inviteToken || "invalid-token" },
                    { email: session?.user?.email || "invalid-email" }
                ]
            }
        });
        if (!invitation) {
            const EventRestricted = (await import("@/components/event-page/EventRestricted")).default;
            return <EventRestricted theme={event.theme as any} />;
        }
    }

    // Extract theme primary color
    let primaryColor = "#22c55e";
    try {
        const parsedTheme = typeof event.theme === "string" ? JSON.parse(event.theme) : event.theme;
        if (parsedTheme?.primaryColor) primaryColor = parsedTheme.primaryColor;
    } catch {
        // fallback
    }

    return (
        <div className="min-h-screen bg-[#0a0a0d] text-white flex flex-col selection:bg-emerald-500 selection:text-black">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-40 bg-[#0e0f14]/85 backdrop-blur-2xl border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link
                        href={`/e/${event.slug}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-bold transition-all active:scale-95 border border-white/10"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Back to Event</span>
                        <span className="sm:hidden">Back</span>
                    </Link>

                    <span className="text-white/20">|</span>

                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="relative h-6 w-24 sm:h-7 sm:w-28 transition-transform group-hover:scale-105">
                            <Image
                                src="/logo/logo-full.webp"
                                alt="JollyWitMe"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                    </Link>
                </div>

                <div className="flex items-center gap-3">
                    <span className="hidden md:inline-block text-xs font-medium text-white/50 max-w-[220px] truncate">
                        {event.title}
                    </span>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        <span>Dedicated Album</span>
                    </div>

                    {session?.user && (
                        <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                            {session.user.image ? (
                                <div className="w-7 h-7 rounded-full overflow-hidden relative border border-white/20">
                                    <Image src={session.user.image} alt={session.user.name || "User"} fill className="object-cover" />
                                </div>
                            ) : (
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white text-[10px] font-bold">
                                    {session.user.name?.[0]?.toUpperCase() || "U"}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12">
                {/* Hero Header */}
                <div className="mb-8 sm:mb-10 text-center sm:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-6 sm:pb-8">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/70 font-semibold mb-3">
                            <Camera className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Photo Gallery</span>
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                            {event.title}
                        </h1>
                        <p className="text-sm text-white/50 mt-1.5 max-w-xl">
                            Memories, photos, and highlights from this event. Upload your favorite shots or download photos in original quality.
                        </p>
                    </div>

                    <div className="flex items-center justify-center sm:justify-end gap-2">
                        <Link
                            href={`/e/${event.slug}`}
                            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-bold text-white transition-all active:scale-95"
                        >
                            View Event Details →
                        </Link>
                    </div>
                </div>

                {/* Photo Album Component */}
                <div className="bg-[#121319]/80 border border-white/10 rounded-3xl p-4 sm:p-8 backdrop-blur-xl shadow-2xl">
                    <PhotoAlbum
                        eventId={event.id}
                        eventSlug={event.slug}
                        isHost={isHost}
                        primaryColor={primaryColor}
                        allowGuestUpload={true}
                    />
                </div>
            </main>

            {/* Footer */}
            <footer className="py-6 border-t border-white/5 text-center text-xs text-white/30">
                <p>from the Jolly Team · Powered by JollyWitMe</p>
            </footer>
        </div>
    );
}
