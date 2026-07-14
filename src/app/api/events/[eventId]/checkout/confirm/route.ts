import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import crypto from "crypto";

interface Params { params: Promise<{ eventId: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { eventId } = await params;
  const { paymentIntentId } = await req.json();

  if (!paymentIntentId)
    return NextResponse.json({ error: "paymentIntentId required" }, { status: 400 });

  // Verify with Stripe
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (pi.status !== "succeeded")
    return NextResponse.json({ error: "Payment not confirmed" }, { status: 400 });

  const order = await prisma.order.findUnique({
    where: { stripePaymentIntentId: paymentIntentId },
    include: { ticketTier: true },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.eventId !== eventId)
    return NextResponse.json({ error: "Event mismatch" }, { status: 400 });

  // Idempotent: if already completed, return existing RSVP
  if (order.status === "COMPLETED") {
    const rsvp = await prisma.rSVP.findFirst({ where: { orderId: order.id } });
    return NextResponse.json({ rsvp, order });
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: { status: "COMPLETED", stripeChargeId: pi.latest_charge as string },
    });

    await tx.ticketTier.update({
      where: { id: order.ticketTierId },
      data: { quantitySold: { increment: order.quantity } },
    });

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

    const rsvp = existing
      ? await tx.rSVP.update({
          where: { id: existing.id },
          data: { status: "ACCEPTED", qrToken, orderId: order.id },
        })
      : await tx.rSVP.create({
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

    return { rsvp, order: updatedOrder };
  });

  return NextResponse.json(result);
}
