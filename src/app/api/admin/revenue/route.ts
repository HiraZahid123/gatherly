import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { calculatePlatformFee } from "@/lib/platformSettings";
import { getAllPayouts, EventPayoutRecord } from "@/lib/payouts";

export async function GET(req: NextRequest) {
  try {
    await verifyAdmin();

    // Fetch all completed and refunded orders with related event, host, and tier
    const orders = await prisma.order.findMany({
      where: {
        status: { in: ["COMPLETED", "REFUNDED"] },
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
          status: order.status,
          guestName: order.guestName || order.user?.name || "Anonymous Guest",
          guestEmail: order.guestEmail || order.user?.email || "N/A",
          quantity: order.quantity,
          unitPrice: order.unitPrice,
          totalAmount: order.totalAmount, // in kobo
          platformFee,
          hostPayout,
          feeDetails: details,
          currency: order.currency || "ngn",
          reference: order.stripePaymentIntentId,
          transactionId: order.stripeChargeId,
          createdAt: order.createdAt,
          eventId: order.eventId,
          eventTitle: order.event?.title || "Unknown Event",
          eventSlug: order.event?.slug,
          hostId: order.event?.hostId,
          hostName: order.event?.host?.name || "Unknown Host",
          hostEmail: order.event?.host?.email || "N/A",
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
      totalTicketsSold: number;
      orderCount: number;
      grossRevenue: number;
      refundedAmount: number;
      refundedOrderCount: number;
      refundedTickets: number;
      platformFeeTotal: number;
      hostNetPayout: number;
      currency: string;
      lastOrderAt?: Date;
    }>();

    for (const order of processedOrders) {
      const existing = eventMap.get(order.eventId);
      if (existing) {
        if (order.status === "REFUNDED") {
          existing.refundedAmount += order.totalAmount;
          existing.refundedOrderCount += 1;
          existing.refundedTickets += order.quantity;
        } else {
          existing.totalTicketsSold += order.quantity;
          existing.orderCount += 1;
          existing.grossRevenue += order.totalAmount;
          existing.platformFeeTotal += order.platformFee;
          existing.hostNetPayout += order.hostPayout;
        }
      } else {
        const isRefunded = order.status === "REFUNDED";
        eventMap.set(order.eventId, {
          eventId: order.eventId,
          eventTitle: order.eventTitle,
          eventSlug: order.eventSlug,
          startDate: order.eventSlug ? undefined : null,
          hostId: order.hostId,
          hostName: order.hostName,
          hostEmail: order.hostEmail,
          totalTicketsSold: isRefunded ? 0 : order.quantity,
          orderCount: isRefunded ? 0 : 1,
          grossRevenue: isRefunded ? 0 : order.totalAmount,
          refundedAmount: isRefunded ? order.totalAmount : 0,
          refundedOrderCount: isRefunded ? 1 : 0,
          refundedTickets: isRefunded ? order.quantity : 0,
          platformFeeTotal: isRefunded ? 0 : order.platformFee,
          hostNetPayout: isRefunded ? 0 : order.hostPayout,
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

        let payoutStatus: "SETTLED" | "PARTIAL" | "PENDING" = "PENDING";
        if (totalPaidOut >= event.hostNetPayout && event.hostNetPayout > 0) {
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
    let totalRefundedAmount = 0;
    let totalRefundedCount = 0;
    let totalRefundedTickets = 0;
    let totalPlatformCommission = 0;
    let totalHostPayouts = 0;
    let totalTicketsSold = 0;
    let totalCompletedOrders = 0;
    let totalManualPayoutsSettled = 0;
    let totalPendingSettlement = 0;

    for (const item of processedOrders) {
      if (item.status === "REFUNDED") {
        totalRefundedAmount += item.totalAmount;
        totalRefundedCount += 1;
        totalRefundedTickets += item.quantity;
      } else {
        totalGrossRevenue += item.totalAmount;
        totalPlatformCommission += item.platformFee;
        totalHostPayouts += item.hostPayout;
        totalTicketsSold += item.quantity;
        totalCompletedOrders += 1;
      }
    }

    for (const ev of eventsSummary) {
      totalManualPayoutsSettled += ev.totalPaidOut;
      totalPendingSettlement += ev.balanceDue;
    }

    const netGrossRevenue = Math.max(0, totalGrossRevenue - totalRefundedAmount);

    return NextResponse.json({
      success: true,
      kpis: {
        totalGrossRevenue, // in kobo
        totalRefundedAmount,
        totalRefundedCount,
        totalRefundedTickets,
        netGrossRevenue,
        totalPlatformCommission,
        totalHostPayouts,
        totalTicketsSold,
        totalCompletedOrders,
        totalSettledPayouts: totalManualPayoutsSettled,
        totalPendingPayouts: totalPendingSettlement,
      },
      events: eventsSummary,
      recentOrders: processedOrders.slice(0, 50),
      payoutHistory: allPayouts,
    });
  } catch (err: any) {
    console.error("[api/admin/revenue]", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch revenue analytics" },
      { status: 500 }
    );
  }
}
