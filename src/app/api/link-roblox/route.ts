import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { assignVerifiedRole } from "@/lib/verification";

async function fetchRobloxUsername(robloxId: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://users.roblox.com/v1/users/${robloxId}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.name || null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const robloxId = String(body.robloxId || "").trim();

  if (!robloxId || !/^\d+$/.test(robloxId)) {
    return NextResponse.json(
      { error: "Invalid Roblox user ID" },
      { status: 400 }
    );
  }

  // Verify the Roblox account exists
  const robloxUsername = await fetchRobloxUsername(robloxId);
  if (!robloxUsername) {
    return NextResponse.json(
      { error: "Roblox account not found" },
      { status: 404 }
    );
  }

  // Check if this Roblox ID is already linked to another Discord account
  const { data: existing } = await getSupabase()
    .from("users")
    .select("discord_id")
    .eq("roblox_id", robloxId)
    .neq("discord_id", session.user.discordId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "This Roblox account is already linked to another user" },
      { status: 409 }
    );
  }

  // Link the Roblox account
  const { error } = await getSupabase()
    .from("users")
    .update({
      roblox_id: robloxId,
      roblox_username: robloxUsername,
    })
    .eq("discord_id", session.user.discordId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Now try to assign Verified role (user has both accounts linked)
  if (session.accessToken) {
    await assignVerifiedRole(session.user.discordId, session.accessToken);
  }

  return NextResponse.json({
    success: true,
    robloxUsername,
    robloxId,
  });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await getSupabase()
    .from("users")
    .update({ roblox_id: null, roblox_username: null })
    .eq("discord_id", session.user.discordId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
