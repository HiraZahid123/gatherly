/**
 * WhatsApp messaging utility — MOCKED for testing.
 * Prevents server crashes on Hostinger and avoids unofficial phone linking.
 */

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
 * MOCKED: Simply logs the message to the console.
 * This allows the verification flow to work without needing a real WhatsApp connection.
 */
export async function sendSms({ to, body }: SendSmsOptions): Promise<SmsResult> {
    try {
        console.log("-----------------------------------------");
        console.log(`[MOCK VERIFICATION]`);
        console.log(`TO: ${to}`);
        console.log(`MESSAGE: ${body}`);
        console.log("-----------------------------------------");
        
        // Always return success for testing
        return { success: true };
    } catch (err: any) {
        console.error("[Mock/sendSms] Error:", err.message);
        return { success: false, error: err.message };
    }
}

/**
 * MOCKED: Send the same message to multiple recipients.
 */
export async function sendBulkSms(phones: string[], body: string): Promise<number> {
    let count = 0;
    for (const phone of phones) {
        const result = await sendSms({ to: phone, body });
        if (result.success) count++;
    }
    return count;
}
