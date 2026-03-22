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
  const document_id = searchParams.get("document_id");

  if (!document_id) {
    return NextResponse.json(
      { error: "Missing required query param: document_id" },
      { status: 400 }
    );
  }

  const { data, error } = await getSupabase()
    .from("document_fields")
    .select("*")
    .eq("document_id", document_id)
    .order("position", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !hasMinRole(session.user?.role, "executive")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { document_id, field_type, label, placeholder, required, options, position } = body;

  if (!document_id || !field_type || !label) {
    return NextResponse.json(
      { error: "Missing required fields: document_id, field_type, label" },
      { status: 400 }
    );
  }

  const { data, error } = await getSupabase()
    .from("document_fields")
    .insert({
      document_id,
      field_type,
      label,
      placeholder: placeholder || null,
      required: required ?? false,
      options: options || null,
      position: position ?? 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !hasMinRole(session.user?.role, "executive")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { error } = await getSupabase()
    .from("document_fields")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
