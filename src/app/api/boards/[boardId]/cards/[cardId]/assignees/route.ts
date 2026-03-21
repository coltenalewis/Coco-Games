import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { isTeam } from "@/lib/roles";
import { sendDiscordDM } from "@/lib/discord";

// POST /api/boards/[boardId]/cards/[cardId]/assignees - assign user
export async function POST(
  req: NextRequest,
  { params }: { params: { boardId: string; cardId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId || !isTeam(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { discord_id } = await req.json();

  if (!discord_id) {
    return NextResponse.json({ error: "discord_id is required" }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("card_assignees")
    .insert({
      card_id: params.cardId,
      discord_id,
      assigned_by: session.user.discordId,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch card and board info for the DM
  const [cardRes, boardRes] = await Promise.all([
    supabase.from("cards").select("title").eq("id", params.cardId).maybeSingle(),
    supabase.from("boards").select("name").eq("id", params.boardId).maybeSingle(),
  ]);

  const card = cardRes.data;
  const board = boardRes.data;

  if (card && board) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    await sendDiscordDM(discord_id, {
      title: "You've been assigned to a card",
      description: `**${card.title}**\non board **${board.name}**`,
      color: 0xe8944a,
      url: `${siteUrl}/boards/${params.boardId}`,
      footer: { text: "COCO GAMES \u2022 Boards" },
      timestamp: new Date().toISOString(),
    });
  }

  return NextResponse.json(data, { status: 201 });
}

// DELETE /api/boards/[boardId]/cards/[cardId]/assignees - unassign user
export async function DELETE(
  req: NextRequest,
  { params }: { params: { boardId: string; cardId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId || !isTeam(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { discord_id } = await req.json();

  if (!discord_id) {
    return NextResponse.json({ error: "discord_id is required" }, { status: 400 });
  }

  const { error } = await getSupabase()
    .from("card_assignees")
    .delete()
    .eq("card_id", params.cardId)
    .eq("discord_id", discord_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
