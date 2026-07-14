/**
 * Utility to verify Cloudflare Turnstile tokens
 */
export async function verifyTurnstileToken(token: string) {
    const secretKey = process.env.TURNSTILE_SECRET_KEY;

    // Skip verification if secret key is missing (for local dev dev/testing)
    if (!secretKey || secretKey === "1x0000000000000000000000000000000AA") {
        console.warn("Turnstile secret key missing or set to dummy. Skipping verification.");
        return { success: true };
    }

    try {
        const formData = new FormData();
        formData.append("secret", secretKey);
        formData.append("response", token);

        const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            method: "POST",
            body: formData,
        });

        const outcome = await result.json();
        return {
            success: outcome.success,
            error: outcome["error-codes"]?.[0] || "Verification failed"
        };
    } catch (error) {
        console.error("Turnstile verification error:", error);
        return { success: false, error: "Service unavailable" };
    }
}
