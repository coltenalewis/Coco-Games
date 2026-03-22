import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { isTeam } from "@/lib/roles";

// POST /api/boards/[boardId]/lists - create a list
export async function POST(
  req: NextRequest,
  { params }: { params: { boardId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId || !isTeam(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const supabase = getSupabase();

  // Get next position
  const { data: last } = await supabase
    .from("board_lists")
    .select("position")
    .eq("board_id", params.boardId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const position = (last?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from("board_lists")
    .insert({
      board_id: params.boardId,
      name: name.trim(),
      position,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/boards/[boardId]/lists - reorder lists
export async function PATCH(
  req: NextRequest,
  { params }: { params: { boardId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId || !isTeam(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lists } = await req.json() as { lists: { id: string; position: number }[] };

  if (!Array.isArray(lists)) {
    return NextResponse.json({ error: "lists array is required" }, { status: 400 });
  }

  const supabase = getSupabase();

  for (const item of lists) {
    await supabase
      .from("board_lists")
      .update({ position: item.position })
      .eq("id", item.id)
      .eq("board_id", params.boardId);
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/boards/[boardId]/lists - delete a list (moves cards to first list or deletes them)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { boardId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId || !isTeam(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { listId } = await req.json();
  if (!listId) {
    return NextResponse.json({ error: "listId is required" }, { status: 400 });
  }

  const supabase = getSupabase();

  // Archive all cards in this list
  await supabase
    .from("cards")
    .update({ archived: true })
    .eq("list_id", listId)
    .eq("board_id", params.boardId);

  // Delete the list
  const { error } = await supabase
    .from("board_lists")
    .delete()
    .eq("id", listId)
    .eq("board_id", params.boardId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
