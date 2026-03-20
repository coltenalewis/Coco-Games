import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { hasMinRole } from "@/lib/roles";
import {
export const runtime = 'edge';
  getBotGuilds,
  getOrCreateWebhook,
  sendWebhookMessage,
} from "@/lib/discord";

// GET /api/admin/announcements - list past announcements
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !hasMinRole(session.user?.role, "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  const { data, error, count } = await getSupabase()
    .from("announcements")
    .select("*", { count: "exact" })
    .order("sent_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    announcements: data || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  });
}

// POST /api/admin/announcements - send announcement
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !hasMinRole(session.user?.role, "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { content, guildIds } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json(
      { error: "Content is required" },
      { status: 400 }
    );
  }

  if (!guildIds || guildIds.length === 0) {
    return NextResponse.json(
      { error: "Select at least one server" },
      { status: 400 }
    );
  }

  const supabase = getSupabase();

  // Determine target guild IDs
  let targetGuildIds: string[] = guildIds;
  if (guildIds.includes("all")) {
    const guilds = await getBotGuilds();
    targetGuildIds = guilds.map((g) => g.id);
  }

  // Get announcement channels for target guilds
  const { data: configs } = await supabase
    .from("guild_configs")
    .select("guild_id, announcement_channel")
    .in("guild_id", targetGuildIds)
    .not("announcement_channel", "is", null);

  if (!configs || configs.length === 0) {
    return NextResponse.json(
      {
        error:
          "None of the selected servers have an announcement channel configured. Set one in Dashboard > Server > Config.",
      },
      { status: 400 }
    );
  }

  const results: { guildId: string; success: boolean; error?: string }[] = [];
  const messageContent = `@everyone\n\n${content.trim()}`;

  for (const config of configs) {
    try {
      const webhook = await getOrCreateWebhook(config.announcement_channel!);
      await sendWebhookMessage(webhook.id, webhook.token, messageContent);
      results.push({ guildId: config.guild_id, success: true });
    } catch (err) {
      results.push({
        guildId: config.guild_id,
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  // Store announcement record
  await supabase.from("announcements").insert({
    author_discord_id: session.user.discordId!,
    content: content.trim(),
    guild_ids: targetGuildIds,
  });

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  return NextResponse.json({
    success: true,
    sent: successCount,
    failed: failCount,
    results,
  });
}
