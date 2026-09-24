import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ eventId: string; orderId: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { eventId, orderId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        staff: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const isHost = event.hostId === session.user.id;
    const isStaff = event.staff?.some((s) => s.userId === session.user.id);
    if (!isHost && !isStaff) {
      return NextResponse.json(
        { error: "Forbidden: Only the event host can request refunds for their attendees." },
        { status: 403 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { ticketTier: true },
    });

    if (!order || order.eventId !== eventId) {
      return NextResponse.json({ error: "Order not found for this event." }, { status: 404 });
    }

    if (order.status === "REFUNDED") {
      return NextResponse.json({ error: "This order has already been refunded." }, { status: 400 });
    }

    if (order.status !== "COMPLETED") {
      return NextResponse.json({ error: "Only completed orders can be refunded." }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const reason = (body.reason || "").trim();

    if (!reason) {
      return NextResponse.json(
        { error: "Please provide a reason explaining why the refund is being requested." },
        { status: 400 }
      );
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        refundRequested: true,
        refundReason: reason,
        refundRequestedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Refund request submitted successfully. The platform administrator will review and process the refund.",
      order: updated,
    });
  } catch (error: any) {
    console.error("[refund-request]", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit refund request" },
      { status: 500 }
    );
  }
}
