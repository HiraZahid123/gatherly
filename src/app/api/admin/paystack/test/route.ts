import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin";
import { getPaystackConfig, isMaskedSecret } from "@/lib/platformSettings";

export async function POST(req: NextRequest) {
  try {
    await verifyAdmin();
    const body = await req.json().catch(() => ({}));

    let keyToTest = body.secretKey?.trim();
    if (!keyToTest || isMaskedSecret(keyToTest)) {
      const config = await getPaystackConfig();
      keyToTest = config.secretKey;
    }

    if (!keyToTest) {
      return NextResponse.json(
        {
          success: false,
          error: "No Paystack Secret Key found. Please enter your secret key (sk_test_... or sk_live_...).",
        },
        { status: 400 }
      );
    }

    // Call Paystack Balance API to verify credentials
    const res = await fetch("https://api.paystack.co/balance", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${keyToTest}`,
        "Content-Type": "application/json",
      },
    });

    const json = await res.json();
    if (!json.status) {
      return NextResponse.json(
        {
          success: false,
          error: json.message || "Failed to authenticate with Paystack. Check your secret key.",
        },
        { status: 400 }
      );
    }

    const isLive = keyToTest.startsWith("sk_live_");
    const balances = json.data || [];
    const ngnBalance = balances.find((b: any) => b.currency === "NGN")?.balance || 0;
    const formattedNgn = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(ngnBalance / 100);

    return NextResponse.json({
      success: true,
      livemode: isLive,
      message: `Successfully connected to Paystack in ${isLive ? "LIVE" : "TEST"} mode! Available balance: ${formattedNgn}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to connect to Paystack.",
      },
      { status: 500 }
    );
  }
}
