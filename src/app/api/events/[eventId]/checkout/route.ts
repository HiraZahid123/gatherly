import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, PLATFORM_FEE_PERCENT } from "@/lib/stripe";

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
  const platformFee = Math.round(totalAmount * PLATFORM_FEE_PERCENT);

  // Create order (PENDING)
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
      currency: tier.currency,
    },
  });

  // Create Stripe PaymentIntent
  const paymentIntentOptions: any = {
    amount: totalAmount,
    currency: tier.currency,
    automatic_payment_methods: { enabled: true },
    metadata: { orderId: order.id, eventId, ticketTierId },
  };

  // Only apply destination charge if host stripe account is connected
  if (stripeAccount) {
    paymentIntentOptions.application_fee_amount = platformFee;
    paymentIntentOptions.transfer_data = { destination: stripeAccount.stripeAccountId };
  }

  const paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions);

  await prisma.order.update({
    where: { id: order.id },
    data: { stripePaymentIntentId: paymentIntent.id },
  });

  return NextResponse.json({ clientSecret: paymentIntent.client_secret, orderId: order.id });
}
