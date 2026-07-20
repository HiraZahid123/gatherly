import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";


export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
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
  }

  return NextResponse.json({ received: true });
}
