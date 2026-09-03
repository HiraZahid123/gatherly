import { prisma } from "@/lib/prisma";

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
    Wedding: ["Wedding", "Weddings"],
    Birthdays: ["Birthday", "Birthdays"],
    Birthday: ["Birthday", "Birthdays"],
    Party: ["Party", "Summer Party", "Summer Parties"],
    "Summer Party": ["Party", "Summer Party", "Summer Parties"],
    "Summer Parties": ["Party", "Summer Party", "Summer Parties"],
    Dinner: ["Dinner", "Dinners"],
    Concert: ["Concert", "Concerts"],
    Concerts: ["Concert", "Concerts"],
    Housewarming: ["Housewarming", "Housewarmings"],
    Housewarmings: ["Housewarming", "Housewarmings"],
    Celebration: ["Celebration", "Celebrations"],
    Celebrations: ["Celebration", "Celebrations"],
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

export async function getPublishedTemplatesByCategory(category: string): Promise<PublicTemplateSummary[]> {
    const categoryAliases = resolveTemplateCategory(category);

    if (!categoryAliases.length) {
        return [];
    }

    const templates = await prisma.eventTemplate.findMany({
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

    return templates.map((template) => ({
        id: template.id,
        title: template.title,
        label: template.title,
        image: template.previewImage,
        category: template.category,
        previewImage: template.previewImage,
        bgClass: template.bgClass,
        theme: template.theme,
        effect: template.effect,
        poster: template.poster,
        vibeId: template.vibeId,
        isTrending: template.isTrending,
        order: template.order,
        published: template.published,
    }));
}

export const TEMPLATES: EventTemplate[] = [];

