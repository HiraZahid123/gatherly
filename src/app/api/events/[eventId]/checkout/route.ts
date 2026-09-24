import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculatePlatformFee, getPaystackConfigSync } from "@/lib/platformSettings";
import { initializePaystackTransaction } from "@/lib/paystack";
import crypto from "crypto";

interface Params { params: Promise<{ eventId: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { eventId } = await params;
  const session = await auth();

  const body = await req.json();
  const { ticketTierId, quantity = 1, guestName, guestEmail } = body;

  if (!guestName || !guestEmail)
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });

  const [event, tier] = await Promise.all([
    prisma.event.findUnique({ where: { id: eventId } }),
    prisma.ticketTier.findUnique({ where: { id: ticketTierId } }),
  ]);

  if (!event || !event.isPaid)
    return NextResponse.json({ error: "Event not found or not a paid event" }, { status: 404 });
  if (!tier || !tier.isActive)
    return NextResponse.json({ error: "Ticket tier not available" }, { status: 404 });

  const remaining = tier.quantity - tier.quantitySold;
  if (remaining < quantity)
    return NextResponse.json({ error: `Only ${remaining} ticket(s) remaining` }, { status: 400 });

  const totalAmount = tier.price * quantity; // In kobo (e.g. ₦1,000 = 100,000 kobo)
  const { platformFee, details: feeDetails } = await calculatePlatformFee(totalAmount, quantity);
  
  const currency = "ngn";
  const paystackConfig = getPaystackConfigSync();

  // Minimum amount validation (Paystack minimum is ₦50)
  const minRequiredAmount = 5000; // 5,000 kobo = ₦50
  if (totalAmount > 0 && totalAmount < minRequiredAmount) {
    const minNaira = minRequiredAmount / 100;
    return NextResponse.json(
      { error: `Minimum payment amount is ₦${minNaira.toLocaleString()}.` },
      { status: 400 }
    );
  }

  // Create order in PENDING status (or COMPLETED if free)
  const order = await prisma.order.create({
    data: {
      eventId,
      ticketTierId,
      userId: session?.user?.id ?? undefined,
      guestName,
      guestEmail,
      quantity,
      unitPrice: tier.price,
      totalAmount,
      currency,
      status: totalAmount === 0 ? "COMPLETED" : "PENDING",
    },
  });

  // FREE TICKET: Complete order and RSVP directly
  if (totalAmount === 0) {
    const qrToken = crypto.randomUUID();
    const result = await prisma.$transaction(async (tx) => {
      await tx.ticketTier.update({
        where: { id: order.ticketTierId },
        data: { quantitySold: { increment: order.quantity } },
      });

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
              userId: order.userId,
              guestName: order.guestName,
              guestEmail: order.guestEmail,
              status: "ACCEPTED",
              qrToken,
              orderId: order.id,
            },
          });

      return { order, rsvp };
    });

    return NextResponse.json({ freeOrder: true, order: result.order, rsvp: result.rsvp });
  }

  // Check Paystack configuration
  if (!paystackConfig.configured) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "FAILED" },
    });
    return NextResponse.json(
      { error: "Payment gateway is currently undergoing maintenance. Please contact support or the event host." },
      { status: 503 }
    );
  }

  // Determine host site URL for callback
  const origin = req.headers.get("origin") || req.nextUrl.origin || "https://jollywitme.com";

  // PRIMARY GATEWAY: PAYSTACK
  const reference = `JWM_${order.id.slice(-6).toUpperCase()}_${Date.now()}`;
  const callbackUrl = `${origin}/e/${event.slug}?order_id=${order.id}&reference=${reference}&payment=paystack`;

  try {
    const paystackRes = await initializePaystackTransaction({
      email: guestEmail,
      amount: totalAmount,
      reference,
      callbackUrl,
      metadata: {
        orderId: order.id,
        eventId: event.id,
        ticketTierId: tier.id,
        guestName,
        guestEmail,
        quantity,
        platformFee: String(platformFee),
        feeDetails,
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { stripePaymentIntentId: reference },
    });

    return NextResponse.json({
      gateway: "PAYSTACK",
      authorizationUrl: paystackRes.data.authorization_url,
      accessCode: paystackRes.data.access_code,
      reference: paystackRes.data.reference,
      publicKey: paystackConfig.publicKey,
      orderId: order.id,
      amount: totalAmount,
      email: guestEmail,
    });
  } catch (paystackErr: any) {
    console.error("[Paystack Init Error]:", paystackErr);
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "FAILED" },
    });
    return NextResponse.json(
      { error: paystackErr.message || "Failed to initialize payment with Paystack" },
      { status: 400 }
    );
  }
}
