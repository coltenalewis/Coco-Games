import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST /api/view-as - set view-as role (owner only)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  // Only the actual owner can use view-as (check real DB role, not cookie)
  if (!session?.user?.discordId || session.user.discordId !== process.env.OWNER_DISCORD_ID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { role } = await req.json();

  const response = NextResponse.json({ success: true, viewAs: role || null });

  if (role) {
    response.cookies.set("view_as_role", role, {
      httpOnly: false, // needs to be readable by client for UI
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3600, // 1 hour
      path: "/",
    });
  } else {
    response.cookies.delete("view_as_role");
  }

  return response;
}

// DELETE /api/view-as - clear view-as role
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("view_as_role");
  return response;
}
