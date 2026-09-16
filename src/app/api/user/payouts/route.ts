import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculatePlatformFee } from "@/lib/platformSettings";
import { getAllPayouts } from "@/lib/payouts";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch user's events
    const events = await prisma.event.findMany({
      where: {
        hostId: userId,
        isPaid: true,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        startDate: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const eventIds = events.map((e) => e.id);

    // Fetch all completed orders for this creator's events
    const orders = await prisma.order.findMany({
      where: {
        eventId: { in: eventIds },
        status: "COMPLETED",
      },
      select: {
        id: true,
        eventId: true,
        quantity: true,
        totalAmount: true,
        currency: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Check user's Stripe Account status
    const stripeAccount = await prisma.stripeAccount.findUnique({
      where: { userId },
      select: {
        chargesEnabled: true,
        payoutsEnabled: true,
        stripeAccountId: true,
      },
    });

    // Fetch payouts recorded
    const allPayouts = await getAllPayouts();
    const userPayouts = allPayouts.filter((p) => eventIds.includes(p.eventId));

    // Calculate per-event metrics
    const eventsSummary = await Promise.all(
      events.map(async (event) => {
        const eventOrders = orders.filter((o) => o.eventId === event.id);
        const eventPayouts = userPayouts.filter((p) => p.eventId === event.id);

        let grossRevenue = 0;
        let platformFeeTotal = 0;
        let ticketsSold = 0;

        for (const ord of eventOrders) {
          grossRevenue += ord.totalAmount;
          ticketsSold += ord.quantity;
          const { platformFee } = await calculatePlatformFee(ord.totalAmount, ord.quantity);
          platformFeeTotal += platformFee;
        }

        const netEarnings = Math.max(0, grossRevenue - platformFeeTotal);
        const totalPaidOut = eventPayouts.reduce((sum, p) => sum + p.amount, 0);
        const balanceDue = Math.max(0, netEarnings - totalPaidOut);

        const isStripeAuto = Boolean(stripeAccount?.chargesEnabled);
        let status: "STRIPE_AUTO" | "FULLY_PAID" | "PARTIAL" | "PENDING" = "PENDING";
        if (isStripeAuto) {
          status = "STRIPE_AUTO";
        } else if (totalPaidOut >= netEarnings && netEarnings > 0) {
          status = "FULLY_PAID";
        } else if (totalPaidOut > 0) {
          status = "PARTIAL";
        } else {
          status = "PENDING";
        }

        return {
          eventId: event.id,
          eventTitle: event.title,
          eventSlug: event.slug,
          startDate: event.startDate,
          ticketsSold,
          orderCount: eventOrders.length,
          grossRevenue,
          platformFee: platformFeeTotal,
          netEarnings,
          totalPaidOut,
          balanceDue,
          status,
          currency: eventOrders[0]?.currency || "ngn",
          payoutHistory: eventPayouts,
        };
      })
    );

    // Calculate creator's grand totals
    let totalGrossRevenue = 0;
    let totalPlatformFees = 0;
    let totalNetEarnings = 0;
    let totalPaidToUser = 0;
    let totalRemainingDue = 0;
    let totalTicketsSold = 0;

    for (const ev of eventsSummary) {
      totalGrossRevenue += ev.grossRevenue;
      totalPlatformFees += ev.platformFee;
      totalNetEarnings += ev.netEarnings;
      totalTicketsSold += ev.ticketsSold;
      if (!stripeAccount?.chargesEnabled) {
        totalPaidToUser += ev.totalPaidOut;
        totalRemainingDue += ev.balanceDue;
      }
    }

    return NextResponse.json({
      success: true,
      hasStripeConnect: Boolean(stripeAccount?.chargesEnabled),
      totals: {
        totalGrossRevenue,
        totalPlatformFees,
        totalNetEarnings,
        totalPaidToUser,
        totalRemainingDue,
        totalTicketsSold,
      },
      events: eventsSummary,
      payoutHistory: userPayouts,
    });
  } catch (err: any) {
    console.error("[api/user/payouts]", err);
    return NextResponse.json(
      { error: err.message || "Failed to load user payouts" },
      { status: 500 }
    );
  }
}
