import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { hasMinRole } from "@/lib/roles";
import { sendDiscordDM } from "@/lib/discord";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sendId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sendId } = await params;
  const supabase = getSupabase();

  const { data: send, error } = await supabase
    .from("document_sends")
    .select("*")
    .eq("id", sendId)
    .single();

  if (error || !send) {
    return NextResponse.json({ error: "Send not found" }, { status: 404 });
  }

  // Recipient can view their own, executives can view any
  const isRecipient = send.recipient_discord_id === session.user.discordId;
  const isExecutive = hasMinRole(session.user.role, "executive");

  if (!isRecipient && !isExecutive) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch full document content
  const { data: doc } = await supabase
    .from("documents")
    .select("*")
    .eq("id", send.document_id)
    .single();

  // Fetch form fields for this document
  const { data: fields } = await supabase
    .from("document_fields")
    .select("*")
    .eq("document_id", send.document_id)
    .order("position", { ascending: true });

  // Fetch sender and recipient usernames
  const { data: users } = await supabase
    .from("users")
    .select("discord_id, username")
    .in("discord_id", [send.sender_discord_id, send.recipient_discord_id]);

  const userMap = new Map(
    (users || []).map((u: { discord_id: string; username: string }) => [
      u.discord_id,
      u.username,
    ])
  );

  return NextResponse.json({
    ...send,
    document: doc || null,
    fields: fields || [],
    form_responses: send.form_responses || {},
    sender_username: userMap.get(send.sender_discord_id) || null,
    recipient_username: userMap.get(send.recipient_discord_id) || null,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sendId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sendId } = await params;
  const supabase = getSupabase();

  // Fetch the existing send
  const { data: send, error: fetchError } = await supabase
    .from("document_sends")
    .select("*")
    .eq("id", sendId)
    .single();

  if (fetchError || !send) {
    return NextResponse.json({ error: "Send not found" }, { status: 404 });
  }

  // Only the recipient can update
  if (send.recipient_discord_id !== session.user.discordId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { form_responses, signature_data, status, decline_reason } = body;

  const updates: Record<string, unknown> = {};

  if (form_responses !== undefined) {
    updates.form_responses = form_responses;
  }

  if (signature_data !== undefined) {
    updates.signature_data = signature_data;
  }

  if (status === "completed") {
    updates.status = "completed";
    updates.completed_at = new Date().toISOString();
  } else if (status === "declined") {
    updates.status = "declined";
    updates.declined_at = new Date().toISOString();
    if (decline_reason) {
      updates.decline_reason = decline_reason;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  const { data: updated, error: updateError } = await supabase
    .from("document_sends")
    .update(updates)
    .eq("id", sendId)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // If status changed, DM the sender
  if (status === "completed" || status === "declined") {
    // Fetch document title and recipient username for the notification
    const { data: doc } = await supabase
      .from("documents")
      .select("title")
      .eq("id", send.document_id)
      .single();

    const { data: recipientUser } = await supabase
      .from("users")
      .select("username")
      .eq("discord_id", session.user.discordId)
      .single();

    const recipientName =
      recipientUser?.username || session.user.name || "Unknown";
    const docTitle = doc?.title || "Untitled Document";

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000";

    if (status === "completed") {
      await sendDiscordDM(send.sender_discord_id, {
        title: "\u2705 Document Completed",
        description: `**${docTitle}**\n\n${recipientName} has signed and completed this document.`,
        color: 0x57f287,
        fields: [
          {
            name: "View Document",
            value: `[Open Document](${siteUrl}/inbox/${sendId})`,
            inline: false,
          },
        ],
        footer: { text: "COCO GAMES \u2022 Documents" },
        timestamp: new Date().toISOString(),
      });
    } else if (status === "declined") {
      await sendDiscordDM(send.sender_discord_id, {
        title: "\u274C Document Declined",
        description: `**${docTitle}**\n\n${recipientName} has declined this document.${decline_reason ? `\n\nReason: "${decline_reason}"` : ""}`,
        color: 0xed4245,
        fields: [
          {
            name: "View Document",
            value: `[Open Document](${siteUrl}/inbox/${sendId})`,
            inline: false,
          },
        ],
        footer: { text: "COCO GAMES \u2022 Documents" },
        timestamp: new Date().toISOString(),
      });
    }
  }

  return NextResponse.json(updated);
}
