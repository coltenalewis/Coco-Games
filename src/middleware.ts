import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Roles that count as "team" (contractor+)
const TEAM_ROLES = ["contractor", "mod", "developer", "admin", "executive", "owner"];
const ADMIN_ROLES = ["admin", "developer", "executive", "owner"];
const EXEC_ROLES = ["executive", "owner"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files and API auth routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".") // static files like favicon.ico, images, etc.
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request });

  // Protect /profile - requires authentication
  if (pathname.startsWith("/profile")) {
    if (!token) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Protect /dashboard - requires owner
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (token.role !== "owner") {
      return NextResponse.redirect(new URL("/profile", request.url));
    }
  }

  // Protect /admin - requires admin or higher
  if (pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (!ADMIN_ROLES.includes(token.role as string)) {
      return NextResponse.redirect(new URL("/profile", request.url));
    }
  }

  // Protect /accounting - requires executive or owner
  if (pathname.startsWith("/accounting")) {
    if (!token) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (!EXEC_ROLES.includes(token.role as string)) {
      return NextResponse.redirect(new URL("/profile", request.url));
    }
  }

  // Protect /calendar - requires contractor+ (any team member)
  if (pathname.startsWith("/calendar")) {
    if (!token) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (!TEAM_ROLES.includes(token.role as string)) {
      return NextResponse.redirect(new URL("/profile", request.url));
    }
  }

  // Protect /boards - requires contractor+ (team)
  if (pathname.startsWith("/boards")) {
    if (!token) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (!TEAM_ROLES.includes(token.role as string)) {
      return NextResponse.redirect(new URL("/profile", request.url));
    }
  }

  // Protect /requests - requires contractor+ (team)
  if (pathname.startsWith("/requests")) {
    if (!token) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (!TEAM_ROLES.includes(token.role as string)) {
      return NextResponse.redirect(new URL("/profile", request.url));
    }
  }

  // Protect /tickets - requires authentication
  if (pathname.startsWith("/tickets")) {
    if (!token) {
      return NextResponse.redirect(new URL("/", request.url));
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
  ],
};
