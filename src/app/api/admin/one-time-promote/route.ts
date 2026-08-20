import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email") || "admin@jollywitme.com";
        const tempPassword = searchParams.get("password") || "Admin@2026";
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        
        const existingUser = await prisma.user.findUnique({ where: { email } });
        
        const user = await prisma.user.upsert({
            where: { email },
            update: { 
                role: "ADMIN",
                password: hashedPassword,
            },
            create: {
                email,
                name: existingUser?.name || "JollyWitMe Admin",
                role: "ADMIN",
                password: hashedPassword,
                phone: existingUser?.phone || "+10000000000"
            },
            select: { name: true, role: true, email: true, phone: true }
        });

        return NextResponse.json({ 
            success: true, 
            message: `User ${user.name} (${user.email}) is now configured as ADMIN.`,
            credentials_to_use: {
                login_page: "/admin/login",
                email: user.email,
                password: tempPassword,
                role: user.role
            }
        });
    } catch (error: any) {
        console.error("Promotion error:", error);
        return NextResponse.json({ 
            success: false, 
            message: "Internal server error",
            error: error.message 
        }, { status: 500 });
    }
}
