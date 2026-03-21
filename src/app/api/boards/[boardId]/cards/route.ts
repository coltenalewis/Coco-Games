import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { isTeam } from "@/lib/roles";

// POST /api/boards/[boardId]/cards - create a card
export async function POST(
  req: NextRequest,
  { params }: { params: { boardId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId || !isTeam(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { list_id, title, description, priority, due_date } = await req.json();

  if (!list_id || !title?.trim()) {
    return NextResponse.json({ error: "list_id and title are required" }, { status: 400 });
  }

  const supabase = getSupabase();

  // Get next position in the list
  const { data: last } = await supabase
    .from("cards")
    .select("position")
    .eq("list_id", list_id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const position = (last?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from("cards")
    .insert({
      board_id: params.boardId,
      list_id,
      title: title.trim(),
      description: description?.trim() || null,
      priority: priority || "normal",
      due_date: due_date || null,
      position,
      created_by: session.user.discordId,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
