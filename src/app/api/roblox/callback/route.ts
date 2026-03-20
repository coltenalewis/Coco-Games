import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { assignVerifiedRole } from "@/lib/verification";

export async function GET(req: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId) {
    return NextResponse.redirect(new URL("/", siteUrl));
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/profile?roblox_error=${encodeURIComponent(error)}`, siteUrl)
    );
  }

  // Validate state
  const storedState = req.cookies.get("roblox_oauth_state")?.value;
  if (!state || state !== storedState) {
    return NextResponse.redirect(
      new URL("/profile?roblox_error=invalid_state", siteUrl)
    );
  }

  // Get code verifier
  const codeVerifier = req.cookies.get("roblox_code_verifier")?.value;
  if (!code || !codeVerifier) {
    return NextResponse.redirect(
      new URL("/profile?roblox_error=missing_params", siteUrl)
    );
  }

  const redirectUri = `${siteUrl}/api/roblox/callback`;

  // Exchange code for tokens
  const tokenRes = await fetch("https://apis.roblox.com/oauth/v1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: process.env.ROBLOX_CLIENT_ID!,
      client_secret: process.env.ROBLOX_CLIENT_SECRET!,
      code_verifier: codeVerifier,
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    console.error("Roblox token exchange failed:", errText);
    return NextResponse.redirect(
      new URL("/profile?roblox_error=token_failed", siteUrl)
    );
  }

  const tokens = await tokenRes.json();

  // Fetch user info from Roblox
  const userInfoRes = await fetch("https://apis.roblox.com/oauth/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userInfoRes.ok) {
    console.error("Roblox userinfo failed:", await userInfoRes.text());
    return NextResponse.redirect(
      new URL("/profile?roblox_error=userinfo_failed", siteUrl)
    );
  }

  const userInfo = await userInfoRes.json();
  const robloxId = String(userInfo.sub);
  const robloxUsername = userInfo.preferred_username || userInfo.name || robloxId;

  // Check if this Roblox account is already linked to another Discord user
  const { data: existing } = await getSupabase()
    .from("users")
    .select("discord_id")
    .eq("roblox_id", robloxId)
    .neq("discord_id", session.user.discordId)
    .maybeSingle();

  if (existing) {
    return NextResponse.redirect(
      new URL("/profile?roblox_error=already_linked", siteUrl)
    );
  }

  // Link the Roblox account
  const { error: dbError } = await getSupabase()
    .from("users")
    .update({
      roblox_id: robloxId,
      roblox_username: robloxUsername,
    })
    .eq("discord_id", session.user.discordId);

  if (dbError) {
    console.error("Failed to link Roblox:", dbError.message);
    return NextResponse.redirect(
      new URL("/profile?roblox_error=db_failed", siteUrl)
    );
  }

  // Assign Verified role in Discord servers
  if (session.accessToken) {
    await assignVerifiedRole(session.user.discordId, session.accessToken);
  }

  // Clear OAuth cookies and redirect to profile
  const response = NextResponse.redirect(new URL("/profile?roblox_linked=true", siteUrl));
  response.cookies.delete("roblox_code_verifier");
  response.cookies.delete("roblox_oauth_state");
  return response;
}
