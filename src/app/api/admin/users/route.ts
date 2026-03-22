import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { hasMinRole } from "@/lib/roles";

// GET /api/admin/users?q=searchterm&page=1
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !hasMinRole(session.user?.role, "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  let dbQuery = getSupabase()
    .from("users")
    .select("id, discord_id, discord_username, discord_avatar, roblox_id, roblox_username, role, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (query) {
    dbQuery = dbQuery.or(
      `discord_username.ilike.%${query}%,discord_id.eq.${query}`
    );
  }

  const { data, error, count } = await dbQuery;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    users: data || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  });
}

// PATCH /api/admin/users - update user role
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "owner") {
    return NextResponse.json(
      { error: "Only the owner can change roles" },
      { status: 403 }
    );
  }

  const { discordId, role } = await req.json();

  if (!discordId || !role) {
    return NextResponse.json(
      { error: "discordId and role are required" },
      { status: 400 }
    );
  }

  const validRoles = ["owner", "executive", "admin", "developer", "coordinator", "mod", "contractor", "user"];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Prevent changing your own role
  if (discordId === session.user.discordId) {
    return NextResponse.json(
      { error: "Cannot change your own role" },
      { status: 400 }
    );
  }

  const supabase = getSupabase();

  const { error } = await supabase
    .from("users")
    .update({ role })
    .eq("discord_id", discordId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Sync Discord roles across all configured guilds
  const syncResults: { guildId: string; success: boolean; error?: string }[] = [];

  try {
    const { data: configs } = await supabase
      .from("guild_configs")
      .select("guild_id, moderator_role_id, coordinator_role_id, admin_role_id, developer_role_id, contractor_role_id, executive_role_id, owner_role_id");

    if (configs && configs.length > 0) {
      const { addGuildMemberRole, removeGuildMemberRole } = await import("@/lib/discord");

      // Map: site role -> which discord role columns they should have
      const roleMapping: Record<string, string[]> = {
        owner: ["owner_role_id", "executive_role_id", "admin_role_id", "developer_role_id", "coordinator_role_id", "moderator_role_id"],
        executive: ["executive_role_id", "admin_role_id", "developer_role_id", "coordinator_role_id", "moderator_role_id"],
        admin: ["admin_role_id", "developer_role_id", "coordinator_role_id", "moderator_role_id"],
        developer: ["developer_role_id", "coordinator_role_id", "moderator_role_id"],
        coordinator: ["coordinator_role_id", "moderator_role_id"],
        mod: ["moderator_role_id"],
        contractor: ["contractor_role_id"],
        user: [],
      };

      const allRoleColumns = ["owner_role_id", "executive_role_id", "admin_role_id", "developer_role_id", "coordinator_role_id", "moderator_role_id", "contractor_role_id"];
      const shouldHave = new Set(roleMapping[role] || []);

      for (const config of configs) {
        try {
          for (const col of allRoleColumns) {
            const discordRoleId = (config as Record<string, string | null>)[col];
            if (!discordRoleId) continue;

            if (shouldHave.has(col)) {
              await addGuildMemberRole(config.guild_id, discordId, discordRoleId);
            } else {
              await removeGuildMemberRole(config.guild_id, discordId, discordRoleId);
            }
          }

          syncResults.push({ guildId: config.guild_id, success: true });
        } catch (err) {
          syncResults.push({
            guildId: config.guild_id,
            success: false,
            error: err instanceof Error ? err.message : "Unknown",
          });
        }
      }
    }
  } catch {
    // Role sync is best-effort, don't fail the request
  }

  return NextResponse.json({
    success: true,
    roleSync: {
      synced: syncResults.filter((r) => r.success).length,
      failed: syncResults.filter((r) => !r.success).length,
    },
  });
}
