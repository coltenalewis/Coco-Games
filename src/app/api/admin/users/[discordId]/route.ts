import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { hasMinRole } from "@/lib/roles";
export const runtime = 'edge';

export async function GET(
  _req: NextRequest,
  { params }: { params: { discordId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !hasMinRole(session.user?.role, "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: user, error } = await getSupabase()
    .from("users")
    .select("*")
    .eq("discord_id", params.discordId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}
