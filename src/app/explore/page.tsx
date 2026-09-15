import { prisma } from "@/lib/prisma";
import ExploreClient, { ExploreEvent } from "./ExploreClient";

export const metadata = {
    title: "Discover — JollyWitMe",
    description: "Find the best events happening around you and connect!",
};

// Revalidate every 60 seconds
export const revalidate = 60;

export default async function ExplorePage() {
    const rawEvents = await prisma.event.findMany({
        where: {
            isHidden: false,
            status: { in: ["PUBLISHED", "ACTIVE"] },
            visibility: "PUBLIC",
            startDate: { gte: new Date() },
        },
        orderBy: { startDate: "asc" },
        select: {
            id: true,
            title: true,
            description: true,
            slug: true,
            startDate: true,
            location: true,
            coverImage: true,
            host: { select: { id: true, name: true, image: true } },
            _count: { select: { rsvps: { where: { status: "ACCEPTED" } } } },
        },
    });

    const publicEvents: ExploreEvent[] = rawEvents.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        slug: e.slug,
        startDate: e.startDate.toISOString(),
        location: e.location,
        coverImage: e.coverImage,
        host: {
            id: e.host.id,
            name: e.host.name,
            image: e.host.image,
        },
        _count: {
            rsvps: e._count.rsvps,
        },
    }));

    return <ExploreClient initialEvents={publicEvents} />;
}
