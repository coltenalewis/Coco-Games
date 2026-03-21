import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { isTeam } from "@/lib/roles";

// GET /api/requests/[requestId]/comments
export async function GET(
  _req: NextRequest,
  { params }: { params: { requestId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId || !isTeam(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();

  // Verify request exists
  const { data: request } = await supabase
    .from("internal_requests")
    .select("id")
    .eq("id", params.requestId)
    .maybeSingle();

  if (!request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  const { data: comments, error } = await supabase
    .from("internal_request_comments")
    .select("*")
    .eq("request_id", params.requestId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Enrich with author info
  const authorIds = Array.from(
    new Set((comments || []).map((c) => c.author_discord_id))
  );

  if (authorIds.length === 0) {
    return NextResponse.json([]);
  }

  const { data: authors } = await supabase
    .from("users")
    .select("discord_id, discord_username, role")
    .in("discord_id", authorIds);

  const authorMap = new Map(
    (authors || []).map((a) => [a.discord_id, a])
  );

  const enriched = (comments || []).map((c) => {
    const author = authorMap.get(c.author_discord_id);
    return {
      ...c,
      author_username: author?.discord_username || "Unknown",
      author_role: author?.role || "user",
    };
  });

  return NextResponse.json(enriched);
}

// POST /api/requests/[requestId]/comments
export async function POST(
  req: NextRequest,
  { params }: { params: { requestId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId || !isTeam(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();

  // Verify request exists
  const { data: request } = await supabase
    .from("internal_requests")
    .select("id")
    .eq("id", params.requestId)
    .maybeSingle();

  if (!request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  const { content } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json(
      { error: "Content is required" },
      { status: 400 }
    );
  }

  const { data: comment, error } = await supabase
    .from("internal_request_comments")
    .insert({
      request_id: params.requestId,
      author_discord_id: session.user.discordId,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(comment, { status: 201 });
}
