import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const DEFAULT_SEEDS = [
    {
        title: "Grand Owambe Party",
        category: "Wedding",
        previewImage: "/partiful/disco-pride.avif",
        bgClass: "bg-emerald-950",
        theme: "meadow",
        effect: "particles",
        poster: "/partiful/disco-pride.avif",
        vibeId: "royal",
        isTrending: true,
        order: 0,
        published: true,
    },
    {
        title: "Girl Dinner",
        category: "Dinner",
        previewImage: "/partiful/dinner-butterflies_ywle19.avif",
        bgClass: "bg-emerald-900",
        theme: "meadow",
        effect: "particles",
        poster: "/partiful/dinner-butterflies_ywle19.avif",
        vibeId: "fancy",
        isTrending: true,
        order: 1,
        published: true,
    },
    {
        title: "Afrobeats & Vibes",
        category: "Concert",
        previewImage: "/partiful/disco-pride.avif",
        bgClass: "bg-green-950",
        theme: "streak",
        effect: "glow",
        poster: "/partiful/disco-pride.avif",
        vibeId: "digital",
        isTrending: true,
        order: 2,
        published: true,
    },
    {
        title: "Graduation Celebration",
        category: "Celebration",
        previewImage: "/partiful/awardgoesto.avif",
        bgClass: "bg-amber-950",
        theme: "dark",
        effect: "confetti",
        poster: "/partiful/awardgoesto.avif",
        vibeId: "classic",
        isTrending: true,
        order: 3,
        published: true,
    },
    {
        title: "VIP Movie Premiere",
        category: "Night Out",
        previewImage: "/partiful/movie-awards-spotlight.avif",
        bgClass: "bg-gray-950",
        theme: "dark",
        effect: "aurora",
        poster: "/partiful/movie-awards-spotlight.avif",
        vibeId: "royal",
        isTrending: true,
        order: 4,
        published: true,
    },
    {
        title: "Golden 50th Birthday Gala",
        category: "Birthday",
        previewImage: "/partiful/awardgoesto.avif",
        bgClass: "bg-yellow-950",
        theme: "sunset",
        effect: "particles",
        poster: "/partiful/awardgoesto.avif",
        vibeId: "fancy",
        isTrending: true,
        order: 5,
        published: true,
    },
];

// POST /api/admin/templates/seed — seed initial templates if empty or reset
export async function POST() {
    try {
        await verifyAdmin();

        const count = await prisma.eventTemplate.count();
        if (count > 0) {
            return NextResponse.json({
                success: true,
                message: `Database already has ${count} templates. Seed skipped.`,
                count,
            });
        }

        const created = await prisma.$transaction(
            DEFAULT_SEEDS.map((seed) => prisma.eventTemplate.create({ data: seed }))
        );

        return NextResponse.json({
            success: true,
            message: `Successfully seeded ${created.length} default templates!`,
            count: created.length,
        });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Internal Server Error";
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}
