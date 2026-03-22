import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { clearPermissionsCache } from "@/lib/permissions";

// GET /api/permissions — list all permissions
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId || session.user.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await getSupabase()
    .from("site_permissions")
    .select("*")
    .order("permission_group")
    .order("permission_label");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ permissions: data || [] });
}

// PATCH /api/permissions — update a permission's allowed_roles
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId || session.user.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { permission_key, allowed_roles } = await req.json();

  if (!permission_key || !Array.isArray(allowed_roles)) {
    return NextResponse.json({ error: "permission_key and allowed_roles array required" }, { status: 400 });
  }

  // Always ensure owner is included
  const roles = Array.from(new Set([...allowed_roles, "owner"]));

  const { error } = await getSupabase()
    .from("site_permissions")
    .update({
      allowed_roles: roles,
      updated_at: new Date().toISOString(),
      updated_by: session.user.discordId,
    })
    .eq("permission_key", permission_key);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Clear the permissions cache so changes take effect immediately
  clearPermissionsCache();

  return NextResponse.json({ success: true });
}

// POST /api/permissions — create a new permission
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId || session.user.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { permission_key, permission_label, permission_group, allowed_roles, description } = await req.json();

  if (!permission_key || !permission_label || !permission_group) {
    return NextResponse.json({ error: "key, label, and group required" }, { status: 400 });
  }

  const roles = Array.from(new Set([...(allowed_roles || []), "owner"]));

  const { data, error } = await getSupabase()
    .from("site_permissions")
    .insert({
      permission_key,
      permission_label,
      permission_group,
      allowed_roles: roles,
      description: description || null,
      updated_by: session.user.discordId,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  clearPermissionsCache();
  return NextResponse.json(data, { status: 201 });
}

// DELETE /api/permissions — delete a permission
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId || session.user.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { permission_key } = await req.json();
  if (!permission_key) {
    return NextResponse.json({ error: "permission_key required" }, { status: 400 });
  }

  const { error } = await getSupabase()
    .from("site_permissions")
    .delete()
    .eq("permission_key", permission_key);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  clearPermissionsCache();
  return NextResponse.json({ success: true });
}
