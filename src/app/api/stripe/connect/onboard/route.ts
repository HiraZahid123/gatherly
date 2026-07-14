import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    let stripeAccount = await prisma.stripeAccount.findUnique({ where: { userId } });

    if (!stripeAccount) {
      const account = await stripe.accounts.create({ type: "express" });
      stripeAccount = await prisma.stripeAccount.create({
        data: { userId, stripeAccountId: account.id },
      });
    }

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccount.stripeAccountId,
      refresh_url: `${baseUrl}/dashboard/stripe/refresh`,
      return_url: `${baseUrl}/dashboard/stripe/return`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error: any) {
    console.error("[stripe/connect/onboard]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
