import fs from "fs";
import path from "path";

export interface CoverTemplateItem {
    id: string;
    title: string;
    url: string;
    category: string;
    order: number;
    isCustom?: boolean;
    createdAt: string;
}

const DATA_FILE_PATH = path.join(process.cwd(), "data", "cover-templates.json");

export const INITIAL_COVER_TEMPLATES: Omit<CoverTemplateItem, "createdAt">[] = [
    { id: "aquarius", url: "/api/partiful/Aquarius.avif", title: "Aquarius", category: "Zodiac", order: 1 },
    { id: "back-to-school", url: "/api/partiful/Back to School S.avif", title: "Back to School", category: "School", order: 2 },
    { id: "devil-heart", url: "/api/partiful/Devil Heart.avif", title: "Devil Heart", category: "Party", order: 3 },
    { id: "lady-gaga", url: "/api/partiful/adminnightladygaga.avif", title: "Lady Gaga", category: "Night Out", order: 4 },
    { id: "aquarius-cake", url: "/api/partiful/aquarius-baby-cake.avif", title: "Aquarius Cake", category: "Birthday", order: 5 },
    { id: "aquarius-airbrush", url: "/api/partiful/aquariusairbrush.avif", title: "Aquarius Airbrush", category: "Party", order: 6 },
    { id: "award-goes-to", url: "/api/partiful/awardgoesto.avif", title: "Award Goes To", category: "Celebration", order: 7 },
    { id: "awards-night", url: "/api/partiful/awards-night.avif", title: "Awards Night", category: "Celebration", order: 8 },
    { id: "bad-bunny-award", url: "/api/partiful/badbunnyaward.avif", title: "Bad Bunny Award", category: "Music", order: 9 },
    { id: "bad-bunny-debi", url: "/api/partiful/badbunnydebitirar.avif", title: "Bad Bunny", category: "Music", order: 10 },
    { id: "bday-copypasta", url: "/api/partiful/bday-copypasta-1.avif", title: "Birthday Copypasta", category: "Birthday", order: 11 },
    { id: "bitchy-shrek", url: "/api/partiful/bitchy-shrek-sophia.avif", title: "Bitchy Shrek", category: "Party", order: 12 },
    { id: "bowtie-invite", url: "/api/partiful/bowtie-invite.avif", title: "Bowtie Invite", category: "Formal", order: 13 },
    { id: "bridgerton", url: "/api/partiful/bridgerton-two.avif", title: "Bridgerton", category: "Formal", order: 14 },
    { id: "brunch-oclock", url: "/api/partiful/brunch-oclock.avif", title: "Brunch O'clock", category: "Brunch", order: 15 },
    { id: "calisober", url: "/api/partiful/calisober-soft.avif", title: "Calisober", category: "Party", order: 16 },
    { id: "capricorn-cake", url: "/api/partiful/capricorn-baby-cake.avif", title: "Capricorn Cake", category: "Birthday", order: 17 },
    { id: "chocolatebox", url: "/api/partiful/chocolatebox.avif", title: "Chocolate Box", category: "Celebration", order: 18 },
    { id: "come-hang", url: "/api/partiful/come-hang-club-penguin.avif", title: "Club Penguin", category: "Hangout", order: 19 },
    { id: "cozy-bear", url: "/api/partiful/cozy-chill-bear.avif", title: "Cozy Bear", category: "Hangout", order: 20 },
    { id: "crafts-collage", url: "/api/partiful/crafts-collage.avif", title: "Crafts Collage", category: "Arts", order: 21 },
    { id: "cutie-pie", url: "/api/partiful/cutie-pie-blue.avif", title: "Cutie Pie", category: "Birthday", order: 22 },
    { id: "dapitt", url: "/api/partiful/dapitt.avif", title: "Dapitt", category: "Party", order: 23 },
    { id: "dinner-02", url: "/api/partiful/dinner-02.avif", title: "Dinner", category: "Dinner", order: 24 },
    { id: "dinner-butterflies", url: "/api/partiful/dinner-butterflies_ywle19.avif", title: "Dinner Butterflies", category: "Dinner", order: 25 },
    { id: "disco-pride", url: "/api/partiful/disco-pride.avif", title: "Disco Pride", category: "Party", order: 26 },
    { id: "matcha", url: "/api/partiful/drinkgradient-matcha.avif", title: "Matcha", category: "Brunch", order: 27 },
    { id: "dump-him", url: "/api/partiful/dump-him.avif", title: "Dump Him", category: "Party", order: 28 },
    { id: "dumplings", url: "/api/partiful/dumplingschopsticks.avif", title: "Dumplings", category: "Dinner", order: 29 },
    { id: "galentines-type", url: "/api/partiful/galentines-day-type.avif", title: "Galentine's", category: "Party", order: 30 },
    { id: "galentines-party", url: "/api/partiful/galentines-party.avif", title: "Galentine's Party", category: "Party", order: 31 },
    { id: "galentines-cheetah", url: "/api/partiful/galentinescheetah.avif", title: "Galentine's Cheetah", category: "Party", order: 32 },
    { id: "galentines-pink", url: "/api/partiful/galentinescheetahpink.avif", title: "Galentine's Pink", category: "Party", order: 33 },
    { id: "galentines-curtain", url: "/api/partiful/galentinescurtain.avif", title: "Galentine's Curtain", category: "Party", order: 34 },
    { id: "halftime", url: "/api/partiful/halftime-just.avif", title: "Halftime", category: "Sports", order: 35 },
    { id: "harry-styles", url: "/api/partiful/harrystylesdisco.avif", title: "Harry Styles", category: "Music", order: 36 },
    { id: "football", url: "/api/partiful/have-fun-football.avif", title: "Football", category: "Sports", order: 37 },
    { id: "heartbreak-hotel", url: "/api/partiful/heartbreak-hotel.avif", title: "Heartbreak Hotel", category: "Party", order: 38 },
    { id: "hearts-crafts", url: "/api/partiful/hearts-and-crafts.avif", title: "Hearts & Crafts", category: "Arts", order: 39 },
    { id: "heated-rivalry", url: "/api/partiful/heatedrivalryheart3.avif", title: "Heated Rivalry", category: "Party", order: 40 },
    { id: "housewarming", url: "/api/partiful/housewarming-muji.avif", title: "Housewarming", category: "Housewarming", order: 41 },
    { id: "hypnotic-vday", url: "/api/partiful/hypnotic-vday.avif", title: "Hypnotic Vday", category: "Party", order: 42 },
    { id: "iheartme", url: "/api/partiful/iheartme-nyc.avif", title: "I Heart Me", category: "Party", order: 43 },
    { id: "lets-climb", url: "/api/partiful/lets-climb.avif", title: "Let's Climb", category: "Fitness", order: 44 },
    { id: "love-is-blind", url: "/api/partiful/love-is-blind-wild.avif", title: "Love Is Blind", category: "Watch Party", order: 45 },
    { id: "love-potion", url: "/api/partiful/love-potion.avif", title: "Love Potion", category: "Party", order: 46 },
    { id: "lunar-new-year", url: "/api/partiful/lunarnewyear2026.avif", title: "Lunar New Year", category: "Celebration", order: 47 },
    { id: "mocktail", url: "/api/partiful/mocktail-party.avif", title: "Mocktail Party", category: "Party", order: 48 },
    { id: "movie-awards", url: "/api/partiful/movie-awards-spotlight.avif", title: "Movie Awards", category: "Watch Party", order: 49 },
    { id: "nicole-kidman", url: "/api/partiful/nicole-kidman-divorce.avif", title: "Nicole Kidman", category: "Watch Party", order: 50 },
    { id: "office-afters", url: "/api/partiful/office-afters.avif", title: "Office Afters", category: "Night Out", order: 51 },
    { id: "olympics", url: "/api/partiful/olympics20262.avif", title: "Olympics", category: "Sports", order: 52 },
    { id: "bad-bunny-boss", url: "/api/partiful/onlythingmorepowerfulbadbunny.avif", title: "Bad Bunny Boss", category: "Music", order: 53 },
    { id: "oscar-watch", url: "/api/partiful/oscar-watch-party-star.avif", title: "Oscar Night", category: "Watch Party", order: 54 },
    { id: "pingu", url: "/api/partiful/pingu-valentine.avif", title: "Pingu Valentine", category: "Party", order: 55 },
    { id: "rehearsal-dinner", url: "/api/partiful/rehearsal-dinner.avif", title: "Rehearsal Dinner", category: "Dinner", order: 56 },
    { id: "resolutions", url: "/api/partiful/resolutionbuttonss.avif", title: "Resolutions", category: "Celebration", order: 57 },
    { id: "retro-vday", url: "/api/partiful/retro-vday.avif", title: "Retro Vday", category: "Party", order: 58 },
    { id: "spongebob", url: "/api/partiful/spongebob-pie_el98lq.avif", title: "Spongebob", category: "Party", order: 59 },
    { id: "lofi-study", url: "/api/partiful/study-break-lofi.avif", title: "Lofi Study", category: "Hangout", order: 60 },
    { id: "turkey", url: "/api/partiful/turkey-notext.avif", title: "Turkey", category: "Dinner", order: 61 },
    { id: "cupid", url: "/api/partiful/valentine-cupid.avif", title: "Cupid", category: "Party", order: 62 },
    { id: "horror-valentine", url: "/api/partiful/valentine-horror.avif", title: "Horror Valentine", category: "Party", order: 63 },
    { id: "valentines-cake", url: "/api/partiful/valentinescake.avif", title: "Valentine's Cake", category: "Birthday", order: 64 },
    { id: "valentines-curtains", url: "/api/partiful/valentinesdaycurtains.avif", title: "Valentine's Curtains", category: "Party", order: 65 },
    { id: "wingmeme", url: "/api/partiful/wingmemenature.avif", title: "Wing Meme", category: "Party", order: 66 },
];

