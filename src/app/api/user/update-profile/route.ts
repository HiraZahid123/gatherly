
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth"; // Helper to get session server-side
import { NextResponse } from "next/server";
import { formatPhone } from "@/lib/otp";

export async function PUT(req: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { email, phone, password } = body;
        const updateData: any = {};

        // Validation & duplicate checks
        if (email) {
            const existing = await prisma.user.findUnique({ where: { email } });
            if (existing && existing.id !== session.user.id) {
                return NextResponse.json({ error: "Email already in use" }, { status: 400 });
            }
            updateData.email = email;
        }

        if (phone) {
            const formattedPhone = formatPhone(phone);
            const existing = await prisma.user.findUnique({ where: { phone: formattedPhone } });
            if (existing && existing.id !== session.user.id) {
                return NextResponse.json({ error: "Phone already in use" }, { status: 400 });
            }
            updateData.phone = formattedPhone;
        }

        if (password) {
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
            if (!passwordRegex.test(password)) {
                return NextResponse.json({ error: "Password must be at least 6 characters and include uppercase, number, and special character" }, { status: 400 });
            }
            const bcrypt = require('bcryptjs');
            updateData.password = await bcrypt.hash(password, 10);
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: "No data to update" }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: updateData,
        });

        return NextResponse.json({ success: true, user: updatedUser });

    } catch (error: any) {
        console.error("Update profile error:", error);
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
}
