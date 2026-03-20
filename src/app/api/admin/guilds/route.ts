import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasMinRole } from "@/lib/roles";
import { getBotGuilds } from "@/lib/discord";
export const runtime = 'edge';

// GET /api/admin/guilds - list all guilds the bot is in
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !hasMinRole(session.user?.role, "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const guilds = await getBotGuilds();
    return NextResponse.json(
      guilds.map((g) => ({
        id: g.id,
        name: g.name,
        icon: g.icon,
      }))
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch guilds" },
      { status: 500 }
    );
  }
}
