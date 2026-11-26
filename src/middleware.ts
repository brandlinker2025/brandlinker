import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  PRIVATE_SESSION_COOKIE,
  getAuthSecret,
  verifySessionEdge,
  verifyOwnerBearerToken,
} from "@/lib/edge-auth";

/**
 * RSLina.com Scoped Protection Middleware
 *
 * Requirements:
 * - Public personal portfolio routes (/, /career, /work, /riding, /gallery, /freelance, /collaborate,
 *   public media, fonts, static assets, contact inquiries) are freely accessible to external visitors
 *   with full public SEO.
 * - ONLY the AI Command Center (/command-center) and internal business APIs
 *   (/api/command-center/*, /api/jobs*, /api/agents*, /api/automation*) require owner authentication.
 */
export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // 1. Extract session credentials
  const secret = getAuthSecret();
  const sessionCookie = req.cookies.get(PRIVATE_SESSION_COOKIE)?.value;
  const authHeader = req.headers.get("authorization");

  // 2. Verify cookie session or Bearer token
  let isAuthenticated = false;

  if (sessionCookie) {
    isAuthenticated = await verifySessionEdge(sessionCookie, secret);
  }

  if (!isAuthenticated && authHeader) {
    isAuthenticated = await verifyOwnerBearerToken(authHeader, secret);
  }

  // 3. Handle Authenticated Requests to protected routes
  if (isAuthenticated) {
    const res = NextResponse.next();
    // Enforce private headers across confidential command center responses
    res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
    res.headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
    res.headers.set("Pragma", "no-cache");
    res.headers.set("Expires", "0");
    res.headers.set("X-Frame-Options", "DENY");
    res.headers.set("X-Content-Type-Options", "nosniff");
    return res;
  }

  // 4. Handle Unauthorized Requests to protected routes (Fail Closed)
  // For protected API endpoints: return 401 Unauthorized JSON
  if (pathname.startsWith("/api/")) {
    return new NextResponse(
      JSON.stringify({
        error: "Access Denied: AI Command Center and internal APIs require owner authentication.",
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
          "X-Robots-Tag": "noindex, nofollow",
        },
      }
    );
  }

  // For /command-center page requests: redirect to private login screen
  const loginUrl = new URL("/login", req.url);
  const nextParam = pathname + search;
  if (nextParam) {
    loginUrl.searchParams.set("next", nextParam);
  }

  const redirectRes = NextResponse.redirect(loginUrl);
  redirectRes.headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
  redirectRes.headers.set("X-Robots-Tag", "noindex, nofollow");
  return redirectRes;
}

export const config = {
  matcher: [
    "/command-center",
    "/command-center/:path*",
    "/api/command-center/:path*",
    "/api/jobs",
    "/api/jobs/:path*",
    "/api/agents",
    "/api/agents/:path*",
    "/api/automation/:path*",
  ],
};
