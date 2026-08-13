import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getAllBlogPostsFromDB } from "@/lib/blog-data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://jollywitme.com";

    // 1. Static public routes from your site
    const staticRoutes = [
        "",
        "/explore",
        "/wedding",
        "/birthdays",
        "/concerts",
        "/housewarmings",
        "/events",
        "/events/create",
        "/blog",
        "/help",
        "/contact",
        "/auth/signin",
        "/auth/signup",
        "/auth/forgot-password",
        // Help Center Category & Article routes
        "/help/getting-started",
        "/help/getting-started/signing-up",
        "/help/getting-started/your-dashboard",
        "/help/getting-started/creating-your-first-event",
        "/help/managing-events",
        "/help/managing-events/editing-event-details",
        "/help/managing-events/cancelling-event",
        "/help/managing-events/adding-staff",
        "/help/managing-events/host-tools",
        "/help/managing-events/scanning-guests",
        "/help/inviting-guests",
        "/help/inviting-guests/sharing-your-event",
        "/help/inviting-guests/managing-rsvps",
        "/help/messaging",
        "/help/messaging/text-blast",
        "/help/guest-experience",
        "/help/guest-experience/how-to-rsvp",
        "/help/account-profile",
        "/help/account-profile/updating-profile",
        "/help/greeting-cards",
        "/help/greeting-cards/sending-a-card",
        "/help/ticketing-payouts",
        "/help/ticketing-payouts/connecting-stripe",
        "/help/ticketing-payouts/ticket-tiers",
        "/help/limits-waitlists",
        "/help/limits-waitlists/event-waitlists",
        "/help/socials-communication",
        "/help/socials-communication/event-chats",
        "/help/socials-communication/comments-board",
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: (route === "" ? "daily" : "weekly") as "daily" | "weekly",
        priority: route === "" ? 1.0 : 0.8,
    }));

    // 2. Fetch public published events from database
    let eventRoutes: MetadataRoute.Sitemap = [];
    try {
        const events = await prisma.event.findMany({
            where: {
                status: "PUBLISHED",
                visibility: "PUBLIC",
            },
            select: {
                slug: true,
                updatedAt: true,
            },
            take: 1000,
        });

        eventRoutes = events.map((event) => ({
            url: `${baseUrl}/e/${event.slug}`,
            lastModified: event.updatedAt || new Date(),
            changeFrequency: "weekly" as const,
            priority: 0.7,
        }));
    } catch (error) {
        console.error("Failed to fetch events for sitemap:", error);
    }

    // 3. Fetch blog posts (dynamically or fallback to static slugs)
    let blogRoutes: MetadataRoute.Sitemap = [];
    try {
        const posts = await getAllBlogPostsFromDB();
        blogRoutes = posts.map((post) => ({
            url: `${baseUrl}/blog/${post.slug}`,
            lastModified: post.publishedAt ? new Date(post.publishedAt) : new Date(),
            changeFrequency: "monthly" as const,
            priority: 0.6,
        }));
    } catch (error) {
        console.error("Failed to fetch blog posts for sitemap:", error);
    }

    return [...staticRoutes, ...eventRoutes, ...blogRoutes];
}
