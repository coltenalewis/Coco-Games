import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { hasMinRole } from "@/lib/roles";

export async function GET(
  _req: NextRequest,
  { params }: { params: { guildId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !hasMinRole(session.user?.role, "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await getSupabase()
    .from("guild_configs")
    .select(
      "guild_id, welcome_enabled, welcome_channel, welcome_message, auto_roles, verified_role_id, moderator_role_id, admin_role_id, announcement_channel"
    )
    .eq("guild_id", params.guildId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({});
  }

  return NextResponse.json({
    welcomeEnabled: data.welcome_enabled,
    welcomeChannel: data.welcome_channel,
    welcomeMessage: data.welcome_message,
    autoRoles: data.auto_roles,
    verifiedRoleId: data.verified_role_id,
    moderatorRoleId: data.moderator_role_id,
    adminRoleId: data.admin_role_id,
    announcementChannel: data.announcement_channel,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { guildId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !hasMinRole(session.user?.role, "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const { error } = await getSupabase().from("guild_configs").upsert(
    {
      guild_id: params.guildId,
      welcome_enabled: body.welcomeEnabled ?? false,
      welcome_channel: body.welcomeChannel || null,
      welcome_message: body.welcomeMessage || null,
      auto_roles: body.autoRoles || [],
      verified_role_id: body.verifiedRoleId || null,
      moderator_role_id: body.moderatorRoleId || null,
      admin_role_id: body.adminRoleId || null,
      announcement_channel: body.announcementChannel || null,
    },
    { onConflict: "guild_id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
