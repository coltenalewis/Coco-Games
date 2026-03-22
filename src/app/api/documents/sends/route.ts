import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { hasMinRole } from "@/lib/roles";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const inbox = searchParams.get("inbox") === "true";
  const status = searchParams.get("status");

  const supabase = getSupabase();

  if (inbox) {
    // Return documents sent TO the current user
    let query = supabase
      .from("document_sends")
      .select("*")
      .eq("recipient_discord_id", session.user.discordId)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data: sends, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enrich with document titles and sender usernames
    const enriched = await enrichSends(supabase, sends || []);
    return NextResponse.json(enriched);
  } else {
    // Return documents sent BY the current user — requires executive+
    if (!hasMinRole(session.user.role, "executive")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let query = supabase
      .from("document_sends")
      .select("*")
      .eq("sender_discord_id", session.user.discordId)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data: sends, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const enriched = await enrichSends(supabase, sends || []);
    return NextResponse.json(enriched);
  }
}

async function enrichSends(
  supabase: ReturnType<typeof getSupabase>,
  sends: Record<string, unknown>[]
) {
  if (sends.length === 0) return [];

  // Collect unique IDs
  const docIds = Array.from(new Set(sends.map((s) => s.document_id as string)));
  const discordIds = Array.from(new Set(
    sends.flatMap((s) => [
      s.sender_discord_id as string,
      s.recipient_discord_id as string,
    ])
  ));

  // Fetch documents
  const { data: docs } = await supabase
    .from("documents")
    .select("id, title")
    .in("id", docIds);

  const docMap = new Map((docs || []).map((d) => [d.id, d.title]));

  // Fetch users
  const { data: users } = await supabase
    .from("users")
    .select("discord_id, username")
    .in("discord_id", discordIds);

  const userMap = new Map(
    (users || []).map((u) => [u.discord_id, u.username])
  );

  return sends.map((send) => ({
    ...send,
    document_title: docMap.get(send.document_id as string) || null,
    sender_username: userMap.get(send.sender_discord_id as string) || null,
    recipient_username:
      userMap.get(send.recipient_discord_id as string) || null,
  }));
}
