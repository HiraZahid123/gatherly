import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * Generate a secure random token for password reset
 */
export function generateResetToken(): string {
    return crypto.randomBytes(32).toString("hex");
}

/**
 * Create a password reset token and store it in the database
 * @param email - User's email address
 * @returns The generated token
 */
export async function createPasswordResetToken(email: string): Promise<string> {
    const token = generateResetToken();
    const expires = new Date(Date.now() + 3600000); // 1 hour from now

    // Delete any existing tokens for this email
    await prisma.verificationToken.deleteMany({
        where: {
            identifier: email,
        },
    });

    // Create new token
    await prisma.verificationToken.create({
        data: {
            identifier: email,
            token,
            expires,
        },
    });

    return token;
}

/**
 * Verify a password reset token
 * @param token - The token to verify
 * @returns The email associated with the token, or null if invalid/expired
 */
export async function verifyPasswordResetToken(token: string): Promise<string | null> {
    const verificationToken = await prisma.verificationToken.findUnique({
        where: {
            token,
        },
    });

    if (!verificationToken) {
        return null;
    }

    // Check if token is expired
    if (verificationToken.expires < new Date()) {
        // Delete expired token
        await prisma.verificationToken.delete({
            where: {
                token,
            },
        });
        return null;
    }

    return verificationToken.identifier;
}

/**
 * Delete a password reset token after use
 * @param token - The token to delete
 */
export async function deletePasswordResetToken(token: string): Promise<void> {
    await prisma.verificationToken.delete({
        where: {
            token,
        },
    }).catch(() => {
        // Ignore errors if token doesn't exist
    });
}

/**
 * Clean up expired tokens (can be run periodically)
 */
export async function cleanupExpiredTokens(): Promise<void> {
    await prisma.verificationToken.deleteMany({
        where: {
            expires: {
                lt: new Date(),
            },
        },
    });
}
