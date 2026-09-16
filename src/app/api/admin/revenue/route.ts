import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { calculatePlatformFee } from "@/lib/platformSettings";
import { getAllPayouts, EventPayoutRecord } from "@/lib/payouts";

export async function GET(req: NextRequest) {
  try {
    await verifyAdmin();

    // Fetch all completed orders with related event, host, and tier
    const orders = await prisma.order.findMany({
      where: {
        status: "COMPLETED",
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            startDate: true,
            hostId: true,
            host: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                stripeAccount: {
                  select: {
                    stripeAccountId: true,
                    chargesEnabled: true,
                    payoutsEnabled: true,
                  },
                },
              },
            },
          },
        },
        ticketTier: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Compute platform fee and host payout for each order
    const processedOrders = await Promise.all(
      orders.map(async (order) => {
        const { platformFee, details } = await calculatePlatformFee(order.totalAmount, order.quantity);
        const hostPayout = Math.max(0, order.totalAmount - platformFee);

        return {
          id: order.id,
          orderNumber: order.id.slice(-8).toUpperCase(),
          guestName: order.guestName || order.user?.name || "Anonymous Guest",
          guestEmail: order.guestEmail || order.user?.email || "N/A",
          quantity: order.quantity,
          unitPrice: order.unitPrice,
          totalAmount: order.totalAmount, // in kobo/cents
          platformFee,
          hostPayout,
          feeDetails: details,
          currency: order.currency || "ngn",
          stripePaymentIntentId: order.stripePaymentIntentId,
          stripeChargeId: order.stripeChargeId,
          createdAt: order.createdAt,
          eventId: order.eventId,
          eventTitle: order.event?.title || "Unknown Event",
          eventSlug: order.event?.slug,
          hostId: order.event?.hostId,
          hostName: order.event?.host?.name || "Unknown Host",
          hostEmail: order.event?.host?.email || "N/A",
          hostHasStripe: Boolean(order.event?.host?.stripeAccount?.chargesEnabled),
          hostStripeAccountId: order.event?.host?.stripeAccount?.stripeAccountId || null,
          tierName: order.ticketTier?.name || "Standard",
        };
      })
    );

    // Group and aggregate by event
    const eventMap = new Map<string, {
      eventId: string;
      eventTitle: string;
      eventSlug?: string;
      startDate?: Date | null;
      hostId?: string;
      hostName: string;
      hostEmail: string;
      hostImage?: string | null;
      hostHasStripe: boolean;
      hostStripeAccountId?: string | null;
      totalTicketsSold: number;
      orderCount: number;
      grossRevenue: number;
      platformFeeTotal: number;
      hostNetPayout: number;
      currency: string;
      lastOrderAt: Date;
    }>();

    for (const order of processedOrders) {
      const existing = eventMap.get(order.eventId);
      if (existing) {
        existing.totalTicketsSold += order.quantity;
        existing.orderCount += 1;
        existing.grossRevenue += order.totalAmount;
        existing.platformFeeTotal += order.platformFee;
        existing.hostNetPayout += order.hostPayout;
        if (new Date(order.createdAt) > new Date(existing.lastOrderAt)) {
          existing.lastOrderAt = order.createdAt;
        }
      } else {
        eventMap.set(order.eventId, {
          eventId: order.eventId,
          eventTitle: order.eventTitle,
          eventSlug: order.eventSlug,
          startDate: orders.find((o) => o.eventId === order.eventId)?.event?.startDate,
          hostId: order.hostId,
          hostName: order.hostName,
          hostEmail: order.hostEmail,
          hostImage: orders.find((o) => o.eventId === order.eventId)?.event?.host?.image,
          hostHasStripe: order.hostHasStripe,
          hostStripeAccountId: order.hostStripeAccountId,
          totalTicketsSold: order.quantity,
          orderCount: 1,
          grossRevenue: order.totalAmount,
          platformFeeTotal: order.platformFee,
          hostNetPayout: order.hostPayout,
          currency: order.currency,
          lastOrderAt: order.createdAt,
        });
      }
    }

    const allPayouts = await getAllPayouts();

    const eventsSummary = Array.from(eventMap.values())
      .map((event) => {
        const eventPayouts = allPayouts.filter((p) => p.eventId === event.eventId);
        const totalPaidOut = eventPayouts.reduce((sum, p) => sum + p.amount, 0);
        const balanceDue = Math.max(0, event.hostNetPayout - totalPaidOut);

        let payoutStatus: "STRIPE_AUTO" | "SETTLED" | "PARTIAL" | "PENDING" = "PENDING";
        if (event.hostHasStripe) {
          payoutStatus = "STRIPE_AUTO";
        } else if (totalPaidOut >= event.hostNetPayout && event.hostNetPayout > 0) {
          payoutStatus = "SETTLED";
        } else if (totalPaidOut > 0) {
          payoutStatus = "PARTIAL";
        } else {
          payoutStatus = "PENDING";
        }

        return {
          ...event,
          totalPaidOut,
          balanceDue,
          payoutStatus,
          payoutHistory: eventPayouts,
        };
      })
      .sort((a, b) => b.grossRevenue - a.grossRevenue);

    // Overall global KPIs
    let totalGrossRevenue = 0;
    let totalPlatformCommission = 0;
    let totalHostPayouts = 0;
    let totalTicketsSold = 0;
    let totalManualPayoutsSettled = 0;
    let totalPendingSettlement = 0;

    for (const item of processedOrders) {
      totalGrossRevenue += item.totalAmount;
      totalPlatformCommission += item.platformFee;
      totalHostPayouts += item.hostPayout;
      totalTicketsSold += item.quantity;
    }

    for (const ev of eventsSummary) {
      if (!ev.hostHasStripe) {
        totalManualPayoutsSettled += ev.totalPaidOut;
        totalPendingSettlement += ev.balanceDue;
      }
    }

    return NextResponse.json({
      success: true,
      kpis: {
        totalGrossRevenue, // in cents/kobo
        totalPlatformCommission,
        totalHostPayouts,
        totalTicketsSold,
        totalOrders: processedOrders.length,
        totalPaidEvents: eventsSummary.length,
        totalManualPayoutsSettled,
        totalPendingSettlement,
      },
      events: eventsSummary,
      recentOrders: processedOrders.slice(0, 100),
    });
  } catch (err: any) {
    console.error("[api/admin/revenue]", err);
    return NextResponse.json(
      { error: err.message || "Failed to load revenue and payouts report" },
      { status: 500 }
    );
  }
}
