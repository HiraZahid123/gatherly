import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import { registerSchema } from "@/lib/validation";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const phone = formData.get("phone") as string;
        const password = formData.get("password") as string;
        const imageFile = formData.get("image") as File | null;

        if (!name || !email || !password || !phone) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Check if user already exists (email OR phone)
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { phone }
                ]
            },
        });

        if (existingUser) {
            const field = existingUser.email === email ? "Email" : "Phone number";
            return NextResponse.json(
                { error: `${field} already exists` },
                { status: 400 }
            );
        }

        // Handle Image Upload
        let imageUrl = null;
        if (imageFile) {
            // Validate file type
            const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
            if (!allowedTypes.includes(imageFile.type)) {
                return NextResponse.json(
                    { error: "Invalid file type. Only JPEG, PNG, and WebP images are allowed." },
                    { status: 400 }
                );
            }

            // Validate file size (5MB)
            if (imageFile.size > 5 * 1024 * 1024) {
                return NextResponse.json(
                    { error: "File size must be less than 5MB." },
                    { status: 400 }
                );
            }

            // Generate unique filename
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(2, 15);
            const extension = imageFile.name.split(".").pop();
            const filename = `register-${timestamp}-${randomString}.${extension}`;

            // Create upload directory if it doesn't exist
            const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
            if (!existsSync(uploadDir)) {
                await mkdir(uploadDir, { recursive: true });
            }

            // Convert file to buffer and save
            const bytes = await imageFile.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const filepath = path.join(uploadDir, filename);
            await writeFile(filepath, buffer);

            // Generate URL
            imageUrl = `/uploads/avatars/${filename}`;
        }

        // Validate data using registerSchema
        const validation = registerSchema.safeParse({ name, email, password });
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                phone, // Save the phone number
                password: hashedPassword,
                role: "HOST", // Default role for new users
                image: imageUrl, // Save image URL
            },
        });

        // Generate Verification Token and send email (non-blocking — failure won't break registration)
        // Generate Verification Token and send welcome/verification email
        try {
            const crypto = require('crypto');
            const verificationToken = crypto.randomBytes(32).toString('hex');
            const expires = new Date(new Date().getTime() + 24 * 60 * 60 * 1000); // 24 hours

            await prisma.verificationToken.create({
                data: {
                    identifier: email,
                    token: verificationToken,
                    expires,
                },
            });

            // Fire-and-forget: email failure should never block registration
            const { sendEmail } = require("@/lib/mail");
            const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "https://jollywitme.com";
            const verifyUrl = `${baseUrl}/auth/verify-email?token=${verificationToken}`;
            
            sendEmail({
                to: email,
                subject: "Welcome to JollyWitMe — Please Verify Your Email",
                html: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px;">
                        <div style="text-align: center; margin-bottom: 24px;">
                            <h1 style="color: #059669; font-size: 26px; font-weight: 800; margin: 0 0 8px 0; letter-spacing: -0.5px;">JollyWitMe</h1>
                            <p style="color: #6b7280; font-size: 14px; margin: 0;">Unforgettable Events & Celebrations</p>
                        </div>
                        <div style="padding: 24px 0; border-top: 1px solid #f3f4f6; border-bottom: 1px solid #f3f4f6;">
                            <h2 style="color: #111827; font-size: 20px; font-weight: 700; margin: 0 0 12px 0;">Welcome, ${name}! 🎉</h2>
                            <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
                                Thank you for creating your account on JollyWitMe. We're thrilled to have you join our community! To get started hosting and managing your events, please verify your email address.
                            </p>
                            <div style="text-align: center; margin: 28px 0;">
                                <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);">
                                    Verify My Email →
                                </a>
                            </div>
                            <p style="color: #9ca3af; font-size: 13px; line-height: 1.5; margin: 0;">
                                Or copy and paste this URL into your browser:<br/>
                                <a href="${verifyUrl}" style="color: #059669; word-break: break-all;">${verifyUrl}</a>
                            </p>
                        </div>
                        <div style="text-align: center; margin-top: 24px; color: #9ca3af; font-size: 12px;">
                            <p style="margin: 0 0 4px 0;">This verification link will expire in 24 hours.</p>
                            <p style="margin: 0;">© ${new Date().getFullYear()} JollyWitMe. All rights reserved.</p>
                        </div>
                    </div>
                `,
            }).catch((emailErr: any) => {
                console.error('[Register] Non-fatal: email send failed:', emailErr?.message);
            });
        } catch (tokenErr: any) {
            // Non-fatal — user is created, token/email step failed
            console.error('[Register] Non-fatal: verification token/email step failed:', tokenErr?.message);
        }

        return NextResponse.json(
            {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                },
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: error?.message || "Something went wrong" },
            { status: 500 }
        );
    }
}
