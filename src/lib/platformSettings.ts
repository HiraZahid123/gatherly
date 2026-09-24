import fs from "fs";
import path from "path";

export type CommissionType = "PERCENTAGE" | "FIXED" | "BOTH";

export interface PlatformCommissionSettings {
    commissionType: CommissionType;
    percentageRate: number; // e.g. 3 for 3%
    fixedAmount: number;    // e.g. 100 for ₦100 (in major currency units, e.g. Naira)
    currency: string;       // "ngn"
    payoutScheduleNote?: string;
    // Paystack
    paystackPublicKey?: string;
    paystackSecretKey?: string;
    updatedAt: string;
    updatedBy?: string;
}

export type PlatformSettings = PlatformCommissionSettings;

const SETTINGS_FILE_PATH = path.join(process.cwd(), "data", "platform-settings.json");

export const DEFAULT_COMMISSION_SETTINGS: PlatformCommissionSettings = {
    commissionType: "PERCENTAGE",
    percentageRate: 3.0,
    fixedAmount: 0,
    currency: "ngn",
    payoutScheduleNote: "Automatic end-of-day bank remittance via Paystack",
    updatedAt: new Date().toISOString(),
};

// In-memory cache for ultra-fast checkout calculations and Paystack key lookups
let cachedSettings: PlatformCommissionSettings | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache

/**
 * Masks a sensitive secret key (e.g. sk_test_... -> sk_test_••••••••••••3a9b)
 */
export function maskSecret(secret?: string | null): string {
    if (!secret || typeof secret !== "string") return "";
    const trimmed = secret.trim();
    if (trimmed.length <= 8) return "••••••••";
    
    // Find prefix (e.g. sk_test_, sk_live_)
    const underscoreIndex = trimmed.lastIndexOf("_");
    const prefix = underscoreIndex !== -1 ? trimmed.slice(0, underscoreIndex + 1) : "";
    const suffix = trimmed.slice(-4);
    return `${prefix}••••••••••••${suffix}`;
}

/**
 * Checks if a string looks like an already-masked secret placeholder
 */
export function isMaskedSecret(secret?: string | null): boolean {
    if (!secret) return false;
    return secret.includes("••") || secret.includes("***");
}

/**
 * Validates Paystack key prefixes
 */
export function validatePaystackKeyFormat(type: "public" | "secret", key: string): { valid: boolean; error?: string } {
    const trimmed = key.trim();
    if (!trimmed) return { valid: true };

    if (type === "public") {
        if (!trimmed.startsWith("pk_test_") && !trimmed.startsWith("pk_live_")) {
            return { valid: false, error: "Public key must start with 'pk_test_' or 'pk_live_'." };
        }
    } else if (type === "secret") {
        if (!trimmed.startsWith("sk_test_") && !trimmed.startsWith("sk_live_")) {
            return { valid: false, error: "Secret key must start with 'sk_test_' or 'sk_live_'." };
        }
    }

    return { valid: true };
}

/**
 * Loads current platform commission & Paystack settings from disk synchronously.
 */
export function getCommissionSettingsSync(): PlatformCommissionSettings {
    const now = Date.now();
    if (cachedSettings && now - lastCacheTime < CACHE_TTL_MS) {
        return cachedSettings;
    }

    try {
        if (!fs.existsSync(SETTINGS_FILE_PATH)) {
            const dataDir = path.dirname(SETTINGS_FILE_PATH);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            fs.writeFileSync(
                SETTINGS_FILE_PATH,
                JSON.stringify(DEFAULT_COMMISSION_SETTINGS, null, 2),
                "utf-8"
            );
            cachedSettings = { ...DEFAULT_COMMISSION_SETTINGS };
            lastCacheTime = now;
            return cachedSettings;
        }

        const raw = fs.readFileSync(SETTINGS_FILE_PATH, "utf-8");
        const parsed = JSON.parse(raw);
        const merged: PlatformCommissionSettings = {
            ...DEFAULT_COMMISSION_SETTINGS,
            ...parsed,
        };
        cachedSettings = merged;
        lastCacheTime = now;
        return merged;
    } catch (err) {
        console.error("[getCommissionSettingsSync] Failed to read settings file, using defaults:", err);
        return { ...DEFAULT_COMMISSION_SETTINGS };
    }
}

/**
 * Loads current platform commission settings from disk, falling back to defaults if not found.
 */
export async function getCommissionSettings(): Promise<PlatformCommissionSettings> {
    return getCommissionSettingsSync();
}

/**
 * Returns the effective Paystack configuration, prioritizing saved platform settings
 * and falling back to environment variables.
 */
