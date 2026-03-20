import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { hasMinRole } from "@/lib/roles";

// GET /api/admin/discipline?type=ban&q=123&page=1
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !hasMinRole(session.user?.role, "mod")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const query = searchParams.get("q");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = 25;
  const offset = (page - 1) * limit;

  let dbQuery = getSupabase()
    .from("discipline_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (type && type !== "all") {
    dbQuery = dbQuery.eq("action_type", type);
  }

  if (query) {
    dbQuery = dbQuery.eq("target_discord_id", query);
  }

  const { data, error, count } = await dbQuery;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    entries: data || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  });
}
