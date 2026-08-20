/**
 * Event theme configuration
 */
export interface VibeTheme {
    id: string;
    label: string;
    fontClass: string;
    buttonClass: string;
    primaryColor: string;
    secondaryColor: string;
}

export const VIBE_THEMES: VibeTheme[] = [
    { id: "classic", label: "Classic", fontClass: "font-sans", buttonClass: "", primaryColor: "#3b82f6", secondaryColor: "#6366f1" },
    { id: "eclectic", label: "Eclectic", fontClass: "font-playfair", buttonClass: "", primaryColor: "#f43f5e", secondaryColor: "#f97316" },
    { id: "fancy", label: "Fancy", fontClass: "font-cursive", buttonClass: "font-cursive text-lg", primaryColor: "#ec4899", secondaryColor: "#a855f7" },
    { id: "literary", label: "Literary", fontClass: "font-playfair", buttonClass: "font-serif", primaryColor: "#f59e0b", secondaryColor: "#57534e" },
    { id: "digital", label: "Digital", fontClass: "font-mono font-black uppercase tracking-tighter", buttonClass: "uppercase text-[11px] tracking-widest", primaryColor: "#22c55e", secondaryColor: "#84cc16" },
    { id: "elegant", label: "Elegant", fontClass: "font-playfair tracking-widest", buttonClass: "uppercase text-[11px] tracking-widest", primaryColor: "#eab308", secondaryColor: "#1a1a1a" },
    { id: "futuristic", label: "Futuristic", fontClass: "font-mono tracking-[0.3em] uppercase", buttonClass: "border-white/20 hover:border-white", primaryColor: "#06b6d4", secondaryColor: "#3b82f6" },
    { id: "royal", label: "Royal", fontClass: "font-playfair font-black", buttonClass: "uppercase tracking-[0.2em] italic", primaryColor: "#a855f7", secondaryColor: "#d946ef" },
    { id: "retro", label: "Retro", fontClass: "font-sans tracking-wide", buttonClass: "font-mono", primaryColor: "#f97316", secondaryColor: "#f43f5e" },
];


/**
 * Event theme configuration
 */
export interface EventTheme {
    primaryColor?: string;
    secondaryColor?: string;
    bannerImage?: string;
    backgroundTheme?: string;
    effect?: string;
    vibeId?: string;
    rsvpLabels?: {
        going?: string;
        maybe?: string;
        notGoing?: string;
    };
    rsvpStyle?: string;
    showRSVP?: boolean;
}

/**
 * Default theme configuration
 */
export const DEFAULT_THEME: EventTheme = {
    primaryColor: "#16a34a", // Green-600
    secondaryColor: "#059669", // Emerald-600
    bannerImage: "",
    rsvpLabels: {
        going: "Going",
        maybe: "Maybe",
        notGoing: "Can't Go",
    },
    rsvpStyle: "standard",
    showRSVP: true,
};

/**
 * Validate and sanitize theme object
 * @param theme - Theme object to validate
 * @returns Sanitized theme object
 */
export function sanitizeTheme(theme: any): EventTheme {
    if (!theme) {
        return DEFAULT_THEME;
    }

    return {
        ...DEFAULT_THEME,
        ...theme,
        rsvpLabels: {
            going: theme.rsvpLabels?.going || DEFAULT_THEME.rsvpLabels!.going,
            maybe: theme.rsvpLabels?.maybe || DEFAULT_THEME.rsvpLabels!.maybe,
            notGoing: theme.rsvpLabels?.notGoing || DEFAULT_THEME.rsvpLabels!.notGoing,
        },
        rsvpStyle: theme.rsvpStyle || DEFAULT_THEME.rsvpStyle,
        showRSVP: theme.showRSVP !== undefined ? theme.showRSVP : DEFAULT_THEME.showRSVP,
    };
}

/**
 * Apply theme to CSS variables
 * @param theme - Theme object
 * @returns CSS variables object
 */
export function applyTheme(theme: EventTheme): Record<string, string> {
    const sanitized = sanitizeTheme(theme);

    return {
        "--theme-primary": sanitized.primaryColor!,
        "--theme-secondary": sanitized.secondaryColor!,
    };
}

/**
 * Get gradient style from theme colors
 * @param theme - Theme object
 * @returns Gradient CSS string
 */
export function getThemeGradient(theme: EventTheme): string {
    const sanitized = sanitizeTheme(theme);
    return `linear-gradient(to right, ${sanitized.primaryColor}, ${sanitized.secondaryColor})`;
}

/**
 * Normalizes a theme string so presets ("beer", "champagne") are properly converted to "preset-video:beer"
 */
export function normalizeThemeId(themeId?: string | null): string {
    if (!themeId) return "dark";
    if (
        themeId === "dark" ||
        ["streak", "meadow", "crystal", "waves"].includes(themeId) ||
        themeId.startsWith("preset-video:") ||
        themeId.startsWith("custom-gradient:")
    ) {
        return themeId;
    }
    return `preset-video:${themeId}`;
}

/**
 * Normalizes an effect string so video and image presets are properly formatted
 */
export function normalizeEffectId(effectId?: string | null): string {
    if (!effectId || effectId === "none") return "none";
    if (
        [
            "particles",
            "confetti",
            "aurora",
            "glow",
            "rain",
            "grid",
            "vignette",
            "skiing",
            "grain"
        ].includes(effectId) ||
        effectId.startsWith("preset-webm:") ||
        effectId.startsWith("preset-image:") ||
        effectId.startsWith("custom-uploaded:")
    ) {
        return effectId;
    }
    if (effectId === "snow" || effectId === "star") {
        return `preset-image:${effectId}`;
    }
    return `preset-webm:${effectId}`;
}

