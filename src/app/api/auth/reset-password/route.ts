import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPasswordResetToken, deletePasswordResetToken } from "@/lib/tokens";
import { resetPasswordSchema } from "@/lib/validation";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate input
        const validation = resetPasswordSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { token, password } = validation.data;

        // Verify token and get email
        const email = await verifyPasswordResetToken(token);
        if (!email) {
            return NextResponse.json(
                { error: "Invalid or expired reset token." },
                { status: 400 }
            );
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found." },
                { status: 404 }
            );
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user password
        await prisma.user.update({
            where: { email },
            data: { password: hashedPassword },
        });

        // Delete the used token
        await deletePasswordResetToken(token);

        return NextResponse.json({
            success: true,
            message: "Password reset successfully. You can now sign in with your new password.",
        });
    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json(
            { error: "An error occurred. Please try again." },
            { status: 500 }
        );
    }
}
