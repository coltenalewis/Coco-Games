import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { isTeam } from "@/lib/roles";

// GET /api/boards/[boardId]/cards/[cardId]/checklists - list checklists with items
export async function GET(
  _req: NextRequest,
  { params }: { params: { boardId: string; cardId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();

  const checklistsRes = await supabase.from("card_checklists").select("*").eq("card_id", params.cardId).order("position");

  if (checklistsRes.error) {
    return NextResponse.json({ error: checklistsRes.error.message }, { status: 500 });
  }

  const checklistIds = (checklistsRes.data || []).map((c: { id: string }) => c.id);
  const itemsRes = checklistIds.length > 0
    ? await supabase.from("checklist_items").select("*").in("checklist_id", checklistIds).order("position")
    : { data: [] };

  const checklists = (checklistsRes.data || []).map((cl: { id: string }) => ({
    ...cl,
    items: (itemsRes.data || []).filter((item: { checklist_id: string }) => item.checklist_id === cl.id),
  }));

  return NextResponse.json({ checklists });
}

// POST /api/boards/[boardId]/cards/[cardId]/checklists - create checklist
export async function POST(
  req: NextRequest,
  { params }: { params: { boardId: string; cardId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId || !isTeam(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title } = await req.json();

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const { data, error } = await getSupabase()
    .from("card_checklists")
    .insert({
      card_id: params.cardId,
      title: title.trim(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/boards/[boardId]/cards/[cardId]/checklists - toggle checklist item
export async function PATCH(
  req: NextRequest,
  { params }: { params: { boardId: string; cardId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId || !isTeam(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { itemId, completed } = await req.json();

  if (!itemId || completed === undefined) {
    return NextResponse.json({ error: "itemId and completed are required" }, { status: 400 });
  }

  const { error } = await getSupabase()
    .from("checklist_items")
    .update({ completed })
    .eq("id", itemId)
    .eq("card_id", params.cardId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
