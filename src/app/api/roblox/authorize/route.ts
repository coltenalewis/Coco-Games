import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { randomBytes, createHash } from "crypto";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId) {
    return NextResponse.redirect(new URL("/", process.env.NEXTAUTH_URL || "http://localhost:3000"));
  }

  const clientId = process.env.ROBLOX_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Roblox OAuth not configured" }, { status: 500 });
  }

  // Generate PKCE code verifier and challenge
  const codeVerifier = randomBytes(32).toString("base64url");
  const codeChallenge = createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  // Generate state to prevent CSRF
  const state = randomBytes(16).toString("hex");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const redirectUri = `${siteUrl}/api/auth/callback/roblox`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid profile",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  const authUrl = `https://apis.roblox.com/oauth/v1/authorize?${params.toString()}`;

  const response = NextResponse.redirect(authUrl);

  // Store code_verifier and state in secure cookies
  response.cookies.set("roblox_code_verifier", codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });
  response.cookies.set("roblox_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}
