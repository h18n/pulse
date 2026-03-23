import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { compare } from "bcryptjs";

// User type definition
export interface User {
    id: string;
    email: string;
    name: string;
    role: "admin" | "editor" | "viewer";
    image?: string;
}

// =============================================================================
// ⚠️  DEMO ONLY — In-Memory User Database
// =============================================================================
// This mock user store is provided for local development and demo purposes.
// For production, replace this with a real database (e.g., PostgreSQL, MongoDB)
// and use proper password hashing with bcrypt.
//
// To migrate to a real database:
//   1. Set up your database and create a "users" table/collection
//   2. Replace the `users` array below with a database query
//   3. Remove the plaintext password check in the `authorize` function
//   4. Use `await compare(credentials.password, user.password)` exclusively
//
// Demo credentials:
//   - admin@pulse.io / admin123 (Admin role)
//   - viewer@pulse.io / viewer123 (Viewer role)
// =============================================================================
const users: Array<User & { password: string }> = [
    {
        id: "1",
        email: "admin@pulse.io",
        name: "Admin User",
        password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.qQz0K/LQv3c1yq", // "admin123"
        role: "admin",
    },
    {
        id: "2",
        email: "viewer@pulse.io",
        name: "Viewer User",
        password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.qQz0K/LQv3c1yq", // "viewer123"
        role: "viewer",
    },
];

export const { handlers, signIn, signOut, auth } = NextAuth({
    pages: {
        signIn: "/login",
        error: "/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    providers: [
        // Credentials Provider (Email/Password)
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = users.find((u) => u.email === credentials.email);
                if (!user) {
                    return null;
                }

                // ⚠️ DEMO ONLY: Plaintext password check for easy local testing.
                // In production, REMOVE the plaintext checks and use ONLY bcrypt:
                //   const isValidPassword = await compare(credentials.password, user.password);
                const isValidPassword =
                    credentials.password === "admin123" ||
                    credentials.password === "viewer123" ||
                    await compare(String(credentials.password), user.password);

                if (!isValidPassword) {
                    return null;
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                };
            },
        }),

        // OAuth Providers (configure in .env)
        GitHub({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
        }),
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id || "";
                token.role = (user as User).role || "viewer";
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as "admin" | "editor" | "viewer";
            }
            return session;
        },
        async redirect({ url, baseUrl }) {
            // Redirect to dashboard after login
            if (url.startsWith(baseUrl)) return url;
            if (url.startsWith("/")) return `${baseUrl}${url}`;
            return baseUrl;
        },
    },
    trustHost: true,
});

// Type augmentation for session
declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            email: string;
            name: string;
            role: "admin" | "editor" | "viewer";
            image?: string;
        };
    }

    interface User {
        role?: "admin" | "editor" | "viewer";
    }
}

declare module "@auth/core/jwt" {
    interface JWT {
        id: string;
        role: "admin" | "editor" | "viewer";
    }
}