export function getPaystackConfigSync(): {
    publicKey: string;
    secretKey: string;
    isLive: boolean;
    configured: boolean;
} {
    const settings = getCommissionSettingsSync();

    const publicKey = settings.paystackPublicKey?.trim() || process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";
    const secretKey = settings.paystackSecretKey?.trim() || process.env.PAYSTACK_SECRET_KEY || "";

    const isLive = publicKey.startsWith("pk_live_") || secretKey.startsWith("sk_live_");
    const configured = Boolean(publicKey && secretKey);

    return {
        publicKey,
        secretKey,
        isLive,
        configured,
    };
}

export async function getPaystackConfig() {
    return getPaystackConfigSync();
}

/**
 * Saves updated platform commission and Paystack settings to persistent storage and updates the cache.
 */
export async function saveCommissionSettings(
    newSettings: Partial<PlatformCommissionSettings> & { clearPaystackKeys?: boolean },
    adminIdentifier?: string
): Promise<PlatformCommissionSettings> {
    const current = await getCommissionSettings();

    const percentage = Number(newSettings.percentageRate ?? current.percentageRate);
    const fixed = Number(newSettings.fixedAmount ?? current.fixedAmount);

    // Handle Paystack Keys
    let paystackPublicKey = current.paystackPublicKey;
    let paystackSecretKey = current.paystackSecretKey;

    if (newSettings.clearPaystackKeys) {
        paystackPublicKey = undefined;
        paystackSecretKey = undefined;
    } else {
        if (newSettings.paystackPublicKey !== undefined) {
            paystackPublicKey = newSettings.paystackPublicKey.trim() || undefined;
        }
        if (newSettings.paystackSecretKey !== undefined) {
            const rawPsk = newSettings.paystackSecretKey.trim();
            if (rawPsk && !isMaskedSecret(rawPsk)) {
                paystackSecretKey = rawPsk;
            } else if (rawPsk === "") {
                paystackSecretKey = undefined;
            }
        }
    }

    const updated: PlatformCommissionSettings = {
        ...current,
        ...newSettings,
        percentageRate: Math.max(0, Math.min(100, isNaN(percentage) ? 3 : percentage)),
        fixedAmount: Math.max(0, isNaN(fixed) ? 0 : fixed),
        commissionType: newSettings.commissionType || current.commissionType,
        paystackPublicKey,
        paystackSecretKey,
        updatedAt: new Date().toISOString(),
        updatedBy: adminIdentifier || "Admin",
    };

    const dataDir = path.dirname(SETTINGS_FILE_PATH);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(updated, null, 2), "utf-8");
    cachedSettings = { ...updated };
    lastCacheTime = Date.now();

    return updated;
}

/**
 * Calculates the platform commission fee for a ticket order.
 * @param totalAmountInCents Total order amount in lowest currency denomination (kobo, e.g. ₦1,000 = 100,000 kobo).
 * @param quantity Number of tickets purchased.
 * @returns Object with platformFee in lowest currency units and a human-readable explanation.
 */
export async function calculatePlatformFee(
    totalAmountInCents: number,
    quantity: number
): Promise<{ platformFee: number; details: string }> {
    if (totalAmountInCents <= 0 || quantity <= 0) {
        return { platformFee: 0, details: "Free ticket - no fee" };
    }

    const settings = await getCommissionSettings();
    let calculatedFeeInCents = 0;
    const parts: string[] = [];

    if (settings.commissionType === "PERCENTAGE" || settings.commissionType === "BOTH") {
        const percentFee = Math.round(totalAmountInCents * (settings.percentageRate / 100));
        calculatedFeeInCents += percentFee;
        parts.push(`${settings.percentageRate}%`);
    }

    if (settings.commissionType === "FIXED" || settings.commissionType === "BOTH") {
        // fixedAmount is configured in standard major units (e.g. ₦100)
        // multiply by 100 to get kobo, then multiply by quantity
        const fixedFeePerTicketInCents = Math.round(settings.fixedAmount * 100);
        const totalFixedFee = fixedFeePerTicketInCents * quantity;
        calculatedFeeInCents += totalFixedFee;
        parts.push(`₦${settings.fixedAmount.toLocaleString()} fixed/ticket`);
    }

    // Safety cap: Platform commission can never exceed 100% of the ticket total
    const safeFee = Math.min(totalAmountInCents, Math.max(0, calculatedFeeInCents));

    return {
        platformFee: safeFee,
        details: parts.join(" + ") || "Standard platform fee",
    };
}
