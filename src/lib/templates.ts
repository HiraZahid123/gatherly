import { prisma } from "@/lib/prisma";
import { getAllCoverTemplates } from "@/lib/coverTemplates";

export interface EventTemplate {
    id: string;
    title: string;
    previewImage: string;
    bgClass: string;
    config: {
        theme: string;
        effect: string;
        poster: string;
        vibeId: string;
    };
}

export interface PublicTemplateSummary {
    id: string;
    title: string;
    label: string;
    image: string;
    category?: string;
    previewImage?: string;
    bgClass?: string;
    theme?: string;
    effect?: string;
    poster?: string;
    vibeId?: string;
    isTrending?: boolean;
    order?: number;
    published?: boolean;
}

const TEMPLATE_CATEGORY_ALIASES: Record<string, string[]> = {
    Wedding: ["Wedding", "Weddings", "Formal"],
    Birthdays: ["Birthday", "Birthdays"],
    Birthday: ["Birthday", "Birthdays"],
    Party: ["Party", "Summer Party", "Summer Parties", "Night Out", "Celebration"],
    "Summer Party": ["Party", "Summer Party", "Summer Parties", "Night Out"],
    "Summer Parties": ["Party", "Summer Party", "Summer Parties", "Night Out"],
    Dinner: ["Dinner", "Dinners", "Brunch"],
    Dinners: ["Dinner", "Dinners", "Brunch"],
    Concert: ["Concert", "Concerts", "Music"],
    Concerts: ["Concert", "Concerts", "Music"],
    Housewarming: ["Housewarming", "Housewarmings", "Hangout"],
    Housewarmings: ["Housewarming", "Housewarmings", "Hangout"],
    Celebration: ["Celebration", "Celebrations"],
    Night: ["Night Out", "Night Outs"],
    "Night Out": ["Night Out", "Night Outs"],
};

export function resolveTemplateCategory(category: string): string[] {
    const raw = category?.trim();
    if (!raw) return [];

    const direct = TEMPLATE_CATEGORY_ALIASES[raw];
    if (direct) return [...new Set(direct)];

    const normalized = raw.toLowerCase();
    const matches = Object.entries(TEMPLATE_CATEGORY_ALIASES).filter(([key]) => key.toLowerCase() === normalized);
    if (matches.length > 0) {
        return [...new Set(matches.flatMap(([, values]) => values))];
    }

    return [raw];
}

const CURATED_CATEGORY_DEFAULTS: Record<string, PublicTemplateSummary[]> = {
    Wedding: [
        {
            id: "curated-wedding-1",
            title: "Bridgerton Elegance",
            label: "Royal Wedding & Owambe",
            image: "/partiful/bridgerton-two.avif",
            category: "Wedding",
            theme: "meadow",
            effect: "particles",
        },
        {
            id: "curated-wedding-2",
            title: "Bowtie & Black Tie",
            label: "Black Tie Reception",
            image: "/partiful/bowtie-invite.avif",
            category: "Wedding",
            theme: "dark",
            effect: "glow",
        },
        {
            id: "curated-wedding-3",
            title: "Rehearsal Dinner",
            label: "Rehearsal Dinner & Celebration",
            image: "/partiful/rehearsal-dinner.avif",
            category: "Wedding",
            theme: "streak",
            effect: "confetti",
        },
    ],
    Birthday: [
        {
            id: "curated-bday-1",
            title: "Celebration Cake",
            label: "Midnight Cake Bash",
            image: "/partiful/aquarius-baby-cake.avif",
            category: "Birthday",
            theme: "party",
            effect: "confetti",
        },
        {
            id: "curated-bday-2",
            title: "Vintage Birthday Vibes",
            label: "Birthday Copypasta Party",
            image: "/partiful/bday-copypasta-1.avif",
            category: "Birthday",
            theme: "meadow",
            effect: "particles",
        },
        {
            id: "curated-bday-3",
            title: "Golden Year Cake",
            label: "Golden Celebration Cake",
            image: "/partiful/capricorn-baby-cake.avif",
            category: "Birthday",
            theme: "streak",
            effect: "glow",
        },
    ],
    Concert: [
        {
            id: "curated-concert-1",
            title: "Disco Pride Live",
            label: "Neon Live Music & Stage",
            image: "/partiful/disco-pride.avif",
            category: "Concert",
            theme: "dark",
            effect: "glow",
        },
        {
            id: "curated-concert-2",
            title: "Arena Live Tour",
            label: "Arena Tour & Live Performance",
            image: "/partiful/badbunnydebitirar.avif",
            category: "Concert",
            theme: "streak",
            effect: "particles",
        },
        {
            id: "curated-concert-3",
            title: "Harry Styles Disco",
            label: "Acoustic & Disco Night",
            image: "/partiful/harrystylesdisco.avif",
            category: "Concert",
            theme: "dark",
            effect: "confetti",
        },
    ],
    Dinner: [
        {
            id: "curated-dinner-1",
            title: "Intimate Dinner",
            label: "Candlelit Gourmet Feast",
            image: "/partiful/dinner-02.avif",
            category: "Dinner",
            theme: "dark",
            effect: "glow",
        },
        {
            id: "curated-dinner-2",
            title: "Garden Butterflies Supper",
            label: "Enchanted Garden Supper",
            image: "/partiful/dinner-butterflies_ywle19.avif",
            category: "Dinner",
            theme: "meadow",
            effect: "particles",
        },
        {
            id: "curated-dinner-3",
            title: "Chic Brunch Gathering",
            label: "Sunday Brunch Club",
            image: "/partiful/brunch-oclock.avif",
            category: "Dinner",
            theme: "warm",
            effect: "glow",
        },
    ],
    Housewarming: [
        {
            id: "curated-house-1",
            title: "Muji Sanctuary",
            label: "New Home & Cozy Sanctuary",
            image: "/partiful/housewarming-muji.avif",
            category: "Housewarming",
            theme: "meadow",
            effect: "particles",
        },
        {
            id: "curated-house-2",
            title: "Cozy Bear Hangout",
            label: "Chill Living Room Gathering",
            image: "/partiful/cozy-chill-bear.avif",
            category: "Housewarming",
            theme: "warm",
            effect: "glow",
        },
    ],
    Party: [
        {
            id: "curated-party-1",
            title: "Sunset Mocktail Lounge",
            label: "Sunset Mocktails & Pool Lounge",
            image: "/partiful/mocktail-party.avif",
            category: "Party",
            theme: "tropical",
            effect: "confetti",
        },
        {
            id: "curated-party-2",
            title: "Office After Hours",
            label: "After-Hours Glow Party",
            image: "/partiful/office-afters.avif",
            category: "Party",
            theme: "dark",
            effect: "glow",
        },
        {
            id: "curated-party-3",
            title: "Galentine's Night",
            label: "Girls Night Out Celebration",
            image: "/partiful/galentines-party.avif",
            category: "Party",
            theme: "streak",
            effect: "particles",
        },
    ],
};

