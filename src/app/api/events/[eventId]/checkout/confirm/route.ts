import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPaystackTransaction } from "@/lib/paystack";
import crypto from "crypto";

interface Params { params: Promise<{ eventId: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { eventId } = await params;
  const body = await req.json();
  const { reference, paymentIntentId } = body;

  const effectiveRef = reference || paymentIntentId;
  if (!effectiveRef) {
    return NextResponse.json({ error: "Transaction reference is required" }, { status: 400 });
  }

  try {
    const verifyRes = await verifyPaystackTransaction(effectiveRef);
    if (verifyRes.data.status === "success") {
      const order = await prisma.order.findFirst({
        where: {
          OR: [
            { stripePaymentIntentId: effectiveRef },
            ...(verifyRes.data.metadata?.orderId ? [{ id: verifyRes.data.metadata.orderId }] : []),
          ],
        },
        include: { ticketTier: true },
      });

      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      if (order.eventId !== eventId) {
        return NextResponse.json({ error: "Event mismatch" }, { status: 400 });
      }

      // Idempotent: if already completed, return existing RSVP
      if (order.status === "COMPLETED") {
        const rsvp = await prisma.rSVP.findFirst({ where: { orderId: order.id } });
        return NextResponse.json({ rsvp, order });
      }

      const result = await prisma.$transaction(async (tx) => {
        const updatedOrder = await tx.order.update({
          where: { id: order.id },
          data: {
            status: "COMPLETED",
            stripePaymentIntentId: effectiveRef,
            stripeChargeId: String(verifyRes.data.id),
          },
          include: { ticketTier: true },
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
              data: {
                status: "ACCEPTED",
                qrToken: existing.qrToken || qrToken,
                orderId: order.id,
                guestName: existing.guestName || order.guestName,
                guestEmail: existing.guestEmail || order.guestEmail,
              },
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
    } else {
      return NextResponse.json(
        { error: verifyRes.data.gateway_response || "Payment verification failed" },
        { status: 400 }
      );
    }
  } catch (paystackErr: any) {
    console.error("[Checkout Confirm] Paystack verification error:", paystackErr?.message);
    return NextResponse.json(
      { error: paystackErr.message || "Failed to confirm payment with Paystack" },
      { status: 400 }
    );
  }
}
