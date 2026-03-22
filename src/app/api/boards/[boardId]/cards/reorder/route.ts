import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { isTeam } from "@/lib/roles";

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

  // Get card's current list
  const { data: card } = await supabase
    .from("cards")
    .select("list_id, position")
    .eq("id", cardId)
    .eq("board_id", params.boardId)
    .maybeSingle();

  if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });

  const sourceListId = card.list_id;

  // Update the card's list and position
  await supabase.from("cards").update({ list_id: targetListId, position: newPosition }).eq("id", cardId);

  // Re-index ALL cards in the target list in the correct order
  const { data: targetCards } = await supabase
    .from("cards")
    .select("id")
    .eq("list_id", targetListId)
    .eq("board_id", params.boardId)
    .eq("archived", false)
    .order("position")
    .order("updated_at", { ascending: false });

  if (targetCards) {
    // Put the moved card at the right position, others around it
    const others = targetCards.filter((c: { id: string }) => c.id !== cardId).map((c: { id: string }) => c.id);
    const final = [...others.slice(0, newPosition), cardId, ...others.slice(newPosition)];
    for (let i = 0; i < final.length; i++) {
      await supabase.from("cards").update({ position: i }).eq("id", final[i]);
    }
  }

  // Re-index source list if moved between lists
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
        await supabase.from("cards").update({ position: i }).eq("id", sourceCards[i].id);
      }
    }
  }

  return NextResponse.json({ success: true });
}
