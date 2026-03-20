import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const { pathname } = request.nextUrl;

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

  // Protect /admin - requires admin or owner
  if (pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (token.role !== "owner" && token.role !== "admin") {
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
    "/tickets/:path*",
  ],
};
