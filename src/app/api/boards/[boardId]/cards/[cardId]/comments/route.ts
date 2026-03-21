import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { isTeam } from "@/lib/roles";

// GET /api/boards/[boardId]/cards/[cardId]/comments - list comments
export async function GET(
  _req: NextRequest,
  { params }: { params: { boardId: string; cardId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await getSupabase()
    .from("card_comments")
    .select("*, users(discord_username, discord_avatar)")
    .eq("card_id", params.cardId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ comments: data || [] });
}

// POST /api/boards/[boardId]/cards/[cardId]/comments - add comment
export async function POST(
  req: NextRequest,
  { params }: { params: { boardId: string; cardId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId || !isTeam(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { content } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const { data, error } = await getSupabase()
    .from("card_comments")
    .insert({
      card_id: params.cardId,
      author_discord_id: session.user.discordId,
      content: content.trim(),
    })
    .select("*, users(discord_username, discord_avatar)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
