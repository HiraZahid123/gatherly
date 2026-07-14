import NextAuth from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            email: string
            name?: string | null
            image?: string | null
            phone?: string | null
            role: "GUEST" | "HOST" | "ADMIN" | "STAFF"
        }
    }

    interface User {
        role: "GUEST" | "HOST" | "ADMIN" | "STAFF"
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role?: "GUEST" | "HOST" | "ADMIN" | "STAFF"
        phone?: string | null
    }
}
