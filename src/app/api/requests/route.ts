import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { isTeam } from "@/lib/roles";

// GET /api/requests?status=open&category=bug_report&page=1
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId || !isTeam(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = getSupabase()
    .from("internal_requests")
    .select("*, users!requests_requester_discord_id_fkey(discord_username)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status && status !== "all") {
    query = query.eq("status", status);
  }
  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const requests = (data || []).map((r) => ({
    ...r,
    requester_username: r.users?.discord_username || "Unknown",
    users: undefined,
  }));

  return NextResponse.json({
    requests,
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  });
}

// POST /api/requests
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId || !isTeam(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { category, title, description, priority } = await req.json();

  if (!title?.trim() || !description?.trim()) {
    return NextResponse.json(
      { error: "Title and description are required" },
      { status: 400 }
    );
  }

  const validCategories = [
    "feature_request",
    "bug_report",
    "resource_request",
    "time_off",
    "access_request",
    "general",
  ];
  if (!validCategories.includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const validPriorities = ["low", "normal", "high", "urgent"];
  const safePriority = validPriorities.includes(priority) ? priority : "normal";

  const { data, error } = await getSupabase()
    .from("internal_requests")
    .insert({
      requester_discord_id: session.user.discordId,
      category,
      title: title.trim(),
      description: description.trim(),
      priority: safePriority,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
