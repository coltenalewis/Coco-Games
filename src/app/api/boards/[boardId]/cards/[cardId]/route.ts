import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { isTeam } from "@/lib/roles";

// GET /api/boards/[boardId]/cards/[cardId] - full card detail
export async function GET(
  _req: NextRequest,
  { params }: { params: { boardId: string; cardId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();

  const { data: card, error } = await supabase
    .from("cards")
    .select("*")
    .eq("id", params.cardId)
    .eq("board_id", params.boardId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });

  const [checklistsRes, commentsRes, assigneesRes, labelsRes, attachmentsRes] = await Promise.all([
    supabase.from("card_checklists").select("*").eq("card_id", params.cardId).order("position"),
    supabase.from("card_comments").select("*").eq("card_id", params.cardId).order("created_at", { ascending: false }),
    supabase.from("card_assignees").select("*").eq("card_id", params.cardId),
    supabase.from("card_labels").select("*, board_labels(*)").eq("card_id", params.cardId),
    supabase.from("card_attachments").select("*").eq("card_id", params.cardId).order("created_at"),
  ]);

  // Fetch checklist items for all checklists
  const checklistIds = (checklistsRes.data || []).map((c: { id: string }) => c.id);
  const { data: allItems } = checklistIds.length > 0
    ? await supabase.from("checklist_items").select("*").in("checklist_id", checklistIds).order("position")
    : { data: [] };

  // Enrich comments with author info
  const authorIds = Array.from(new Set((commentsRes.data || []).map((c: { author_discord_id: string }) => c.author_discord_id)));
  const { data: authors } = authorIds.length > 0
    ? await supabase.from("users").select("discord_id, discord_username, discord_avatar, role").in("discord_id", authorIds)
    : { data: [] };
  const authorMap = new Map((authors || []).map((a: { discord_id: string }) => [a.discord_id, a]));

  return NextResponse.json({
    ...card,
    checklists: checklistsRes.data || [],
    checklist_items: allItems || [],
    comments: (commentsRes.data || []).map((c: { author_discord_id: string }) => ({
      ...c,
      ...(authorMap.get(c.author_discord_id) || {}),
    })),
    assignees: assigneesRes.data || [],
    labels: labelsRes.data || [],
    attachments: attachmentsRes.data || [],
  });
}

// PATCH /api/boards/[boardId]/cards/[cardId] - update card fields
export async function PATCH(
  req: NextRequest,
  { params }: { params: { boardId: string; cardId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId || !isTeam(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const update: Record<string, unknown> = {};

  if (body.title !== undefined) update.title = body.title.trim();
  if (body.description !== undefined) update.description = body.description?.trim() || null;
  if (body.priority !== undefined) update.priority = body.priority;
  if (body.due_date !== undefined) update.due_date = body.due_date || null;
  if (body.cover_color !== undefined) update.cover_color = body.cover_color || null;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const { error } = await getSupabase()
    .from("cards")
    .update(update)
    .eq("id", params.cardId)
    .eq("board_id", params.boardId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

// DELETE /api/boards/[boardId]/cards/[cardId] - archive card
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { boardId: string; cardId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId || !isTeam(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await getSupabase()
    .from("cards")
    .update({ archived: true })
    .eq("id", params.cardId)
    .eq("board_id", params.boardId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
