import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Params { params: Promise<{ eventId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { eventId } = await params;
  const tiers = await prisma.ticketTier.findMany({
    where: { eventId, isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json({ tiers });
}

export async function POST(req: NextRequest, { params }: Params) {
  const { eventId } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.hostId !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, description, price, currency = "usd", quantity, sortOrder = 0 } = body;

  if (!name || price == null || !quantity)
    return NextResponse.json({ error: "name, price, and quantity are required" }, { status: 400 });

  const tier = await prisma.ticketTier.create({
    data: {
      eventId,
      name,
      description,
      price: Math.round(price), // cents
      currency,
      quantity: Math.round(quantity),
      sortOrder,
    },
  });

  // Mark event as paid if not already
  if (!event.isPaid) {
    await prisma.event.update({ where: { id: eventId }, data: { isPaid: true } });
  }

  return NextResponse.json({ tier }, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { eventId } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.hostId !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { tierId } = await req.json();
  await prisma.ticketTier.update({ where: { id: tierId }, data: { isActive: false } });

  return NextResponse.json({ success: true });
}
