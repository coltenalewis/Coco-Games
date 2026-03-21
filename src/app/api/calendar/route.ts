import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { hasMinRole, isTeam } from "@/lib/roles";

// Which calendars a role can access
function getAccessibleCalendars(role: string | undefined): string[] {
  if (!role) return [];
  if (role === "owner" || role === "executive") return ["development", "executive", "staff"];
  if (role === "admin") return ["development", "staff"];
  if (role === "developer") return ["development", "staff"];
  if (role === "mod") return ["staff"];
  if (role === "contractor") return ["development"];
  return [];
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId || !isTeam(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const calendar = searchParams.get("calendar");
  const month = searchParams.get("month"); // YYYY-MM
  const accessible = getAccessibleCalendars(session.user.role);

  if (accessible.length === 0) {
    return NextResponse.json({ events: [], calendars: [] });
  }

  let query = getSupabase()
    .from("calendar_events")
    .select("*")
    .order("start_date", { ascending: true });

  if (calendar && accessible.includes(calendar)) {
    query = query.eq("calendar", calendar);
  } else {
    query = query.in("calendar", accessible);
  }

  if (month) {
    const start = `${month}-01T00:00:00Z`;
    const [y, m] = month.split("-").map(Number);
    const endDate = new Date(y, m, 0); // last day of month
    const end = `${month}-${String(endDate.getDate()).padStart(2, "0")}T23:59:59Z`;
    query = query.gte("start_date", start).lte("start_date", end);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ events: data || [], calendars: accessible });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId || !isTeam(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const accessible = getAccessibleCalendars(session.user.role);

  if (!body.calendar || !accessible.includes(body.calendar)) {
    return NextResponse.json({ error: "No access to this calendar" }, { status: 403 });
  }

  if (!body.title?.trim() || !body.start_date) {
    return NextResponse.json({ error: "Title and start date required" }, { status: 400 });
  }

  const { data, error } = await getSupabase()
    .from("calendar_events")
    .insert({
      calendar: body.calendar,
      title: body.title.trim(),
      description: body.description || null,
      event_type: body.event_type || "event",
      start_date: body.start_date,
      end_date: body.end_date || null,
      all_day: body.all_day ?? true,
      color: body.color || "#E8944A",
      recurring: body.recurring || "none",
      recurring_until: body.recurring_until || null,
      amount: body.amount || null,
      created_by: session.user.discordId,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId || !isTeam(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  if (!body.id) {
    return NextResponse.json({ error: "Missing event id" }, { status: 400 });
  }

  const { id, ...updates } = body;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await getSupabase()
    .from("calendar_events")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId || !hasMinRole(session.user.role, "mod")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { error } = await getSupabase()
    .from("calendar_events")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
