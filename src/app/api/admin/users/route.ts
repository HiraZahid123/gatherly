import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import bcrypt from "bcryptjs";

export async function GET(request: Request) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";
        const role = searchParams.get("role") || undefined;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = 10;
        const skip = (page - 1) * limit;

        const where: any = {
            OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
            ],
        };

        if (role) {
            where.role = role;
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    role: true,
                    createdAt: true,
                    events: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            status: true,
                            startDate: true,
                            _count: { select: { rsvps: true } }
                        },
                        take: 5, // Show top 5 hosted events
                        orderBy: { createdAt: "desc" }
                    },
                    _count: {
                        select: { events: true, rsvps: true }
                    }
                }
            }),
            prisma.user.count({ where })
        ]);

        return NextResponse.json({
            success: true,
            users,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                currentPage: page
            }
        });
    } catch (error: any) {
        console.error("Admin users fetch error:", error);
        // Log more details if possible
        if (error.code) console.error("Prisma Error Code:", error.code);
        if (error.meta) console.error("Prisma Error Meta:", error.meta);
        
        return NextResponse.json({ 
            success: false, 
            message: "Internal server error",
            debug: process.env.NODE_ENV === "development" ? error.message : undefined 
        }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const { userId, userIds, ...data } = body;

        // Bulk update
        if (userIds && Array.isArray(userIds)) {
            await prisma.user.updateMany({
                where: { id: { in: userIds } },
                data
            });
            return NextResponse.json({ success: true, message: `${userIds.length} users updated` });
        }

        // Single update
        if (!userId) {
            return NextResponse.json({ success: false, message: "Missing user ID" }, { status: 400 });
        }
        
        const user = await prisma.user.update({
            where: { id: userId },
            data,
            select: { id: true, name: true, role: true, email: true, phone: true }
        });

        return NextResponse.json({ success: true, user });
    } catch (error: any) {
        console.error("Admin user update error:", error);
        if (error.code) console.error("Prisma Error Code:", error.code);
        
        return NextResponse.json({ 
            success: false, 
            message: "Internal server error"
        }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const { email, name, role, phone, password } = body;

        if (!email || !name) {
            return NextResponse.json({ success: false, message: "Email and Name are required" }, { status: 400 });
        }

        // Check if user already exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ success: false, message: "User with this email already exists" }, { status: 400 });
        }

        const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

        const user = await prisma.user.create({
            data: {
                email,
                name,
                role: role || "GUEST",
                phone,
                password: hashedPassword
            },
            select: { id: true, name: true, email: true, role: true }
        });

        return NextResponse.json({ success: true, user });
    } catch (error) {
        console.error("Admin user creation error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ success: false, message: "Missing user ID" }, { status: 400 });
        }

        // Prevent self-deletion
        const session = await auth();
        if (session?.user?.id === userId) {
            return NextResponse.json({ success: false, message: "Cannot delete your own account" }, { status: 400 });
        }

        await prisma.user.delete({
            where: { id: userId }
        });

        return NextResponse.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        console.error("Admin user deletion error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
