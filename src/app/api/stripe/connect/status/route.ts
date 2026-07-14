import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stripeAccount = await prisma.stripeAccount.findUnique({
      where: { userId: session.user.id },
    });

    if (!stripeAccount) {
      return NextResponse.json({ connected: false });
    }

    // Sync live status from Stripe
    let account;
    try {
      account = await stripe.accounts.retrieve(stripeAccount.stripeAccountId);
    } catch (err: any) {
      // If resource is missing (e.g. host reset their Stripe test data)
      if (err.statusCode === 404 || err.code === 'resource_missing' || err.message?.includes('does not have access to')) {
        await prisma.stripeAccount.delete({
          where: { userId: session.user.id }
        });
        return NextResponse.json({ connected: false });
      }
      throw err;
    }

    const updated = await prisma.stripeAccount.update({
      where: { userId: session.user.id },
      data: {
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
      },
    });

    return NextResponse.json({
      connected: true,
      chargesEnabled: updated.chargesEnabled,
      payoutsEnabled: updated.payoutsEnabled,
      detailsSubmitted: updated.detailsSubmitted,
      stripeAccountId: updated.stripeAccountId,
    });
  } catch (error: any) {
    console.error("[stripe/connect/status]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
