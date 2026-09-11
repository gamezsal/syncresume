import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * middleware.ts (v2 - Hardened Wildcard Protection)
 * Next.js Edge Middleware for Admin & Resume API Security.
 *
 * Enforces Edge token verification across all /api/resume/* sub-routes
 * (/parse, /approve, /status) and /api/admin/* to block unauthenticated requests.
 */

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Strictly protect all resume ingestion & administrative API routes
  if (
    pathname.startsWith("/api/resume") ||
    pathname.startsWith("/api/admin")
  ) {
    const sessionCookie =
      request.cookies.get("__session")?.value ||
      request.cookies.get("admin_session")?.value;

    const authHeader = request.headers.get("Authorization");

    const isAuthenticated =
      Boolean(sessionCookie) ||
      Boolean(authHeader && authHeader.startsWith("Bearer "));

   const clientIp =
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  request.headers.get("x-real-ip") ||
  "unknown";

if (!isAuthenticated) {
  console.warn(
    `[Edge Middleware] Blocked unauthenticated API call to '${pathname}' from IP: ${clientIp}`
  );

      return NextResponse.json(
        {
          error: "Unauthorized",
          message:
            "Edge Security Intercept: Missing valid session cookie or Authorization header.",
        },
        { status: 401 }
      );
    }
  }

  // 2. Inject HTTP Security Hardening Headers on all matched routes
  const response = NextResponse.next();

  // Prevent Clickjacking attacks by forbidding iframe embedding
  response.headers.set("X-Frame-Options", "DENY");

  // Prevent MIME-type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Enforce Referrer Privacy
  response.headers.set(
    "Referrer-Policy",
    "strict-origin-when-cross-origin"
  );

  // Disable unneeded browser permissions
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );

  return response;
}

/**
 * Configure Matcher to intercept administrative paths and all resume APIs
 */
export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/resume/:path*", // 👈 Wildcard covers /parse, /approve, /status, etc.
  ],
};