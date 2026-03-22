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
    .select("discord_id, discord_username, discord_avatar, role, roblox_username")
    .in("discord_id", authorIds);

  const authorMap = new Map(
    (authors || []).map((a) => [a.discord_id, a])
  );

  // Fetch staff tags from site_permissions
  const { data: tagPerms } = await supabase
    .from("site_permissions")
    .select("permission_key, permission_label")
    .like("permission_key", "tag.%");

  const tagMap = new Map<string, string>();
  (tagPerms || []).forEach((perm) => {
    // permission_key format: "tag.{role}"
    const role = perm.permission_key.replace("tag.", "");
    tagMap.set(role, perm.permission_label);
  });

  const enrichedMessages = (messages || []).map((msg) => {
    const author = authorMap.get(msg.author_discord_id);
    const authorRole = author?.role || "user";
    const staffMember = authorRole !== "user";
    const staffTag = staffMember ? tagMap.get(authorRole) || null : null;

    return {
      ...msg,
      author_username: author?.discord_username || "Unknown",
      author_avatar: author?.discord_avatar || null,
      author_role: authorRole,
      author_roblox_username: author?.roblox_username || null,
      is_staff: staffMember,
      staff_tag: staffTag,
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

  // Staff reply handling
  if (
    isStaff(session.user.role) &&
    ticket.user_discord_id !== session.user.discordId
  ) {
    const updates: Record<string, unknown> = {};

    // Auto-set to in_progress on first staff reply
    if (ticket.status === "open") {
      updates.status = "in_progress";
      updates.assigned_to = session.user.discordId;
    }

    // Track first response time
    const { data: fullTicket } = await supabase
      .from("tickets")
      .select("first_response_at")
      .eq("id", params.id)
      .maybeSingle();

    if (!fullTicket?.first_response_at) {
      updates.first_response_at = new Date().toISOString();
    }

    if (Object.keys(updates).length > 0) {
      await supabase.from("tickets").update(updates).eq("id", params.id);
    }
  }

  return NextResponse.json(message, { status: 201 });
}
