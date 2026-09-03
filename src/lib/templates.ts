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

export async function getPublishedTemplatesByCategory(category: string): Promise<PublicTemplateSummary[]> {
    const normalizedCategory = category?.trim();

    if (!normalizedCategory) {
        return [];
    }

    const templates = await prisma.eventTemplate.findMany({
        where: {
            published: true,
            category: {
                equals: normalizedCategory,
                mode: "insensitive",
            },
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

