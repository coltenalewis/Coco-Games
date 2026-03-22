import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { hasMinRole } from "@/lib/roles";
import { sendDiscordDM } from "@/lib/discord";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !hasMinRole(session.user?.role, "executive")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { document_id, recipient_discord_id, message, expires_days } = body;

  if (!document_id || !recipient_discord_id) {
    return NextResponse.json(
      { error: "Missing required fields: document_id, recipient_discord_id" },
      { status: 400 }
    );
  }

  const supabase = getSupabase();

  // Fetch the document to get its title
  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select("id, title")
    .eq("id", document_id)
    .single();

  if (docError || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Fetch sender username
  const { data: senderUser } = await supabase
    .from("users")
    .select("username")
    .eq("discord_id", session.user.discordId!)
    .single();

  const senderName = senderUser?.username || session.user.name || "Unknown";

  // Calculate expires_at if expires_days is set
  let expires_at: string | null = null;
  if (expires_days && expires_days > 0) {
    const expiresDate = new Date();
    expiresDate.setDate(expiresDate.getDate() + expires_days);
    expires_at = expiresDate.toISOString();
  }

  // Create the document_sends row
  const { data: send, error: sendError } = await supabase
    .from("document_sends")
    .insert({
      document_id,
      sender_discord_id: session.user.discordId!,
      recipient_discord_id,
      message: message || null,
      status: "pending",
      expires_at,
    })
    .select()
    .single();

  if (sendError) {
    return NextResponse.json({ error: sendError.message }, { status: 500 });
  }

  // Send Discord DM to the recipient
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000";

  await sendDiscordDM(recipient_discord_id, {
    title: "\u{1F4C4} Document Requires Your Attention",
    description: `**${doc.title}**\n\nSent by ${senderName}${message ? `\n\n"${message}"` : ""}`,
    color: 0xe8944a,
    fields: [
      {
        name: "Action Required",
        value: `[Open Document](${siteUrl}/inbox/${send.id})`,
        inline: false,
      },
    ],
    footer: { text: "COCO GAMES \u2022 Documents" },
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json(send);
}
