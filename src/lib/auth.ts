import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { authConfig } from "@/lib/auth.config";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { formatPhone } from "@/lib/otp";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma as any),
    callbacks: {
        async jwt({ token, user, trigger, session, account }) {
            // Initial sign-in: capture all user fields
            if (user) {
                token.id = user.id;
                token.role = (user as any).role || "GUEST";
                token.phone = (user as any).phone;
                token.name = user.name;
                token.email = user.email;
                token.picture = user.image || (user as any).picture;
                token.hasPassword = !!(user as any).password;
            }

            // Handle session updates (e.g. after profile completion)
            if (trigger === "update" && session) {
                token = { ...token, ...session };
            }

            // Fresh check from DB if ID exists
            if (token.id) {
                try {
                    const dbUser = await prisma.user.findUnique({
                        where: { id: token.id as string },
                        select: { 
                            phone: true, 
                            role: true, 
                            email: true, 
                            image: true, 
                            name: true,
                            password: true,
                            suspendedAt: true,
                            suspendedReason: true
                        },
                    });

                    if (dbUser) {
                        token.phone = dbUser.phone || token.phone;
                        token.role = dbUser.role || token.role;
                        token.email = dbUser.email || token.email;
                        token.name = dbUser.name || token.name;
                        token.picture = dbUser.image || token.picture;
                        token.hasPassword = !!dbUser.password;
                        
                        // Flag suspended users
                        token.suspended = !!dbUser.suspendedAt;
                        if (dbUser.suspendedReason) token.suspendedReason = dbUser.suspendedReason;

                        // Sync image to DB if missing
                        if (token.picture && !dbUser.image) {
                            await prisma.user.update({
                                where: { id: token.id as string },
                                data: { image: token.picture as string },
                            });
                        }
                    }
                } catch (e) {
                    console.error("Auth JWT callback error:", e);
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as any;
                (session.user as any).phone = token.phone as string;
                session.user.name = token.name;
                session.user.email = token.email as string;
                session.user.image = token.picture as string;
                (session.user as any).hasPassword = token.hasPassword as boolean;
                (session.user as any).suspended = token.suspended as boolean;
            }
            return session;
        },
    },
    providers: [
        ...authConfig.providers,
        GoogleProvider({
            clientId: process.env["GOOGLE_CLIENT_ID"] as string,
            clientSecret: process.env["GOOGLE_CLIENT_SECRET"] as string,
            allowDangerousEmailAccountLinking: true,
        }),
        // Phone/OTP Authentication
        CredentialsProvider({
            id: "phone-otp",
            name: "phone-otp",
            credentials: {
                phone: { label: "Phone", type: "text" },
                otp: { label: "OTP", type: "text" },
            },
            async authorize(credentials) {
                if (!credentials?.phone || !credentials?.otp) {
                    throw new Error("Phone and OTP are required");
                }

                const formattedPhone = formatPhone(credentials.phone as string);

                const user = await prisma.user.findUnique({
                    where: { phone: formattedPhone },
                });

                if (!user || !user.otpCode || !user.otpExpires) {
                    throw new Error("VerificationNotPossible");
                }

                if (!user.name || !user.email) {
                    throw new Error("ProfileIncomplete");
                }

                if (new Date() > user.otpExpires) {
                    throw new Error("CodeExpired");
                }

                if (user.otpCode !== credentials.otp) {
                    throw new Error("InvalidCode");
                }

                await prisma.user.update({
                    where: { id: user.id },
                    data: { otpCode: null, otpExpires: null },
                });

                return {
                    id: user.id,
                    phone: user.phone,
                    role: user.role,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                };
            },
        }),

        // Email/Password Authentication
        CredentialsProvider({
            id: "credentials",
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email and password are required");
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string }
                });

                if (!user) {
                    // Using a specific string that we can catch in the UI
                    throw new Error("UserNotFound");
                }

                if (!user.password) {
                    throw new Error("PasswordNotSet");
                }

                const isValid = await bcrypt.compare(credentials.password as string, user.password);

                if (!isValid) {
                    throw new Error("InvalidPassword");
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    phone: user.phone,
                };
            }
        }),

        // 🔹 Magic Link / Verification Token Provider
        CredentialsProvider({
            id: "verification-token",
            name: "Verification Token",
            credentials: {
                token: { label: "Token", type: "text" }
            },
            async authorize(credentials) {
                const token = credentials?.token as string;
                if (!token) throw new Error("Missing token");

                const verificationToken = await prisma.verificationToken.findUnique({
                    where: { token },
                });

                if (!verificationToken || new Date() > verificationToken.expires) {
                    throw new Error("InvalidToken");
                }

                const user = await prisma.user.findUnique({
                    where: { email: verificationToken.identifier },
                });

                if (!user) throw new Error("User not found");

                await prisma.user.update({
                    where: { id: user.id },
                    data: { emailVerified: new Date() },
                });

                await prisma.verificationToken.delete({
                    where: { token },
                });

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    phone: user.phone,
                };
            }
        }),
    ]
});
