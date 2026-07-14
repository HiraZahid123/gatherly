import { prisma } from "@/lib/prisma";

/**
 * Generate a URL-friendly slug from a string
 * @param text - The text to convert to a slug
 * @returns URL-friendly slug
 */
export function generateSlug(text: string): string {
    return text
        .toLowerCase()
        .trim()
        // Replace spaces with hyphens
        .replace(/\s+/g, "-")
        // Remove special characters except hyphens
        .replace(/[^\w\-]+/g, "")
        // Replace multiple hyphens with single hyphen
        .replace(/\-\-+/g, "-")
        // Remove leading/trailing hyphens 
        .replace(/^-+/, "")
        .replace(/-+$/, "")
        // Limit length
        .substring(0, 100);
}

/**
 * Ensure slug is unique by checking database and appending numbers if needed
 * @param baseSlug - The base slug to check
 * @param excludeEventId - Optional event ID to exclude from uniqueness check (for updates)
 * @returns Unique slug
 */
export async function ensureUniqueSlug(
    baseSlug: string,
    excludeEventId?: string
): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
        // Check if slug exists
        const existing = await prisma.event.findUnique({
            where: { slug },
            select: { id: true },
        });

        // If no existing event or it's the same event we're updating, slug is unique
        if (!existing || (excludeEventId && existing.id === excludeEventId)) {
            return slug;
        }

        // Append counter and try again
        counter++;
        slug = `${baseSlug}-${counter}`;
    }
}

/**
 * Generate a random alphanumeric ID
 * @param length - Length of the ID
 * @returns Random ID string
 */
export function generateRandomId(length: number = 6): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Generate a unique slug from event title with a random ID suffix
 * @param title - Event title
 * @param excludeEventId - Optional event ID to exclude from uniqueness check
 * @returns Unique slug
 */
export async function generateUniqueSlug(
    title: string,
    excludeEventId?: string
): Promise<string> {
    const baseSlug = generateSlug(title);
    const randomId = generateRandomId();
    const finalSlug = `${baseSlug}-${randomId}`;

    // Check for collision (highly unlikely but good practice)
    return ensureUniqueSlug(finalSlug, excludeEventId);
}
