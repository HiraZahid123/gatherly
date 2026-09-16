import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { calculatePlatformFee, getStripeConfig } from "@/lib/platformSettings";
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

  // Ensure host has a Stripe Connect account (bypass in development for testing)
  const stripeAccount = await prisma.stripeAccount.findFirst({
    where: { userId: event.hostId, chargesEnabled: true },
  });
  
  if (!stripeAccount && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: "Host has not completed Stripe setup" }, { status: 400 });
  }

  const totalAmount = tier.price * quantity;
  const { platformFee, details: feeDetails } = await calculatePlatformFee(totalAmount, quantity);
  
  const currency = "ngn";

  if (totalAmount > 0 && totalAmount < 100000) {
    return NextResponse.json(
      { error: "Minimum payment amount is ₦1,000 to meet Stripe processing limits." },
      { status: 400 }
    );
  }

  // Create order
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

  // FREE TICKET: Complete order and RSVP directly without Stripe!
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

  // PAID TICKET: Create Stripe PaymentIntent
  const paymentIntentOptions: any = {
    amount: totalAmount,
    currency,
    automatic_payment_methods: { enabled: true },
    metadata: { orderId: order.id, eventId, ticketTierId, platformFee: String(platformFee), feeDetails },
  };

  // Only apply destination charge if host stripe account is connected
  if (stripeAccount) {
    paymentIntentOptions.application_fee_amount = platformFee;
    paymentIntentOptions.transfer_data = { destination: stripeAccount.stripeAccountId };
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions);

    await prisma.order.update({
      where: { id: order.id },
      data: { stripePaymentIntentId: paymentIntent.id },
    });

    const { publishableKey } = await getStripeConfig();
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId: order.id,
      publishableKey: publishableKey || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    });
  } catch (stripeErr: any) {
    console.error("Stripe payment intent creation error:", stripeErr);
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "FAILED" },
    });
    return NextResponse.json(
      { error: stripeErr.message || "Failed to initialize payment with Stripe" },
      { status: 400 }
    );
  }
}
