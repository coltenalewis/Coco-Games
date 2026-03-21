import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { isStaff } from "@/lib/roles";

// Determine which ticket categories a role can view
function getAllowedCategories(role: string | undefined): string[] | null {
  if (!role) return null; // non-staff, only own tickets
  if (role === "owner" || role === "executive") return null; // see everything
  if (role === "admin") return null; // admins see everything
  if (role === "mod") return ["discord_appeal", "game_appeal", "question"]; // mods can't see business
  return null;
}

// GET /api/tickets?status=open&page=1
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
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
    // Staff: filter by allowed categories based on role
    const allowed = getAllowedCategories(session.user.role);
    if (allowed) {
      query = query.in("category", allowed);
    }
  }

  if (status && status !== "all") {
    query = query.eq("status", status);
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

  const { subject, category, priority, message, imageUrl } = await req.json();

  if (!subject?.trim() || !message?.trim()) {
    return NextResponse.json(
      { error: "Subject and message are required" },
      { status: 400 }
    );
  }

  const validCategories = ["discord_appeal", "game_appeal", "question", "business"];
  const ticketCategory = validCategories.includes(category) ? category : "question";

  const supabase = getSupabase();

  // Create ticket
  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .insert({
      user_discord_id: session.user.discordId,
      subject: subject.trim(),
      category: ticketCategory,
      priority: priority || "normal",
    })
    .select("id")
    .single();

  if (ticketError || !ticket) {
    return NextResponse.json(
      { error: ticketError?.message || "Failed to create ticket" },
      { status: 500 }
    );
  }

  // Create initial message
  const { error: msgError } = await supabase.from("ticket_messages").insert({
    ticket_id: ticket.id,
    author_discord_id: session.user.discordId,
    content: message.trim(),
    image_url: imageUrl || null,
  });

  if (msgError) {
    return NextResponse.json({ error: msgError.message }, { status: 500 });
  }

  return NextResponse.json({ id: ticket.id }, { status: 201 });
}
