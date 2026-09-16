import { NextResponse } from "next/server";
import { getStripeConfig } from "@/lib/platformSettings";

export async function GET() {
  try {
    const { publishableKey, isLive, configured } = await getStripeConfig();
    return NextResponse.json({
      publishableKey,
      isLive,
      configured,
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to load Stripe configuration" }, { status: 500 });
  }
}
