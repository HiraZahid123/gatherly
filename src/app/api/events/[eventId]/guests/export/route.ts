import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ eventId: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();
        const { eventId } = params;

        const event = await (prisma as any).event.findUnique({
            where: { id: eventId },
            select: { hostId: true, title: true },
        });

        if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

        const isHost = session?.user?.id === event.hostId;
        if (!isHost) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const statusFilter = request.nextUrl.searchParams.get("status");
        const rsvps = await (prisma as any).rSVP.findMany({
            where: {
                eventId,
                ...(statusFilter ? { status: statusFilter } : {}),
            },
            include: {
                user: { select: { id: true, name: true, email: true, phone: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        const rows = [
            ["Name", "Email", "Phone", "Status", "RSVP Date", "Checked In"],
            ...rsvps.map((r: any) => [
                r.user?.name || r.guestName || "Guest",
                r.user?.email || r.guestEmail || "",
                r.user?.phone || r.guestPhone || "",
                r.status,
                new Date(r.createdAt).toLocaleString(),
                r.checkedIn ? "Yes" : "No",
            ]),
        ];

        const csv = rows.map(row =>
            row.map((cell: string) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        ).join("\r\n");

        const filename = `${event.title.replace(/[^a-z0-9]/gi, "_")}_guests.csv`;

        return new NextResponse(csv, {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error("CSV export error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
