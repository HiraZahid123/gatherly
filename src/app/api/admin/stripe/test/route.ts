import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin";
import { getStripeConfig, isMaskedSecret } from "@/lib/platformSettings";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  try {
    await verifyAdmin();
    const body = await req.json().catch(() => ({}));
    
    // Use candidate key if provided and not masked, otherwise test current configured key
    let keyToTest = body.secretKey?.trim();
    if (!keyToTest || isMaskedSecret(keyToTest)) {
      const config = await getStripeConfig();
      keyToTest = config.secretKey;
    }

    if (!keyToTest) {
      return NextResponse.json({
        success: false,
        error: "No Stripe Secret Key found. Please enter a secret key (sk_test_... or sk_live_...) first."
      }, { status: 400 });
    }

    const testClient = new Stripe(keyToTest, { apiVersion: "2026-04-22.dahlia" });
    
    // Retrieve account balance to verify credentials
    const balance = await testClient.balance.retrieve();
    
    return NextResponse.json({
      success: true,
      livemode: balance.livemode,
      currencies: balance.available.map((b) => b.currency.toUpperCase()),
      message: `Successfully connected to Stripe in ${balance.livemode ? "LIVE" : "TEST"} mode!`,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.raw?.message || err.message || "Failed to authenticate with Stripe. Check your secret key.",
    }, { status: 400 });
  }
}
