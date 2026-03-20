import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { isStaff } from "@/lib/roles";
export const runtime = 'edge';

// GET /api/tickets/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: ticket, error } = await getSupabase()
    .from("tickets")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  // Non-staff can only view their own tickets
  if (
    !isStaff(session.user.role) &&
    ticket.user_discord_id !== session.user.discordId
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch the ticket creator's username
  const { data: creator } = await getSupabase()
    .from("users")
    .select("discord_username, discord_avatar")
    .eq("discord_id", ticket.user_discord_id)
    .maybeSingle();

  return NextResponse.json({
    ...ticket,
    creator_username: creator?.discord_username || "Unknown",
    creator_avatar: creator?.discord_avatar || null,
  });
}

// PATCH /api/tickets/[id] - update status, priority, assignment
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId || !isStaff(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const update: Record<string, unknown> = {};

  if (body.status) {
    const validStatuses = ["open", "in_progress", "closed"];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    update.status = body.status;
    if (body.status === "closed") {
      update.closed_at = new Date().toISOString();
    }
  }

  if (body.priority) {
    const validPriorities = ["low", "normal", "high", "urgent"];
    if (!validPriorities.includes(body.priority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    }
    update.priority = body.priority;
  }

  if (body.assigned_to !== undefined) {
    update.assigned_to = body.assigned_to || null;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const { error } = await getSupabase()
    .from("tickets")
    .update(update)
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