function ensureDataDir() {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function readLocalTemplates(): CoverTemplateItem[] {
    ensureDataDir();
    if (!fs.existsSync(DATA_FILE_PATH)) {
        const initialWithDates: CoverTemplateItem[] = INITIAL_COVER_TEMPLATES.map((t) => ({
            ...t,
            createdAt: new Date().toISOString(),
        }));
        try {
            fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(initialWithDates, null, 2), "utf8");
        } catch {
            // Ignore write errors if read-only filesystem
        }
        return initialWithDates;
    }
    try {
        const raw = fs.readFileSync(DATA_FILE_PATH, "utf8");
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return INITIAL_COVER_TEMPLATES.map((t) => ({
            ...t,
            createdAt: new Date().toISOString(),
        }));
    }
}

function writeLocalTemplates(templates: CoverTemplateItem[]): boolean {
    ensureDataDir();
    try {
        fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(templates, null, 2), "utf8");
        return true;
    } catch (err) {
        console.error("Failed to write templates to file:", err);
        return false;
    }
}

/**
 * Get all cover templates, sorted by order and creation date.
 */
export async function getAllCoverTemplates(options?: {
    category?: string;
    search?: string;
}): Promise<CoverTemplateItem[]> {
    let templates = readLocalTemplates();

    // Filter by category
    if (options?.category && options.category !== "All") {
        templates = templates.filter(
            (t) => t.category.toLowerCase() === options.category?.toLowerCase()
        );
    }

    // Filter by search query
    if (options?.search) {
        const q = options.search.toLowerCase().trim();
        templates = templates.filter(
            (t) =>
                t.title.toLowerCase().includes(q) ||
                t.category.toLowerCase().includes(q)
        );
    }

    return templates;
}

