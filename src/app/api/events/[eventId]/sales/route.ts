import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { calculatePlatformFee } from "@/lib/platformSettings";
import { getPayoutsForEvent } from "@/lib/payouts";

interface Params { params: Promise<{ eventId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { eventId } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.hostId !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [allOrders, recentOrders, tiers, tierStats, totals, stripeAccount, payouts] = await Promise.all([
    prisma.order.findMany({
      where: { eventId, status: "COMPLETED" },
      select: { totalAmount: true, quantity: true },
    }),
    prisma.order.findMany({
      where: { eventId, status: "COMPLETED" },
      include: { ticketTier: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.ticketTier.findMany({ where: { eventId }, orderBy: { sortOrder: "asc" } }),
    prisma.order.groupBy({
      by: ["ticketTierId"],
      where: { eventId, status: "COMPLETED" },
      _sum: { quantity: true, totalAmount: true },
    }),
    prisma.order.aggregate({
      where: { eventId, status: "COMPLETED" },
      _sum: { quantity: true, totalAmount: true },
    }),
    prisma.stripeAccount.findUnique({ where: { userId: session.user.id } }),
    getPayoutsForEvent(eventId),
  ]);

  const totalRevenue = totals._sum.totalAmount ?? 0;
  const totalTicketsSold = totals._sum.quantity ?? 0;

  // Calculate platform fee and net creator share
  let totalPlatformFee = 0;
  for (const ord of allOrders) {
    const { platformFee } = await calculatePlatformFee(ord.totalAmount, ord.quantity);
    totalPlatformFee += platformFee;
  }
  const netEarnings = Math.max(0, totalRevenue - totalPlatformFee);

  // Manual / recorded payouts
  const totalPaidOut = payouts.reduce((sum, p) => sum + p.amount, 0);
  const balanceDue = Math.max(0, netEarnings - totalPaidOut);

  const statsMap = new Map(tierStats.map(s => [s.ticketTierId, s._sum]));
  const byTier = tiers.map((tier) => {
    const s = statsMap.get(tier.id);
    return {
      id: tier.id,
      name: tier.name,
      price: tier.price,
      currency: tier.currency,
      quantity: tier.quantity,
      sold: s?.quantity ?? 0,
      revenue: s?.totalAmount ?? 0,
    };
  });

  // Fetch pending balance from Stripe if connected
  let stripeBalance = null;
  if (stripeAccount?.chargesEnabled) {
    try {
      const balance = await stripe.balance.retrieve(undefined, {
        stripeAccount: stripeAccount.stripeAccountId,
      });
      stripeBalance = {
        available: balance.available.reduce((s, b) => s + b.amount, 0),
        pending: balance.pending.reduce((s, b) => s + b.amount, 0),
        currency: balance.available[0]?.currency ?? "ngn",
      };
    } catch (_) {}
  }

  return NextResponse.json({
    totalRevenue,
    platformFee: totalPlatformFee,
    netEarnings,
    totalPaidOut,
    balanceDue,
    payoutHistory: payouts,
    hasStripeConnected: Boolean(stripeAccount?.chargesEnabled),
    totalTicketsSold,
    byTier,
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      guestName: o.guestName,
      guestEmail: o.guestEmail,
      tierName: o.ticketTier.name,
      quantity: o.quantity,
      totalAmount: o.totalAmount,
      currency: o.currency,
      createdAt: o.createdAt,
    })),
    stripeAccount: stripeAccount
      ? {
          chargesEnabled: stripeAccount.chargesEnabled,
          payoutsEnabled: stripeAccount.payoutsEnabled,
          stripeAccountId: stripeAccount.stripeAccountId,
        }
      : null,
    stripeBalance,
  });
}

