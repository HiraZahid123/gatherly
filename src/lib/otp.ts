
/**
 * Generates a 6-digit random code
 */
export function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Formats a phone number for WhatsApp (jid)
 */
export function formatPhone(phone: string): string {
    // Remove all non-digits except maybe + at the start
    let cleaned = phone.replace(/[^\d+]/g, '');

    if (!cleaned.startsWith('+')) {
        // If it starts with 0 and doesn't have a +, it's likely a local number
        // However, the frontend is now providing the country code.
        // So we just ensure it has a + prefix for the WhatsApp JID logic.
        cleaned = '+' + cleaned.replace(/^0+/, '');
    } else {
        // If it already has a +, just ensure we don't have leading 0s after it
        // e.g. +92033... -> +9233...
        const plus = '+';
        const rest = cleaned.substring(1).replace(/^0+/, '');
        cleaned = plus + rest;
    }

    return cleaned;
}
