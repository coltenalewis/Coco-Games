import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { isTeam } from "@/lib/roles";

// GET checklists with items
export async function GET(
  _req: NextRequest,
  { params }: { params: { boardId: string; cardId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId || !isTeam(session.user.role)) {
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

  return NextResponse.json(checklists);
}

// POST - create checklist OR add item to checklist
export async function POST(
  req: NextRequest,
  { params }: { params: { boardId: string; cardId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId || !isTeam(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const supabase = getSupabase();

  // If checklist_id is provided, add an item to that checklist
  if (body.checklist_id) {
    if (!body.content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // Get next position
    const { data: last } = await supabase
      .from("checklist_items")
      .select("position")
      .eq("checklist_id", body.checklist_id)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    const position = (last?.position ?? -1) + 1;

    const { data, error } = await supabase
      .from("checklist_items")
      .insert({
        checklist_id: body.checklist_id,
        content: body.content.trim(),
        position,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  }

  // Otherwise, create a new checklist
  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const { data: last } = await supabase
    .from("card_checklists")
    .select("position")
    .eq("card_id", params.cardId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const position = (last?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from("card_checklists")
    .insert({
      card_id: params.cardId,
      title: body.title.trim(),
      position,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PATCH - toggle checklist item
export async function PATCH(
  req: NextRequest,
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
    .update({
      completed,
      completed_by: completed ? session.user.discordId : null,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq("id", itemId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

// DELETE - delete a checklist
export async function DELETE(
  req: NextRequest,
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId || !isTeam(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { checklistId } = await req.json();
  if (!checklistId) {
    return NextResponse.json({ error: "checklistId required" }, { status: 400 });
  }

  // Delete items first, then checklist
  const supabase = getSupabase();
  await supabase.from("checklist_items").delete().eq("checklist_id", checklistId);
  const { error } = await supabase.from("card_checklists").delete().eq("id", checklistId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
