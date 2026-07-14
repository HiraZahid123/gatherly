import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";

// GET /api/admin/users/[id] — full user profile
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
        }

        const { id } = await params;

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                image: true,
                role: true,
                createdAt: true,
                suspendedAt: true,
                suspendedReason: true,
                // All hosted events
                events: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        status: true,
                        startDate: true,
                        location: true,
                        coverImage: true,
                        _count: { select: { rsvps: true, comments: true } }
                    },
                    orderBy: { createdAt: "desc" }
                },
                // Comments
                comments: {
                    select: {
                        id: true,
                        content: true,
                        createdAt: true,
                        event: { select: { title: true, slug: true } }
                    },
                    orderBy: { createdAt: "desc" },
                    take: 20
                },
                _count: {
                    select: { events: true, rsvps: true, comments: true }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        // Fetch RSVPs separately: by userId OR by guestEmail (guest RSVPs have no userId)
        const rsvpSelect = {
            id: true,
            status: true,
            checkedIn: true,
            createdAt: true,
            guestName: true,
            guestEmail: true,
            event: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    startDate: true,
                    status: true,
                    host: { select: { name: true, email: true } }
                }
            }
        };

        const orConditions: any[] = [{ userId: id }];
        if (user.email) orConditions.push({ guestEmail: user.email });

        const rsvps = await prisma.rSVP.findMany({
            where: { OR: orConditions },
            select: rsvpSelect,
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        // Deduplicate by event id (prefer userId-linked over email-linked)
        const seen = new Set<string>();
        const uniqueRsvps = rsvps.filter(r => {
            if (seen.has(r.event.id)) return false;
            seen.add(r.event.id);
            return true;
        });

        return NextResponse.json({ success: true, user: { ...user, rsvps: uniqueRsvps } });
    } catch (error) {
        console.error("Admin user detail error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}

// PATCH /api/admin/users/[id] — toggle suspension
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const { action, reason } = body;

        if (action === "suspend") {
            const user = await prisma.user.update({
                where: { id },
                data: {
                    suspendedAt: new Date(),
                    suspendedReason: reason || "Suspended by administrator"
                },
                select: { id: true, suspendedAt: true }
            });
            return NextResponse.json({ success: true, user });
        }

        if (action === "unsuspend") {
            const user = await prisma.user.update({
                where: { id },
                data: { suspendedAt: null, suspendedReason: null },
                select: { id: true, suspendedAt: true }
            });
            return NextResponse.json({ success: true, user });
        }

        return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
    } catch (error) {
        console.error("Admin user suspend error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
