import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { isStaff } from "@/lib/roles";
import { getTicketCategories } from "@/lib/permissions";

// GET /api/tickets?status=open&page=1&server=General
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const server = searchParams.get("server");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = 20;
  const offset = (page - 1) * limit;
  const staff = isStaff(session.user.role);

  let query = getSupabase()
    .from("tickets")
    .select("*", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  // Non-staff users can only see their own tickets
  if (!staff) {
    query = query.eq("user_discord_id", session.user.discordId);
  } else {
    // Staff: filter by allowed categories from permissions config
    const allowed = await getTicketCategories(session.user.role);
    if (allowed.length > 0) {
      query = query.in("category", allowed);
    }
  }

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (server && server !== "all") {
    query = query.eq("server_name", server);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    tickets: data || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  });
}

// POST /api/tickets - create a new ticket
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { subject, category, priority, message, imageUrl, server_name } = await req.json();

  if (!subject?.trim() || !message?.trim()) {
    return NextResponse.json(
      { error: "Subject and message are required" },
      { status: 400 }
    );
  }

  const validCategories = ["discord_appeal", "game_appeal", "question", "business", "bug_report", "game_report"];
  const ticketCategory = validCategories.includes(category) ? category : "question";

  // Auto-flag bug reports from QA as urgent
  let ticketPriority = priority || "normal";
  if (ticketCategory === "bug_report" && session.user.role === "qa") {
    ticketPriority = "urgent";
  }

  const supabase = getSupabase();

  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .insert({
      user_discord_id: session.user.discordId,
      subject: subject.trim(),
      category: ticketCategory,
      priority: ticketPriority,
      server_name: server_name || "General",
    })
    .select("id, ticket_number")
    .single();

  if (ticketError || !ticket) {
    return NextResponse.json(
      { error: ticketError?.message || "Failed to create ticket" },
      { status: 500 }
    );
  }

  const { error: msgError } = await supabase.from("ticket_messages").insert({
    ticket_id: ticket.id,
    author_discord_id: session.user.discordId,
    content: message.trim(),
    image_url: imageUrl || null,
  });

  if (msgError) {
    return NextResponse.json({ error: msgError.message }, { status: 500 });
  }

  return NextResponse.json({ id: ticket.id, ticket_number: ticket.ticket_number }, { status: 201 });
}
