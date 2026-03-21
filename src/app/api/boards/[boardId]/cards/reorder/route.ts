import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { isTeam } from "@/lib/roles";

// PATCH /api/boards/[boardId]/cards/reorder - move a card
export async function PATCH(
  req: NextRequest,
  { params }: { params: { boardId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId || !isTeam(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cardId, targetListId, newPosition } = await req.json();

  if (!cardId || !targetListId || newPosition === undefined) {
    return NextResponse.json({ error: "cardId, targetListId, and newPosition are required" }, { status: 400 });
  }

  const supabase = getSupabase();

  // Get the card's current list
  const { data: card } = await supabase
    .from("cards")
    .select("list_id")
    .eq("id", cardId)
    .eq("board_id", params.boardId)
    .maybeSingle();

  if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });

  const sourceListId = card.list_id;

  // Move the card
  const { error } = await supabase
    .from("cards")
    .update({ list_id: targetListId, position: newPosition })
    .eq("id", cardId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Re-index positions in the target list
  const { data: targetCards } = await supabase
    .from("cards")
    .select("id")
    .eq("list_id", targetListId)
    .eq("board_id", params.boardId)
    .eq("archived", false)
    .neq("id", cardId)
    .order("position");

  if (targetCards) {
    const reordered = [
      ...targetCards.slice(0, newPosition).map((c: { id: string }) => c.id),
      cardId,
      ...targetCards.slice(newPosition).map((c: { id: string }) => c.id),
    ];
    for (let i = 0; i < reordered.length; i++) {
      await supabase
        .from("cards")
        .update({ position: i })
        .eq("id", reordered[i]);
    }
  }

  // Re-index source list if different
  if (sourceListId !== targetListId) {
    const { data: sourceCards } = await supabase
      .from("cards")
      .select("id")
      .eq("list_id", sourceListId)
      .eq("board_id", params.boardId)
      .eq("archived", false)
      .order("position");

    if (sourceCards) {
      for (let i = 0; i < sourceCards.length; i++) {
        await supabase
          .from("cards")
          .update({ position: i })
          .eq("id", sourceCards[i].id);
      }
    }
  }

  return NextResponse.json({ success: true });
}
