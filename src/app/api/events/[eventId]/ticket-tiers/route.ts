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
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const isAdmin = (session.user as any).role === "ADMIN";
  const themeData = typeof event.theme === "string" ? JSON.parse(event.theme) : (event.theme || {});
  const isCoHost = Array.isArray(themeData?.settings?.hosts?.cohosts) && themeData.settings.hosts.cohosts.some((c: any) =>
    (c.id && c.id === session.user.id) ||
    (c.email && c.email === session.user.email)
  );

  if (event.hostId !== session.user.id && !isAdmin && !isCoHost) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, description, price, currency = "ngn", quantity, sortOrder = 0 } = body;

    if (!name || price == null || quantity == null) {
      return NextResponse.json({ error: "name, price, and quantity are required" }, { status: 400 });
    }

    const numPrice = Number(price);
    const numQty = Number(quantity);

    if (isNaN(numPrice) || numPrice < 0) {
      return NextResponse.json({ error: "Price must be a valid non-negative number" }, { status: 400 });
    }
    if (numPrice > 0 && numPrice < 100000) {
      return NextResponse.json({ error: "Minimum paid ticket price is ₦1,000 (or 0 for free) to meet card processing limits." }, { status: 400 });
    }
    if (isNaN(numQty) || numQty <= 0) {
      return NextResponse.json({ error: "Quantity must be greater than 0" }, { status: 400 });
    }

    const tier = await prisma.ticketTier.create({
      data: {
        eventId,
        name: name.trim(),
        description: description ? description.trim() : null,
        price: Math.round(numPrice), // cents
        currency: currency.toLowerCase(),
        quantity: Math.round(numQty),
        sortOrder: Number(sortOrder) || 0,
      },
    });

    // Mark event as paid if not already
    if (!event.isPaid) {
      await prisma.event.update({ where: { id: eventId }, data: { isPaid: true } });
    }

    return NextResponse.json({ tier }, { status: 201 });
  } catch (err: any) {
    console.error("Failed to create ticket tier:", err);
    return NextResponse.json({ error: err?.message || "Failed to create ticket tier" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { eventId } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const isAdmin = (session.user as any).role === "ADMIN";
  const themeData = typeof event.theme === "string" ? JSON.parse(event.theme) : (event.theme || {});
  const isCoHost = Array.isArray(themeData?.settings?.hosts?.cohosts) && themeData.settings.hosts.cohosts.some((c: any) =>
    (c.id && c.id === session.user.id) ||
    (c.email && c.email === session.user.email)
  );

  if (event.hostId !== session.user.id && !isAdmin && !isCoHost) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { tierId } = await req.json();
    if (!tierId) return NextResponse.json({ error: "tierId is required" }, { status: 400 });

    await prisma.ticketTier.update({ where: { id: tierId }, data: { isActive: false } });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Failed to delete ticket tier:", err);
    return NextResponse.json({ error: err?.message || "Failed to delete ticket tier" }, { status: 500 });
  }
}
