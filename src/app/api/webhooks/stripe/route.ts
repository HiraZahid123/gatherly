import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { getStripeConfig } from "@/lib/platformSettings";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  const { webhookSecret } = await getStripeConfig();
  const effectiveWebhookSecret = webhookSecret || process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !effectiveWebhookSecret) {
    return NextResponse.json({ error: "Missing signature or webhook secret not configured" }, { status: 400 });
  }

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(body, sig, effectiveWebhookSecret);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object as any;
      const order = await prisma.order.findUnique({
        where: { stripePaymentIntentId: pi.id },
        include: { ticketTier: true, event: true },
      });

      if (!order || order.status === "COMPLETED") break;

      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: "COMPLETED",
            stripeChargeId: pi.latest_charge,
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
      break;
    }

    case "payment_intent.payment_failed": {
      const pi = event.data.object as any;
      await prisma.order.updateMany({
        where: { stripePaymentIntentId: pi.id },
        data: { status: "FAILED" },
      });
      break;
    }

    case "account.updated": {
      const account = event.data.object as any;
      await prisma.stripeAccount.updateMany({
        where: { stripeAccountId: account.id },
        data: {
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted,
        },
      });
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object as any;
      const paymentIntentId = charge.payment_intent;
      const order = await prisma.order.findFirst({
        where: {
          OR: [
            ...(paymentIntentId ? [{ stripePaymentIntentId: paymentIntentId }] : []),
            { stripeChargeId: charge.id },
          ],
        },
        include: { ticketTier: true, event: true },
      });

      if (!order || order.status === "REFUNDED") break;

      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: { status: "REFUNDED" },
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
          data: { status: "DECLINED" },
        });

        if (order.userId) {
          await tx.notification.create({
            data: {
              userId: order.userId,
              title: "Ticket Order Refunded",
              message: `Your ticket purchase for ${order.event?.title || "your event"} has been refunded.`,
              type: "PAYMENT",
              link: order.event?.slug ? `/e/${order.event.slug}` : "/dashboard",
            },
          });
        }
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
