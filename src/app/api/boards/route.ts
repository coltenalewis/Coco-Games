import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

// GET /api/boards - list boards the user can view
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRole = session.user.role || "user";

  const { data, error } = await getSupabase()
    .from("boards")
    .select("*")
    .eq("archived", false)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Filter to boards where the user's role is in view_roles
  const visible = (data || []).filter(
    (b: { view_roles: string[] }) => (b.view_roles || []).includes(userRole)
  );

  return NextResponse.json({ boards: visible });
}

// POST /api/boards - create a board (admin+)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, description, color, view_roles, edit_roles } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const { data, error } = await getSupabase()
    .from("boards")
    .insert({
      name: name.trim(),
      description: description?.trim() || null,
      color: color || "#E8944A",
      view_roles: view_roles || ["contractor", "mod", "developer", "admin", "executive", "owner"],
      edit_roles: edit_roles || ["developer", "admin", "executive", "owner"],
      created_by: session.user.discordId,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
