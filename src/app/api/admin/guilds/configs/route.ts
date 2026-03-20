import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasMinRole } from "@/lib/roles";
import { getSupabase } from "@/lib/supabase";

// GET /api/admin/guilds/configs - get all guild configurations
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !hasMinRole(session.user?.role, "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await getSupabase()
    .from("guild_configs")
    .select("guild_id, welcome_enabled, announcement_channel");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
