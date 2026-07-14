import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { profileUpdateSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized. Please sign in." },
                { status: 401 }
            );
        }

        const body = await request.json();

        // Validate input
        const validation = profileUpdateSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { name, phone, image } = validation.data;

        // Build update data object (filter out empty strings and undefined)
        const updateData: any = {};
        if (name && name.trim()) updateData.name = name.trim();
        if (phone && phone.trim()) updateData.phone = phone.trim();
        if (image && image.trim()) updateData.image = image.trim();

        // If no fields to update, return early
        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({
                success: true,
                message: "No changes to update.",
                user: {
                    id: session.user.id,
                    name: session.user.name,
                    email: session.user.email,
                    phone: (session.user as any).phone,
                    image: session.user.image,
                    role: (session.user as any).role,
                },
            });
        }

        // Update user profile
        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: updateData,
        });

        return NextResponse.json({
            success: true,
            message: "Profile updated successfully.",
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                image: updatedUser.image,
                role: updatedUser.role,
            },
        });
    } catch (error) {
        console.error("Profile update error:", error);
        return NextResponse.json(
            { error: "An error occurred. Please try again." },
            { status: 500 }
        );
    }
}
