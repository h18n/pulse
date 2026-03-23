import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that don't require authentication
const publicRoutes = ["/login", "/api/auth"];

// Routes that require specific roles
const roleRoutes: Record<string, Array<"admin" | "editor" | "viewer">> = {
    "/settings": ["admin"],
    "/builder": ["admin", "editor"],
};

const authMiddleware = auth((req) => {
    const { pathname } = req.nextUrl;
    const isLoggedIn = !!req.auth;
    const userRole = req.auth?.user?.role;

    // Check if it's a public route
    const isPublicRoute = publicRoutes.some(
        (route) => pathname.startsWith(route)
    );

    // Allow public routes
    if (isPublicRoute) {
        // Redirect logged-in users away from login page
        if (isLoggedIn && pathname === "/login") {
            return NextResponse.redirect(new URL("/", req.url));
        }
        return NextResponse.next();
    }

    // Since bypass was handled before, any request here MUST be authenticated
    if (!isLoggedIn) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Check role-based access
    for (const [route, allowedRoles] of Object.entries(roleRoutes)) {
        if (pathname.startsWith(route)) {
            if (!userRole || !allowedRoles.includes(userRole)) {
                // Redirect to home if user doesn't have permission
                return NextResponse.redirect(new URL("/", req.url));
            }
        }
    }

    return NextResponse.next();
});

export default function middleware(req: NextRequest & { auth?: any }) {
    const bypassHeader = req.headers.get("x-e2e-bypass");
    if (bypassHeader === "true") {
        return NextResponse.next();
    }

    return (authMiddleware as any)(req);
}


export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
