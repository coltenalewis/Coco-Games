import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { hasMinRole } from "@/lib/roles";
import type { UserRole } from "@/lib/roles";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId || !hasMinRole(session.user.role as UserRole, "coordinator")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") || "30", 10);
  const staffId = searchParams.get("staff"); // optional: filter by staff member

  const supabase = getSupabase();
  const since = new Date(Date.now() - days * 86400000).toISOString();

  // Fetch all tickets in range
  const { data: tickets } = await supabase
    .from("tickets")
    .select("id, category, status, priority, server_name, assigned_to, user_discord_id, created_at, updated_at, closed_at, first_response_at, ticket_number")
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  const allTickets = tickets || [];

  // Fetch all messages in range for response tracking
  const ticketIds = allTickets.map((t) => t.id);
  const { data: messages } = ticketIds.length > 0
    ? await supabase
        .from("ticket_messages")
        .select("ticket_id, author_discord_id, created_at")
        .in("ticket_id", ticketIds)
        .order("created_at")
    : { data: [] };

  const allMessages = messages || [];

  // Fetch staff users
  const { data: staffUsers } = await supabase
    .from("users")
    .select("discord_id, discord_username, discord_avatar, role")
    .neq("role", "user");

  const staffMap = new Map((staffUsers || []).map((u) => [u.discord_id, u]));

  // ============================================
  // GLOBAL METRICS
  // ============================================
  const totalTickets = allTickets.length;
  const openTickets = allTickets.filter((t) => t.status === "open").length;
  const inProgressTickets = allTickets.filter((t) => t.status === "in_progress").length;
  const closedTickets = allTickets.filter((t) => t.status === "closed").length;

  // Response times (first staff reply)
  const ticketsWithResponse = allTickets.filter((t) => t.first_response_at);
  const responseTimes = ticketsWithResponse.map((t) => {
    const created = new Date(t.created_at).getTime();
    const responded = new Date(t.first_response_at).getTime();
    return (responded - created) / 60000; // minutes
  });
  const avgResponseMinutes = responseTimes.length > 0
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : 0;
  const medianResponseMinutes = responseTimes.length > 0
    ? responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length / 2)]
    : 0;

  // Resolution times (created -> closed)
  const closedWithTime = allTickets.filter((t) => t.closed_at);
  const resolutionTimes = closedWithTime.map((t) => {
    const created = new Date(t.created_at).getTime();
    const closed = new Date(t.closed_at).getTime();
    return (closed - created) / 60000; // minutes
  });
  const avgResolutionMinutes = resolutionTimes.length > 0
    ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
    : 0;

  // Category distribution
  const categoryDist: Record<string, number> = {};
  for (const t of allTickets) {
    categoryDist[t.category] = (categoryDist[t.category] || 0) + 1;
  }

  // Server distribution
  const serverDist: Record<string, number> = {};
  for (const t of allTickets) {
    const s = t.server_name || "General";
    serverDist[s] = (serverDist[s] || 0) + 1;
  }

  // Priority distribution
  const priorityDist: Record<string, number> = {};
  for (const t of allTickets) {
    priorityDist[t.priority] = (priorityDist[t.priority] || 0) + 1;
  }

  // Status distribution
  const statusDist: Record<string, number> = { open: openTickets, in_progress: inProgressTickets, closed: closedTickets };

  // Resolution rate
  const resolutionRate = totalTickets > 0 ? (closedTickets / totalTickets) * 100 : 0;

  // Tickets per day (for trend chart)
  const dailyMap = new Map<string, { created: number; closed: number }>();
  for (let i = 0; i < days && i < 30; i++) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().split("T")[0];
    dailyMap.set(key, { created: 0, closed: 0 });
  }
  for (const t of allTickets) {
    const key = t.created_at.split("T")[0];
    if (dailyMap.has(key)) {
      const entry = dailyMap.get(key)!;
      entry.created++;
    }
    if (t.closed_at) {
      const cKey = t.closed_at.split("T")[0];
      if (dailyMap.has(cKey)) {
        const entry = dailyMap.get(cKey)!;
        entry.closed++;
      }
    }
  }
  const dailyTrend = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }));

  // ============================================
  // PER-STAFF METRICS
  // ============================================
  const staffMetrics: Record<string, {
    discord_id: string;
    username: string;
    avatar: string | null;
    role: string;
    assigned: number;
    closed: number;
    messages: number;
    avgResponseMin: number;
    avgResolutionMin: number;
    categories: Record<string, number>;
    weeklyResolved: number[];
  }> = {};

  // Initialize staff
  for (const [id, user] of Array.from(staffMap.entries())) {
    staffMetrics[id] = {
      discord_id: id,
      username: user.discord_username,
      avatar: user.discord_avatar,
      role: user.role,
      assigned: 0,
      closed: 0,
      messages: 0,
      avgResponseMin: 0,
      avgResolutionMin: 0,
      categories: {},
      weeklyResolved: [0, 0, 0, 0],
    };
  }

  // Count assignments and closures
  for (const t of allTickets) {
    if (t.assigned_to && staffMetrics[t.assigned_to]) {
      staffMetrics[t.assigned_to].assigned++;
      staffMetrics[t.assigned_to].categories[t.category] = (staffMetrics[t.assigned_to].categories[t.category] || 0) + 1;
    }
    if (t.status === "closed" && t.assigned_to && staffMetrics[t.assigned_to]) {
      staffMetrics[t.assigned_to].closed++;

      // Weekly resolved (last 4 weeks)
      if (t.closed_at) {
        const weeksAgo = Math.floor((Date.now() - new Date(t.closed_at).getTime()) / (7 * 86400000));
        if (weeksAgo < 4 && staffMetrics[t.assigned_to]) {
          staffMetrics[t.assigned_to].weeklyResolved[weeksAgo]++;
        }
      }
    }
  }

  // Count messages per staff
  for (const m of allMessages) {
    if (staffMetrics[m.author_discord_id]) {
      staffMetrics[m.author_discord_id].messages++;
    }
  }

  // Calculate per-staff response and resolution times
  for (const t of allTickets) {
    if (!t.assigned_to || !staffMetrics[t.assigned_to]) continue;
    const staff = staffMetrics[t.assigned_to];

    if (t.first_response_at) {
      const rt = (new Date(t.first_response_at).getTime() - new Date(t.created_at).getTime()) / 60000;
      staff.avgResponseMin = staff.assigned > 0
        ? ((staff.avgResponseMin * (staff.assigned - 1)) + rt) / staff.assigned
        : rt;
    }

    if (t.closed_at) {
      const resT = (new Date(t.closed_at).getTime() - new Date(t.created_at).getTime()) / 60000;
      staff.avgResolutionMin = staff.closed > 0
        ? ((staff.avgResolutionMin * (staff.closed - 1)) + resT) / staff.closed
        : resT;
    }
  }

  // Filter by specific staff member if requested
  const staffList = Object.values(staffMetrics)
    .filter((s) => s.assigned > 0 || s.messages > 0)
    .sort((a, b) => b.closed - a.closed);

  const selectedStaff = staffId ? staffMetrics[staffId] || null : null;

  return NextResponse.json({
    period: days,
    global: {
      totalTickets,
      openTickets,
      inProgressTickets,
      closedTickets,
      resolutionRate,
      avgResponseMinutes,
      medianResponseMinutes,
      avgResolutionMinutes,
      categoryDist,
      serverDist,
      priorityDist,
      statusDist,
      dailyTrend,
      ticketsWithResponseCount: ticketsWithResponse.length,
      responseRate: totalTickets > 0 ? (ticketsWithResponse.length / totalTickets) * 100 : 0,
    },
    staff: staffList,
    selectedStaff,
  });
}