export async function getPublishedTemplatesByCategory(category: string): Promise<PublicTemplateSummary[]> {
    const categoryAliases = resolveTemplateCategory(category);

    if (!categoryAliases.length) {
        return [];
    }

    const results: PublicTemplateSummary[] = [];
    const seenImages = new Set<string>();

    // 1. Fetch templates from Prisma database (event_templates table)
    try {
        const dbTemplates = await prisma.eventTemplate.findMany({
            where: {
                published: true,
                OR: categoryAliases.map((alias) => ({
                    category: {
                        equals: alias,
                        mode: "insensitive",
                    },
                })),
            },
            orderBy: [
                { order: "asc" },
                { createdAt: "desc" },
            ],
        });

        for (const t of dbTemplates) {
            if (!seenImages.has(t.previewImage)) {
                seenImages.add(t.previewImage);
                results.push({
                    id: t.id,
                    title: t.title,
                    label: t.title,
                    image: t.previewImage,
                    category: t.category,
                    previewImage: t.previewImage,
                    bgClass: t.bgClass,
                    theme: t.theme,
                    effect: t.effect,
                    poster: t.poster,
                    vibeId: t.vibeId,
                    isTrending: t.isTrending,
                    order: t.order,
                    published: t.published,
                });
            }
        }
    } catch (e) {
        console.warn("Could not query prisma.eventTemplate:", e);
    }

    // 2. Fetch templates saved in admin cover templates system matching this category
    try {
        const adminTemplates = await getAllCoverTemplates();
        const matchingAdmin = adminTemplates.filter((t) =>
            categoryAliases.some((alias) => alias.toLowerCase() === t.category.toLowerCase())
        );

        for (const t of matchingAdmin) {
            // Use image URL from template (e.g. /partiful/... or /uploads/...)
            const img = t.url.replace(/^\/api\/partiful\//, "/partiful/");
            if (!seenImages.has(img)) {
                seenImages.add(img);
                results.push({
                    id: t.id,
                    title: t.title,
                    label: t.title,
                    image: img,
                    category: t.category,
                    previewImage: img,
                    poster: img,
                    order: t.order || 0,
                    published: true,
                });
            }
        }
    } catch (e) {
        console.warn("Could not query admin cover templates:", e);
    }

    // 3. Fallback / blend with curated relevant category defaults if empty or few
    const normalizedKey = Object.keys(CURATED_CATEGORY_DEFAULTS).find((k) =>
        categoryAliases.some((alias) => alias.toLowerCase() === k.toLowerCase())
    );

    if (normalizedKey && CURATED_CATEGORY_DEFAULTS[normalizedKey]) {
        const defaults = CURATED_CATEGORY_DEFAULTS[normalizedKey];
        for (const d of defaults) {
            if (!seenImages.has(d.image)) {
                seenImages.add(d.image);
                results.push(d);
            }
        }
    }

    return results;
}

export const TEMPLATES: EventTemplate[] = [];
