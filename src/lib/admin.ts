import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Checks if the current session belongs to an ADMIN.
 * Also allows internal calls with x-admin-key matching NEXTAUTH_SECRET.
 */
export async function isAdmin() {
    try {
        const headerList = await headers();
        const adminKey = headerList.get("x-admin-key");
        if (adminKey && adminKey === process.env.NEXTAUTH_SECRET) {
            return true;
        }
    } catch {
        // headers() not available in some contexts
    }

    const session = await auth();
    return session?.user?.role === "ADMIN";
}

/**
 * Throws an error or returns false if not admin.
 * Useful for protecting API routes.
 */
export async function verifyAdmin() {
    const admin = await isAdmin();
    if (!admin) {
        throw new Error("Unauthorized: Admin access required");
    }
    return true;
}
