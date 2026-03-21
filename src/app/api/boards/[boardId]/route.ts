import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

// GET /api/boards/[boardId]
export async function GET(
  _req: NextRequest,
  { params }: { params: { boardId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  const { data: board, error } = await supabase
    .from("boards")
    .select("*")
    .eq("id", params.boardId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!board) return NextResponse.json({ error: "Board not found" }, { status: 404 });

  const userRole = session.user.role || "user";
  if (!(board.view_roles || []).includes(userRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [listsRes, cardsRes, labelsRes] = await Promise.all([
    supabase.from("board_lists").select("*").eq("board_id", params.boardId).order("position"),
    supabase.from("cards").select("*").eq("board_id", params.boardId).eq("archived", false).order("position"),
    supabase.from("board_labels").select("*").eq("board_id", params.boardId),
  ]);

  // Fetch assignees and card-label assignments for all cards
  const cardIds = (cardsRes.data || []).map((c: { id: string }) => c.id);

  const [assigneesRes, cardLabelsRes] = cardIds.length > 0
    ? await Promise.all([
        supabase.from("card_assignees").select("card_id, discord_id").in("card_id", cardIds),
        supabase.from("card_labels").select("card_id, label_id").in("card_id", cardIds),
      ])
    : [{ data: [] }, { data: [] }];

  return NextResponse.json({
    ...board,
    canEdit: (board.edit_roles || []).includes(userRole),
    lists: listsRes.data || [],
    cards: cardsRes.data || [],
    labels: labelsRes.data || [],
    assignees: assigneesRes.data || [],
    cardLabels: cardLabelsRes.data || [],
  });
}

// PATCH /api/boards/[boardId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { boardId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only owner can edit board settings
  if (session.user.role !== "owner") {
    return NextResponse.json({ error: "Only the owner can edit board settings" }, { status: 403 });
  }

  const body = await req.json();
  const update: Record<string, unknown> = {};

  if (body.name !== undefined) update.name = body.name.trim();
  if (body.description !== undefined) update.description = body.description?.trim() || null;
  if (body.color !== undefined) update.color = body.color;
  if (body.view_roles !== undefined) update.view_roles = body.view_roles;
  if (body.edit_roles !== undefined) update.edit_roles = body.edit_roles;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const { error } = await getSupabase()
    .from("boards")
    .update(update)
    .eq("id", params.boardId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE /api/boards/[boardId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { boardId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId || session.user.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await getSupabase()
    .from("boards")
    .update({ archived: true })
    .eq("id", params.boardId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
