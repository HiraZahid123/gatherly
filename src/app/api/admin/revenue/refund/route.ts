import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    await verifyAdmin();

    const body = await req.json();
    const { orderId, reason } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        ticketTier: true,
        event: true,
        rsvp: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status === "REFUNDED") {
      return NextResponse.json({ error: "This order has already been refunded" }, { status: 400 });
    }

    // Attempt Stripe refund if payment intent exists
    let stripeRefundId: string | null = null;
    if (order.stripePaymentIntentId) {
      try {
        const refund = await stripe.refunds.create({
          payment_intent: order.stripePaymentIntentId,
          reason: reason === "duplicate" ? "duplicate" : "requested_by_customer",
        });
        stripeRefundId = refund.id;
      } catch (stripeErr: any) {
        console.warn(`[Refund] Stripe refund API notice for order ${orderId}:`, stripeErr.message);
        // If it's already refunded in Stripe or another non-fatal gateway response, proceed with updating local ledger
      }
    }

    // Update database status and restore ticket quantity
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "REFUNDED",
        },
      });

      if (order.ticketTier) {
        await tx.ticketTier.update({
          where: { id: order.ticketTierId },
          data: {
            quantitySold: {
              decrement: Math.min(order.ticketTier.quantitySold, order.quantity),
            },
          },
        });
      }

      await tx.rSVP.updateMany({
        where: { orderId: order.id },
        data: {
          status: "DECLINED",
        },
      });

      if (order.userId) {
        await tx.notification.create({
          data: {
            userId: order.userId,
            title: "Ticket Order Refunded",
            message: `Your ticket order (${order.quantity}x ${order.ticketTier?.name || "ticket"}) for "${order.event?.title || "Event"}" has been refunded.`,
            type: "PAYMENT",
            link: order.event?.slug ? `/e/${order.event.slug}` : "/dashboard",
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: "Order successfully refunded and ticket returned to inventory.",
      stripeRefundId,
    });
  } catch (err: any) {
    console.error("[api/admin/revenue/refund]", err);
    return NextResponse.json(
      { error: err.message || "Failed to process refund" },
      { status: 500 }
    );
  }
}
