import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Default role-page mappings (used as fallback if permissions DB unavailable)
// These are overridden by the site_permissions table at runtime via API routes
const PAGE_ROLES: Record<string, string[]> = {
  "/dashboard": ["owner"],
  "/admin": ["coordinator", "admin", "developer", "executive", "owner"],
  "/accounting": ["executive", "owner"],
  "/calendar": ["contractor", "mod", "coordinator", "developer", "admin", "executive", "owner"],
  "/boards": ["contractor", "mod", "coordinator", "developer", "admin", "executive", "owner"],
  "/requests": ["contractor", "mod", "coordinator", "developer", "admin", "executive", "owner"],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request });

  // View-as-role: owner can impersonate other roles
  let effectiveRole = token?.role as string;
  const viewAsCookie = request.cookies.get("view_as_role")?.value;
  if (viewAsCookie && token?.discordId === process.env.OWNER_DISCORD_ID) {
    effectiveRole = viewAsCookie;
  }

  // Auth-only routes
  if (pathname.startsWith("/profile") || pathname.startsWith("/tickets") || pathname.startsWith("/inbox")) {
    if (!token) return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }

  // Role-gated routes
  for (const [route, roles] of Object.entries(PAGE_ROLES)) {
    if (pathname.startsWith(route)) {
      if (!token) return NextResponse.redirect(new URL("/", request.url));
      if (!roles.includes(effectiveRole)) {
        return NextResponse.redirect(new URL("/profile", request.url));
      }
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/profile/:path*",
    "/dashboard/:path*",
    "/admin/:path*",
    "/accounting/:path*",
    "/calendar/:path*",
    "/boards/:path*",
    "/requests/:path*",
    "/tickets/:path*",
    "/inbox/:path*",
  ],
};
