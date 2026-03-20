import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { hasMinRole } from "@/lib/roles";

// GET /api/admin/users/[discordId]/discipline
export async function GET(
  _req: NextRequest,
  { params }: { params: { discordId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !hasMinRole(session.user?.role, "mod")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await getSupabase()
    .from("discipline_log")
    .select("*")
    .eq("target_discord_id", params.discordId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

// POST /api/admin/users/[discordId]/discipline - add manual warning/note
export async function POST(
  req: NextRequest,
  { params }: { params: { discordId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !hasMinRole(session.user?.role, "mod")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { actionType, reason, guildId, guildName } = await req.json();

  if (!actionType || !reason) {
    return NextResponse.json(
      { error: "actionType and reason are required" },
      { status: 400 }
    );
  }

  const validTypes = ["warn", "note", "ban", "kick"];
  if (!validTypes.includes(actionType)) {
    return NextResponse.json(
      { error: "Invalid action type" },
      { status: 400 }
    );
  }

  const { error } = await getSupabase().from("discipline_log").insert({
    target_discord_id: params.discordId,
    action_type: actionType,
    reason,
    guild_id: guildId || null,
    guild_name: guildName || null,
    moderator_discord_id: session.user.discordId,
    moderator_username: session.user.name || "Unknown",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
