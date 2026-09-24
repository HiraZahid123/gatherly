import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { createPaystackRefund } from "@/lib/paystack";

export async function POST(req: NextRequest) {
  try {
    await verifyAdmin();

    const body = await req.json();
    const { orderId, reason, action } = body;

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

    // Action: REJECT refund request from creator
    if (action === "REJECT") {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          refundRequested: false,
        },
      });

      if (order.event?.hostId) {
        await prisma.notification.create({
          data: {
            userId: order.event.hostId,
            title: "Refund Request Declined",
            message: `Your refund request for order #${order.id.slice(-8).toUpperCase()} (${order.guestName || "Guest"}) was declined by platform administration.${reason ? ` Note: ${reason}` : ""}`,
            type: "PAYMENT",
            link: `/dashboard`,
          },
        }).catch(() => {});
      }

      return NextResponse.json({
        success: true,
        message: "Refund request has been dismissed.",
      });
    }

    if (order.status === "REFUNDED") {
      return NextResponse.json({ error: "This order has already been refunded" }, { status: 400 });
    }

    // Attempt Paystack gateway refund
    let refundGatewayId: string | null = null;
    const ref = order.stripePaymentIntentId || order.stripeChargeId;

    if (ref) {
      try {
        const refundRes = await createPaystackRefund({
          transaction: ref,
          merchantNote: reason || order.refundReason || "Refund requested by administrator",
        });
        refundGatewayId = String(refundRes.data?.id || "");
      } catch (paystackErr: any) {
        console.warn(`[Refund] Paystack refund API notice for order ${orderId}:`, paystackErr.message);
      }
    }

    // Update database status and restore ticket quantity
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "REFUNDED",
          refundRequested: false,
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
      refundGatewayId,
    });
  } catch (err: any) {
    console.error("[api/admin/revenue/refund]", err);
    return NextResponse.json(
      { error: err.message || "Failed to process refund" },
      { status: 500 }
    );
  }
}