/**
 * Add a new cover template
 */
export async function addCoverTemplate(item: {
    title: string;
    url: string;
    category?: string;
}): Promise<CoverTemplateItem> {
    const templates = readLocalTemplates();
    const newId = `cover_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newTemplate: CoverTemplateItem = {
        id: newId,
        title: item.title.trim() || "Cover Template",
        url: item.url,
        category: item.category?.trim() || "General",
        order: 0,
        isCustom: true,
        createdAt: new Date().toISOString(),
    };

    // Prepend new template so it appears first in the library
    const updated = [newTemplate, ...templates];
    writeLocalTemplates(updated);

    return newTemplate;
}

/**
 * Delete a cover template by ID
 */
export async function deleteCoverTemplate(id: string): Promise<boolean> {
    const templates = readLocalTemplates();
    const templateToDelete = templates.find((t) => t.id === id);
    if (!templateToDelete) return false;

    // Filter out the deleted template
    const updated = templates.filter((t) => t.id !== id);
    writeLocalTemplates(updated);

    // If it's a custom uploaded file on the local filesystem, attempt to remove it
    if (templateToDelete.url.startsWith("/uploads/covers/")) {
        try {
            const relPath = templateToDelete.url.replace(/^\//, "");
            const fullPath = path.join(process.cwd(), "public", relPath);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        } catch (err) {
            console.warn("Could not delete physical cover file:", err);
        }
    }

    return true;
}

/**
 * Reset / re-seed templates to default Partiful library
 */
export async function resetCoverTemplates(): Promise<CoverTemplateItem[]> {
    const initialWithDates: CoverTemplateItem[] = INITIAL_COVER_TEMPLATES.map((t) => ({
        ...t,
        createdAt: new Date().toISOString(),
    }));
    writeLocalTemplates(initialWithDates);
    return initialWithDates;
}
