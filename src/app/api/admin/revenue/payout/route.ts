import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculatePlatformFee } from "@/lib/platformSettings";
import { recordEventPayout, getPayoutsForEvent, deleteEventPayout } from "@/lib/payouts";

export async function POST(req: NextRequest) {
  try {
    await verifyAdmin();
    const session = await auth();
    const body = await req.json();

    const { eventId, amount, currency = "ngn", paymentPlatform, reference, notes, hostId } = body;

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    const amountInCents = Math.round(Number(amount));

    if (!amountInCents || isNaN(amountInCents) || amountInCents <= 0) {
      return NextResponse.json({ error: "A valid positive payout amount is required" }, { status: 400 });
    }

    if (!paymentPlatform || !paymentPlatform.trim()) {
      return NextResponse.json({ error: "Payment platform/method is required" }, { status: 400 });
    }

    // Verify against actual remaining balance due for this event
    const orders = await prisma.order.findMany({
      where: { eventId, status: "COMPLETED" },
      select: { totalAmount: true, quantity: true },
    });

    let totalHostEarnings = 0;
    for (const ord of orders) {
      const { platformFee } = await calculatePlatformFee(ord.totalAmount, ord.quantity);
      totalHostEarnings += Math.max(0, ord.totalAmount - platformFee);
    }

    const existingPayouts = await getPayoutsForEvent(eventId);
    const totalAlreadyPaid = existingPayouts.reduce((sum, p) => sum + p.amount, 0);
    const remainingDue = Math.max(0, totalHostEarnings - totalAlreadyPaid);

    if (remainingDue <= 0) {
      return NextResponse.json({
        error: "This event is already fully settled. No remaining balance is due.",
      }, { status: 400 });
    }

    if (amountInCents > remainingDue) {
      const requestedFormatted = (amountInCents / 100).toLocaleString();
      const remainingFormatted = (remainingDue / 100).toLocaleString();
      return NextResponse.json({
        error: `Payout amount (₦${requestedFormatted}) cannot exceed the remaining balance due of ₦${remainingFormatted}.`,
      }, { status: 400 });
    }

    const adminName = session?.user?.name || session?.user?.email || "Admin";

    const record = await recordEventPayout({
      eventId,
      hostId,
      amount: amountInCents,
      currency,
      paymentPlatform: paymentPlatform.trim(),
      reference: reference?.trim() || undefined,
      notes: notes?.trim() || undefined,
      paidBy: adminName,
    });

    return NextResponse.json({
      success: true,
      message: "Host payout recorded successfully",
      payout: record,
    });
  } catch (err: any) {
    console.error("[api/admin/revenue/payout:POST]", err);
    return NextResponse.json(
      { error: err.message || "Failed to record payout" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await verifyAdmin();
    const { searchParams } = new URL(req.url);
    const payoutId = searchParams.get("payoutId");

    if (!payoutId) {
      return NextResponse.json({ error: "payoutId is required" }, { status: 400 });
    }

    const deleted = await deleteEventPayout(payoutId);
    if (!deleted) {
      return NextResponse.json({ error: "Payout record not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Payout record voided successfully",
    });
  } catch (err: any) {
    console.error("[api/admin/revenue/payout:DELETE]", err);
    return NextResponse.json(
      { error: err.message || "Failed to void payout" },
      { status: 500 }
    );
  }
}
