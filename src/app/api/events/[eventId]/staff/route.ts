import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { staffAddSchema } from "@/lib/validation";

/**
 * GET: List all staff members for an event
 */
export async function GET(
    request: NextRequest,
    props: { params: Promise<{ eventId: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();
        const { eventId } = params;

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only host or existing staff can view staff list
        const event = await prisma.event.findFirst({
            where: {
                id: eventId,
                OR: [
                    { hostId: session.user.id },
                    { staff: { some: { userId: session.user.id } } }
                ]
            }
        });

        if (!event) {
            return NextResponse.json({ error: "Event not found or access denied" }, { status: 404 });
        }

        const staff = await prisma.eventStaff.findMany({
            where: { eventId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true
                    }
                }
            },
            orderBy: { createdAt: "asc" }
        });

        return NextResponse.json({ success: true, staff });
    } catch (error) {
        console.error("Staff Fetch error:", error);
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}

/**
 * POST: Add a new staff member to an event
 */
export async function POST(
    request: NextRequest,
    props: { params: Promise<{ eventId: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();
        const { eventId } = params;

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only host can add staff
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { hostId: true, endDate: true, startDate: true }
        });

        if (!event || event.hostId !== session.user.id) {
            return NextResponse.json({ error: "Only the host can add staff" }, { status: 403 });
        }

        const body = await request.json();
        const validation = staffAddSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: "Invalid data", details: validation.error.format() },
                { status: 400 }
            );
        }

        const { email } = validation.data;

        // Find the user by email
        const userToAdd = await prisma.user.findUnique({
            where: { email }
        });

        if (!userToAdd) {
            return NextResponse.json(
                { error: "User not found. They must have an account first." },
                { status: 404 }
            );
        }

        // Check if already staff
        const existingStaff = await (prisma as any).eventStaff.findUnique({
            where: {
                eventId_userId: {
                    eventId,
                    userId: userToAdd.id
                }
            }
        });

        if (existingStaff) {
            return NextResponse.json(
                { error: "User is already a staff member" },
                { status: 400 }
            );
        }

        // Default expiration: Event end date or start date + 1 day
        const expiresAt = event.endDate || new Date(event.startDate.getTime() + 24 * 60 * 60 * 1000);

        // Create staff record
        const staffMember = await (prisma as any).eventStaff.create({
            data: {
                eventId,
                userId: userToAdd.id,
                role: "SCANNER",
                expiresAt
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });

        return NextResponse.json({ success: true, staffMember });
    } catch (error) {
        console.error("Staff Add error:", error);
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}
