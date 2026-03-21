import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { isTeam, hasMinRole } from "@/lib/roles";
import { sendDiscordDM } from "@/lib/discord";

const statusColors: Record<string, number> = {
  open: 0x3b82f6,
  approved: 0x22c55e,
  denied: 0xef4444,
  in_progress: 0xf59e0b,
  completed: 0x10b981,
  cancelled: 0x9ca3af,
};

const statusLabels: Record<string, string> = {
  open: "Open",
  approved: "Approved",
  denied: "Denied",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

// GET /api/requests/[requestId]
export async function GET(
  _req: NextRequest,
  { params }: { params: { requestId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId || !isTeam(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();

  const { data: request, error } = await supabase
    .from("internal_requests")
    .select("*")
    .eq("id", params.requestId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  // Fetch requester info
  const { data: requester } = await supabase
    .from("users")
    .select("discord_username, discord_avatar")
    .eq("discord_id", request.requester_discord_id)
    .maybeSingle();

  // Fetch assignee info if assigned
  let assignee = null;
  if (request.assigned_to) {
    const { data } = await supabase
      .from("users")
      .select("discord_username, discord_avatar")
      .eq("discord_id", request.assigned_to)
      .maybeSingle();
    assignee = data;
  }

  return NextResponse.json({
    ...request,
    requester_username: requester?.discord_username || "Unknown",
    requester_avatar: requester?.discord_avatar || null,
    assignee_username: assignee?.discord_username || null,
    assignee_avatar: assignee?.discord_avatar || null,
  });
}

// PATCH /api/requests/[requestId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { requestId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId || !hasMinRole(session.user.role, "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const update: Record<string, unknown> = {};

  if (body.status) {
    const validStatuses = ["open", "approved", "denied", "in_progress", "completed", "cancelled"];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    update.status = body.status;
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

  // Fetch current request for notifications
  const { data: request } = await supabase
    .from("internal_requests")
    .select("requester_discord_id, title, category, status, assigned_to")
    .eq("id", params.requestId)
    .maybeSingle();

  if (!request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  // Add comment if provided with a status change
  if (body.comment?.trim() && body.status) {
    await supabase.from("internal_request_comments").insert({
      request_id: params.requestId,
      author_discord_id: session.user.discordId,
      content: body.comment.trim(),
    });
  }

  const { error } = await supabase
    .from("internal_requests")
    .update(update)
    .eq("id", params.requestId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

  // DM requester on status change
  if (body.status && body.status !== request.status) {
    const statusLabel = statusLabels[body.status] || body.status;
    try {
      await sendDiscordDM(request.requester_discord_id, {
        title: `Request ${statusLabel}: ${request.title}`,
        color: statusColors[body.status],
        description: body.comment?.trim()
          ? `**Staff Note:**\n${body.comment.trim()}`
          : undefined,
        fields: [
          { name: "Category", value: request.category.replace("_", " "), inline: true },
          { name: "Status", value: statusLabel, inline: true },
          {
            name: "View",
            value: `[Open on site](${siteUrl}/requests/${params.requestId})`,
            inline: false,
          },
        ],
        footer: { text: "COCO GAMES \u2022 Internal Requests" },
        timestamp: new Date().toISOString(),
      });
    } catch {
      // DM failed silently
    }
  }

  // DM assignee when assigned_to changes
  if (
    body.assigned_to &&
    body.assigned_to !== request.assigned_to
  ) {
    try {
      await sendDiscordDM(body.assigned_to, {
        title: `You've been assigned: ${request.title}`,
        color: 0x3b82f6,
        fields: [
          { name: "Category", value: request.category.replace("_", " "), inline: true },
          {
            name: "View",
            value: `[Open on site](${siteUrl}/requests/${params.requestId})`,
            inline: false,
          },
        ],
        footer: { text: "COCO GAMES \u2022 Internal Requests" },
        timestamp: new Date().toISOString(),
      });
    } catch {
      // DM failed silently
    }
  }

  return NextResponse.json({ success: true });
}
