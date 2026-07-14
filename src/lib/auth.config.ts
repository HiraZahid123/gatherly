import type { NextAuthConfig } from "next-auth";


export const authConfig: NextAuthConfig = {
    session: {
        strategy: "jwt",
    },
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    trustHost: true,
    pages: {
        signIn: "/auth/signin",
        error: "/auth/error",
    },
    providers: [],
    callbacks: {
        async jwt({ token, user, trigger, session, account }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.phone = (user as any).phone;
                token.name = user.name;
                token.email = user.email;
                token.picture = user.image || (user as any).picture;
                token.hasPassword = !!(user as any).password;
            }

            // Handle session updates (e.g. after phone is added)
            if (trigger === "update" && session) {
                token = { ...token, ...session };
            }

            return token;
        },
        async session({ session, token }) {
            if (session?.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as "GUEST" | "HOST" | "ADMIN" | "STAFF";
                (session.user as any).phone = token.phone as string | null | undefined;
                session.user.name = token.name as string | null | undefined;
                session.user.image = token.picture as string | null | undefined;
                (session.user as any).hasPassword = token.hasPassword as boolean;
            }
            return session;
        },
    },
};
