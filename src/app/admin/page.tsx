import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { getBotGuilds } from "@/lib/discord";
export const runtime = 'edge';

export const metadata = {
  title: "Admin Panel | COCO GAMES",
};

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  const supabase = getSupabase();

  // Fetch stats in parallel
  const [
    { count: userCount },
    { count: openTicketCount },
    { data: recentDiscipline },
    guilds,
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .neq("status", "closed"),
    supabase
      .from("discipline_log")
      .select("id, action_type, target_discord_id, guild_name, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    getBotGuilds().catch(() => []),
  ]);

  const stats = [
    { label: "Total Users", value: userCount ?? 0 },
    { label: "Open Tickets", value: openTicketCount ?? 0 },
    { label: "Servers", value: guilds.length },
    {
      label: "Your Role",
      value: session?.user?.role?.toUpperCase() ?? "USER",
    },
  ];

  const actionLabels: Record<string, { text: string; color: string }> = {
    ban: { text: "BAN", color: "bg-red-100 text-red-700 border-red-300" },
    unban: { text: "UNBAN", color: "bg-green-100 text-green-700 border-green-300" },
    kick: { text: "KICK", color: "bg-orange-100 text-orange-700 border-orange-300" },
    warn: { text: "WARN", color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
    note: { text: "NOTE", color: "bg-blue-100 text-blue-700 border-blue-300" },
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-5">
            <p className="text-xs text-coco-accent font-bold uppercase tracking-widest">
              {stat.label}
            </p>
            <p className="text-2xl font-black text-coco-dark mt-1">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Discipline */}
      <div className="card p-6">
        <h2 className="text-sm font-bold text-coco-accent uppercase tracking-widest mb-4">
          Recent Discipline Actions
        </h2>
        {recentDiscipline && recentDiscipline.length > 0 ? (
          <div className="space-y-2">
            {recentDiscipline.map((entry) => {
              const label = actionLabels[entry.action_type] || actionLabels.note;
              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 p-3 bg-coco-light/50 border border-coco-dark/5"
                >
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 border ${label.color}`}
                  >
                    {label.text}
                  </span>
                  <span className="text-sm text-coco-dark font-medium font-mono">
                    {entry.target_discord_id}
                  </span>
                  {entry.guild_name && (
                    <span className="text-xs text-coco-coffee/60">
                      in {entry.guild_name}
                    </span>
                  )}
                  <span className="ml-auto text-xs text-coco-coffee/50">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-coco-coffee/60">
            No discipline actions recorded yet.
          </p>
        )}
      </div>
    </div>
  );
}
