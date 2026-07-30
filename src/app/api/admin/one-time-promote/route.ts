import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
    try {
        const email = "hassanjamal9986@gmail.com";
        const tempPassword = "admin123";
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        
        // Find user first to see what's missing
        const existingUser = await prisma.user.findUnique({ where: { email } });
        
        const user = await prisma.user.update({
            where: { email },
            data: { 
                role: "ADMIN",
                password: hashedPassword,
                // Ensure name and phone exist for the auth provider check
                name: existingUser?.name || "JollyWitMe Admin",
                phone: existingUser?.phone || "0000000000" 
            },
            select: { name: true, role: true, email: true, phone: true }
        });

        return NextResponse.json({ 
            success: true, 
            message: `User ${user.name} is now a fully qualified ADMIN.`,
            credentials_to_use: {
                login_page: "/admin/login",
                email: user.email,
                password: tempPassword,
                status: "Password & Role sync complete"
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
