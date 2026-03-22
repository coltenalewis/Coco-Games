import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { hasMinRole } from "@/lib/roles";
import type { UserRole } from "@/lib/roles";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId || !hasMinRole(session.user.role as UserRole, "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const action = searchParams.get("action");
  const actor = searchParams.get("actor");
  const targetType = searchParams.get("target_type");
  const limit = 50;
  const offset = (page - 1) * limit;

  let query = getSupabase()
    .from("audit_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (action) query = query.eq("action", action);
  if (actor) query = query.eq("actor_discord_id", actor);
  if (targetType) query = query.eq("target_type", targetType);

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich with actor usernames
  const actorIds = Array.from(new Set((data || []).map((l: { actor_discord_id: string }) => l.actor_discord_id)));
  const { data: users } = actorIds.length > 0
    ? await getSupabase().from("users").select("discord_id, discord_username").in("discord_id", actorIds)
    : { data: [] };

  const userMap = new Map((users || []).map((u: { discord_id: string; discord_username: string }) => [u.discord_id, u.discord_username]));

  const enriched = (data || []).map((log: { actor_discord_id: string }) => ({
    ...log,
    actor_username: userMap.get(log.actor_discord_id) || log.actor_discord_id,
  }));

  return NextResponse.json({
    logs: enriched,
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  });
}
