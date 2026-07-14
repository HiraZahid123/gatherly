import { auth } from "@/lib/auth";

/**
 * Checks if the current session belongs to an ADMIN.
 * Used in Server Components and API Routes.
 */
export async function isAdmin() {
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
