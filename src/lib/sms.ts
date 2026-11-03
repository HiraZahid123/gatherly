/**
 * WhatsApp messaging utility using Baileys.
 */

import { getWhatsAppService } from "@/services/whatsapp";

interface SendSmsOptions {
    to: string;
    body: string;
}

interface SmsResult {
    success: boolean;
    error?: string;
}

/**
 * Normalise a phone number: strip non-digits except leading +.
 */
export function normalizePhone(raw: string): string {
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("1") && digits.length === 11) return `+${digits}`;
    if (digits.length === 10) return `+1${digits}`;
    return `+${digits}`;
}

/**
 * Send WhatsApp message using the active Baileys session.
 */
export async function sendSms({ to, body }: SendSmsOptions): Promise<SmsResult> {
    try {
        const whatsapp = getWhatsAppService();
        const sent = await whatsapp.sendMessage(to, body);
        if (sent) {
            console.log(`[WhatsApp] Sent message successfully to ${to}`);
            return { success: true };
        }

        console.log("-----------------------------------------");
        console.log(`[WhatsApp Offline / Fallback]`);
        console.log(`TO: ${to}`);
        console.log(`MESSAGE: ${body}`);
        console.log("-----------------------------------------");
        return { success: false, error: "WhatsApp is not connected" };
    } catch (err: any) {
        console.error("[sendSms] WhatsApp error:", err?.message || err);
        return { success: false, error: err?.message || "Failed to send message" };
    }
}

/**
 * Send the same message to multiple recipients.
 */
export async function sendBulkSms(phones: string[], body: string): Promise<number> {
    let count = 0;
    for (const phone of phones) {
        const result = await sendSms({ to: phone, body });
        if (result.success) count++;
    }
    return count;
}
