import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { isStaff } from "@/lib/roles";

// GET /api/tickets/[id]/messages
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();

  // Verify access to this ticket
  const { data: ticket } = await supabase
    .from("tickets")
    .select("user_discord_id")
    .eq("id", params.id)
    .maybeSingle();

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  if (
    !isStaff(session.user.role) &&
    ticket.user_discord_id !== session.user.discordId
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: messages, error } = await supabase
    .from("ticket_messages")
    .select("*")
    .eq("ticket_id", params.id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch usernames for all message authors
  const authorIds = Array.from(new Set((messages || []).map((m) => m.author_discord_id)));
  const { data: authors } = await supabase
    .from("users")
    .select("discord_id, discord_username, discord_avatar, role")
    .in("discord_id", authorIds);

  const authorMap = new Map(
    (authors || []).map((a) => [a.discord_id, a])
  );

  const enrichedMessages = (messages || []).map((msg) => {
    const author = authorMap.get(msg.author_discord_id);
    return {
      ...msg,
      author_username: author?.discord_username || "Unknown",
      author_avatar: author?.discord_avatar || null,
      author_role: author?.role || "user",
    };
  });

  return NextResponse.json(enrichedMessages);
}

// POST /api/tickets/[id]/messages
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();

  // Verify access to this ticket
  const { data: ticket } = await supabase
    .from("tickets")
    .select("user_discord_id, status")
    .eq("id", params.id)
    .maybeSingle();

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  if (
    !isStaff(session.user.role) &&
    ticket.user_discord_id !== session.user.discordId
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (ticket.status === "closed") {
    return NextResponse.json(
      { error: "Cannot message a closed ticket" },
      { status: 400 }
    );
  }

  const { content, imageUrl } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json(
      { error: "Message content is required" },
      { status: 400 }
    );
  }

  const { data: message, error } = await supabase
    .from("ticket_messages")
    .insert({
      ticket_id: params.id,
      author_discord_id: session.user.discordId,
      content: content.trim(),
      image_url: imageUrl || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Auto-set ticket to in_progress if staff replies to an open ticket
  if (
    isStaff(session.user.role) &&
    ticket.status === "open" &&
    ticket.user_discord_id !== session.user.discordId
  ) {
    await supabase
      .from("tickets")
      .update({ status: "in_progress", assigned_to: session.user.discordId })
      .eq("id", params.id);
  }

  return NextResponse.json(message, { status: 201 });
}
