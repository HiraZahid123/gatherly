import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";
import { 
    getCommissionSettings, 
    saveCommissionSettings, 
    CommissionType,
    maskSecret,
    isMaskedSecret,
    validatePaystackKeyFormat
} from "@/lib/platformSettings";

export async function GET() {
    try {
        await verifyAdmin();
        const settings = await getCommissionSettings();

        const activePaystackPublic = settings.paystackPublicKey || process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";
        const activePaystackSecret = settings.paystackSecretKey || process.env.PAYSTACK_SECRET_KEY || "";

        const maskedSettings = {
            ...settings,
            paystackPublicKey: settings.paystackPublicKey || (process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ? process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY : ""),
            paystackSecretKey: maskSecret(settings.paystackSecretKey || process.env.PAYSTACK_SECRET_KEY || ""),
            isPaystackConfigured: Boolean(activePaystackPublic && activePaystackSecret),
            isPaystackLive: activePaystackPublic.startsWith("pk_live_") || activePaystackSecret.startsWith("sk_live_"),
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

        // Validate Paystack Keys if provided
        if (body.paystackPublicKey !== undefined && body.paystackPublicKey.trim() !== "") {
            const val = validatePaystackKeyFormat("public", body.paystackPublicKey);
            if (!val.valid) {
                return NextResponse.json({ error: val.error }, { status: 400 });
            }
        }

        if (body.paystackSecretKey !== undefined && body.paystackSecretKey.trim() !== "" && !isMaskedSecret(body.paystackSecretKey)) {
            const val = validatePaystackKeyFormat("secret", body.paystackSecretKey);
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
                paystackPublicKey: body.paystackPublicKey,
                paystackSecretKey: body.paystackSecretKey,
                clearPaystackKeys: Boolean(body.clearPaystackKeys),
            },
            adminIdentifier
        );

        const activePaystackPublic = updated.paystackPublicKey || process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";
        const activePaystackSecret = updated.paystackSecretKey || process.env.PAYSTACK_SECRET_KEY || "";

        const maskedUpdated = {
            ...updated,
            paystackPublicKey: updated.paystackPublicKey || (process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ? process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY : ""),
            paystackSecretKey: maskSecret(updated.paystackSecretKey || process.env.PAYSTACK_SECRET_KEY || ""),
            isPaystackConfigured: Boolean(activePaystackPublic && activePaystackSecret),
            isPaystackLive: activePaystackPublic.startsWith("pk_live_") || activePaystackSecret.startsWith("sk_live_"),
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
