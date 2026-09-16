import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";
import { 
    getCommissionSettings, 
    saveCommissionSettings, 
    CommissionType,
    maskSecret,
    isMaskedSecret,
    validateStripeKeyFormat
} from "@/lib/platformSettings";

export async function GET() {
    try {
        await verifyAdmin();
        const settings = await getCommissionSettings();

        // Check active keys including env fallbacks
        const activePublishable = settings.stripePublishableKey || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
        const activeSecret = settings.stripeSecretKey || process.env.STRIPE_SECRET_KEY || "";
        const activeWebhook = settings.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET || "";

        const maskedSettings = {
            ...settings,
            stripePublishableKey: settings.stripePublishableKey || (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY : ""),
            stripeSecretKey: maskSecret(settings.stripeSecretKey || process.env.STRIPE_SECRET_KEY || ""),
            stripeWebhookSecret: maskSecret(settings.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET || ""),
            hasCustomKeys: Boolean(settings.stripePublishableKey || settings.stripeSecretKey),
            hasEnvKeys: Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_SECRET_KEY),
            isConfigured: Boolean(activePublishable && activeSecret),
            isLive: activePublishable.startsWith("pk_live_") || activeSecret.startsWith("sk_live_"),
        };

        return NextResponse.json({ success: true, settings: maskedSettings });
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || "Unauthorized access" },
            { status: 401 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        await verifyAdmin();
        const session = await auth();
        const body = await req.json();

        // Validate commissionType
        const validTypes: CommissionType[] = ["PERCENTAGE", "FIXED", "BOTH"];
        if (body.commissionType && !validTypes.includes(body.commissionType)) {
            return NextResponse.json(
                { error: "Invalid commission type. Must be 'PERCENTAGE', 'FIXED', or 'BOTH'." },
                { status: 400 }
            );
        }

        // Validate percentageRate
        if (body.percentageRate !== undefined) {
            const rate = Number(body.percentageRate);
            if (isNaN(rate) || rate < 0 || rate > 50) {
                return NextResponse.json(
                    { error: "Percentage rate must be a valid number between 0% and 50%." },
                    { status: 400 }
                );
            }
        }

        // Validate fixedAmount
        if (body.fixedAmount !== undefined) {
            const fixed = Number(body.fixedAmount);
            if (isNaN(fixed) || fixed < 0) {
                return NextResponse.json(
                    { error: "Fixed amount must be a positive number." },
                    { status: 400 }
                );
            }
        }

        // Validate Stripe Keys if provided
        if (body.stripePublishableKey !== undefined && body.stripePublishableKey.trim() !== "") {
            const val = validateStripeKeyFormat("publishable", body.stripePublishableKey);
            if (!val.valid) {
                return NextResponse.json({ error: val.error }, { status: 400 });
            }
        }

        if (body.stripeSecretKey !== undefined && body.stripeSecretKey.trim() !== "" && !isMaskedSecret(body.stripeSecretKey)) {
            const val = validateStripeKeyFormat("secret", body.stripeSecretKey);
            if (!val.valid) {
                return NextResponse.json({ error: val.error }, { status: 400 });
            }
        }

        if (body.stripeWebhookSecret !== undefined && body.stripeWebhookSecret.trim() !== "" && !isMaskedSecret(body.stripeWebhookSecret)) {
            const val = validateStripeKeyFormat("webhook", body.stripeWebhookSecret);
            if (!val.valid) {
                return NextResponse.json({ error: val.error }, { status: 400 });
            }
        }

        const adminIdentifier = session?.user?.email || session?.user?.name || "Admin";

        const updated = await saveCommissionSettings(
            {
                commissionType: body.commissionType,
                percentageRate: body.percentageRate !== undefined ? Number(body.percentageRate) : undefined,
                fixedAmount: body.fixedAmount !== undefined ? Number(body.fixedAmount) : undefined,
                currency: body.currency || "ngn",
                payoutScheduleNote: body.payoutScheduleNote,
                stripePublishableKey: body.stripePublishableKey,
                stripeSecretKey: body.stripeSecretKey,
                stripeWebhookSecret: body.stripeWebhookSecret,
                clearStripeKeys: Boolean(body.clearStripeKeys),
            },
            adminIdentifier
        );

        const activePublishable = updated.stripePublishableKey || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
        const activeSecret = updated.stripeSecretKey || process.env.STRIPE_SECRET_KEY || "";
        const activeWebhook = updated.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET || "";

        const maskedUpdated = {
            ...updated,
            stripePublishableKey: updated.stripePublishableKey || (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY : ""),
            stripeSecretKey: maskSecret(updated.stripeSecretKey || process.env.STRIPE_SECRET_KEY || ""),
            stripeWebhookSecret: maskSecret(updated.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET || ""),
            hasCustomKeys: Boolean(updated.stripePublishableKey || updated.stripeSecretKey),
            hasEnvKeys: Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_SECRET_KEY),
            isConfigured: Boolean(activePublishable && activeSecret),
            isLive: activePublishable.startsWith("pk_live_") || activeSecret.startsWith("sk_live_"),
        };

        return NextResponse.json({
            success: true,
            message: "Platform settings updated successfully",
            settings: maskedUpdated,
        });
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || "Failed to update settings" },
            { status: 401 }
        );
    }
}

