import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { isStaff } from "@/lib/roles";

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

  // Check if staff can view this ticket category via permissions
  if (
    isStaff(session.user.role) &&
    ticket.user_discord_id !== session.user.discordId
  ) {
    const { getTicketCategories } = await import("@/lib/permissions");
    const allowed = await getTicketCategories(session.user.role);
    if (!allowed.includes(ticket.category)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
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

  const supabase = getSupabase();

  // If closing with a message, add it as a final message
  if (body.closing_message?.trim()) {
    await supabase.from("ticket_messages").insert({
      ticket_id: params.id,
      author_discord_id: session.user.discordId,
      content: body.closing_message.trim(),
    });
  }

  // Fetch ticket info for DM notification
  const { data: ticket } = await supabase
    .from("tickets")
    .select("user_discord_id, subject, status")
    .eq("id", params.id)
    .maybeSingle();

  const { error } = await supabase
    .from("tickets")
    .update(update)
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // DM the ticket creator about the status change
  if (ticket && body.status && body.status !== ticket.status) {
    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (botToken && ticket.user_discord_id) {
      try {
        // Open DM channel
        const dmRes = await fetch("https://discord.com/api/v10/users/@me/channels", {
          method: "POST",
          headers: {
            Authorization: `Bot ${botToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ recipient_id: ticket.user_discord_id }),
        });

        if (dmRes.ok) {
          const dmChannel = await dmRes.json();
          const statusLabel = body.status === "closed" ? "Closed" : body.status === "in_progress" ? "In Progress" : "Open";

          const embed: Record<string, unknown> = {
            title: `Ticket ${statusLabel}: ${ticket.subject}`,
            color: body.status === "closed" ? 0x9ca3af : body.status === "in_progress" ? 0xf59e0b : 0x22c55e,
            fields: [
              { name: "Status", value: statusLabel, inline: true },
              { name: "Ticket", value: ticket.subject, inline: true },
            ],
            footer: { text: "COCO GAMES \u2022 Support" },
            timestamp: new Date().toISOString(),
          };

          if (body.closing_message?.trim()) {
            embed.description = `**Staff Message:**\n${body.closing_message.trim()}`;
          }

          const url = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
          (embed.fields as Array<Record<string, unknown>>).push({
            name: "View Ticket",
            value: `[Open on site](${url}/tickets/${params.id})`,
            inline: false,
          });

          await fetch(`https://discord.com/api/v10/channels/${dmChannel.id}/messages`, {
            method: "POST",
            headers: {
              Authorization: `Bot ${botToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ embeds: [embed] }),
          });
        }
      } catch {
        // DM failed silently — user might have DMs disabled
      }
    }
  }

  return NextResponse.json({ success: true });
}
