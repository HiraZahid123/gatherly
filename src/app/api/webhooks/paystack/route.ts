import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPaystackSignature } from "@/lib/paystack";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    // Verify webhook signature
    const isValid = verifyPaystackSignature(rawBody, signature);
    if (!isValid) {
      console.error("[Paystack Webhook] Invalid signature received.");
      return NextResponse.json({ error: "Invalid Paystack signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const data = event.data;

    console.log(`[Paystack Webhook] Received event: ${eventType}, reference: ${data?.reference}`);

    switch (eventType) {
      case "charge.success": {
        const reference = data.reference;
        const transactionId = String(data.id || "");
        const orderId = data.metadata?.orderId;

        // Find the matching order
        const order = await prisma.order.findFirst({
          where: {
            OR: [
              ...(orderId ? [{ id: orderId }] : []),
              ...(reference ? [{ stripePaymentIntentId: reference }] : []),
            ],
          },
          include: { ticketTier: true, event: true },
        });

        if (!order) {
          console.warn(`[Paystack Webhook] Order not found for reference ${reference}, orderId: ${orderId}`);
          break;
        }

        if (order.status === "COMPLETED") {
          console.log(`[Paystack Webhook] Order ${order.id} is already COMPLETED.`);
          break;
        }

        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: order.id },
            data: {
              status: "COMPLETED",
              stripePaymentIntentId: reference,
              stripeChargeId: transactionId,
            },
          });

          await tx.ticketTier.update({
            where: { id: order.ticketTierId },
            data: { quantitySold: { increment: order.quantity } },
          });

          // Create or update RSVP → ACCEPTED
          const qrToken = crypto.randomUUID();
          const existing = await tx.rSVP.findFirst({
            where: {
              eventId: order.eventId,
              OR: [
                ...(order.userId ? [{ userId: order.userId }] : []),
                ...(order.guestEmail ? [{ guestEmail: order.guestEmail }] : []),
              ],
            },
          });

          if (existing) {
            await tx.rSVP.update({
              where: { id: existing.id },
              data: { status: "ACCEPTED", qrToken, orderId: order.id },
            });
          } else {
            await tx.rSVP.create({
              data: {
                eventId: order.eventId,
                userId: order.userId ?? undefined,
                guestName: order.guestName,
                guestEmail: order.guestEmail,
                status: "ACCEPTED",
                qrToken,
                orderId: order.id,
              },
            });
          }
        });

        console.log(`[Paystack Webhook] Order ${order.id} successfully completed via Paystack.`);
        break;
      }

      case "refund.processed": {
        const reference = data.transaction_reference || data.reference;
        const transactionId = String(data.transaction?.id || data.id || "");

        const order = await prisma.order.findFirst({
          where: {
            OR: [
              ...(reference ? [{ stripePaymentIntentId: reference }] : []),
              ...(transactionId ? [{ stripeChargeId: transactionId }] : []),
            ],
          },
          include: { ticketTier: true },
        });

        if (!order || order.status === "REFUNDED") break;

        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: order.id },
            data: { status: "REFUNDED" },
          });

          // Return tickets back to pool
          await tx.ticketTier.update({
            where: { id: order.ticketTierId },
            data: {
              quantitySold: {
                decrement: Math.min(order.ticketTier.quantitySold, order.quantity),
              },
            },
          });

          // Set RSVP to DECLINED
          await tx.rSVP.updateMany({
            where: { orderId: order.id },
            data: { status: "DECLINED" },
          });
        });

        console.log(`[Paystack Webhook] Order ${order.id} refunded and inventory restored.`);
        break;
      }

      default:
        // Ignore other unhandled events
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("[Paystack Webhook Error]:", err);
    return NextResponse.json({ error: err.message || "Webhook processing failed" }, { status: 500 });
  }
}
