"use client";

import { useState, useEffect, useCallback } from "react";

interface GlobalMetrics {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  closedTickets: number;
  resolutionRate: number;
  avgResponseMinutes: number;
  medianResponseMinutes: number;
  avgResolutionMinutes: number;
  categoryDist: Record<string, number>;
  serverDist: Record<string, number>;
  priorityDist: Record<string, number>;
  statusDist: Record<string, number>;
  dailyTrend: { date: string; created: number; closed: number }[];
  responseRate: number;
}

interface StaffMember {
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
}

const CATEGORY_LABELS: Record<string, string> = {
  question: "Questions",
  bug_report: "Bug Reports",
  game_report: "Game Reports",
  discord_appeal: "Discord Appeals",
  game_appeal: "Game Appeals",
  business: "Business",
};

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-orange-500/20 text-orange-400",
  executive: "bg-green-500/20 text-green-400",
  admin: "bg-red-500/20 text-red-400",
  developer: "bg-violet-500/20 text-violet-400",
  coordinator: "bg-cyan-500/20 text-cyan-400",
  mod: "bg-blue-500/20 text-blue-400",
  contractor: "bg-amber-500/20 text-amber-400",
};

function formatTime(minutes: number): string {
  if (minutes < 1) return "< 1m";
  if (minutes < 60) return `${Math.round(minutes)}m`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h ${Math.round(minutes % 60)}m`;
  return `${Math.round(minutes / 1440)}d ${Math.round((minutes % 1440) / 60)}h`;
}

function getAvatarUrl(discordId: string, avatar: string | null): string {
  if (avatar) return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.png?size=64`;
  const idx = (BigInt(discordId) >> BigInt(22)) % BigInt(6);
  return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<{ global: GlobalMetrics; staff: StaffMember[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?days=${days}`);
      if (res.ok) setData(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [days]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading || !data) {
    return <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="card p-6 animate-pulse h-32" />)}</div>;
  }

  const { global: g, staff } = data;
  const viewStaff = selectedStaff ? staff.find((s) => s.discord_id === selectedStaff) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-coco-dark">Ticket Analytics</h2>
          <p className="text-[10px] sm:text-xs text-coco-coffee/50 mt-0.5">
            {g.totalTickets} tickets in the last {days} days
          </p>
        </div>
        <div className="flex gap-2">
          {[7, 14, 30, 90].map((d) => (
            <button key={d} onClick={() => setDays(d)} className={`px-3 py-1.5 text-xs font-bold border-2 transition-all min-h-[36px] ${days === d ? "bg-coco-dark text-coco-gold border-coco-dark" : "border-coco-dark/10 text-coco-coffee hover:border-coco-accent"}`}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        {[
          { label: "Total", value: g.totalTickets, color: "text-coco-dark" },
          { label: "Open", value: g.openTickets, color: "text-green-600" },
          { label: "In Progress", value: g.inProgressTickets, color: "text-yellow-600" },
          { label: "Resolved", value: g.closedTickets, color: "text-blue-600" },
          { label: "Resolution Rate", value: `${g.resolutionRate.toFixed(1)}%`, color: g.resolutionRate > 80 ? "text-green-600" : "text-coco-accent" },
          { label: "Response Rate", value: `${g.responseRate.toFixed(1)}%`, color: "text-coco-dark" },
        ].map((s) => (
          <div key={s.label} className="card p-3 sm:p-4">
            <p className="text-[9px] sm:text-[10px] font-bold text-coco-coffee/50 uppercase tracking-wider">{s.label}</p>
            <p className={`text-lg sm:text-2xl font-black mt-0.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Response & Resolution Times */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card p-4 sm:p-5">
          <p className="text-[10px] font-bold text-coco-coffee/50 uppercase tracking-wider">Avg First Response</p>
          <p className="text-xl sm:text-2xl font-black text-coco-accent mt-1">{formatTime(g.avgResponseMinutes)}</p>
          <p className="text-[10px] text-coco-coffee/40 mt-0.5">Median: {formatTime(g.medianResponseMinutes)}</p>
        </div>
        <div className="card p-4 sm:p-5">
          <p className="text-[10px] font-bold text-coco-coffee/50 uppercase tracking-wider">Avg Resolution Time</p>
          <p className="text-xl sm:text-2xl font-black text-coco-accent mt-1">{formatTime(g.avgResolutionMinutes)}</p>
        </div>
        <div className="card p-4 sm:p-5">
          <p className="text-[10px] font-bold text-coco-coffee/50 uppercase tracking-wider">Active Staff</p>
          <p className="text-xl sm:text-2xl font-black text-coco-dark mt-1">{staff.length}</p>
          <p className="text-[10px] text-coco-coffee/40 mt-0.5">{staff.reduce((a, s) => a + s.messages, 0)} total messages</p>
        </div>
      </div>

      {/* Ticket Trend Chart */}
      <div className="card p-4 sm:p-5">
        <h3 className="text-xs sm:text-sm font-bold text-coco-dark mb-4">Daily Ticket Volume</h3>
        {g.dailyTrend.length > 0 ? (
          <div className="space-y-1.5">
            {g.dailyTrend.map((d) => {
              const max = Math.max(...g.dailyTrend.map((x) => Math.max(x.created, x.closed)), 1);
              return (
                <div key={d.date} className="flex items-center gap-2 text-[10px]">
                  <span className="w-16 sm:w-20 text-coco-coffee/50 font-mono flex-shrink-0">{d.date.slice(5)}</span>
                  <div className="flex-1 flex gap-1 h-4">
                    <div className="bg-coco-accent/60 rounded-r-sm transition-all" style={{ width: `${(d.created / max) * 100}%`, minWidth: d.created > 0 ? "4px" : "0" }} />
                    <div className="bg-green-400/60 rounded-r-sm transition-all" style={{ width: `${(d.closed / max) * 100}%`, minWidth: d.closed > 0 ? "4px" : "0" }} />
                  </div>
                  <span className="w-8 text-right text-coco-coffee/40">{d.created}/{d.closed}</span>
                </div>
              );
            })}
            <div className="flex gap-4 pt-2 border-t border-coco-dark/5 text-[10px] text-coco-coffee/50">
              <span className="flex items-center gap-1"><span className="w-3 h-2 bg-coco-accent/60 rounded-sm" /> Created</span>
              <span className="flex items-center gap-1"><span className="w-3 h-2 bg-green-400/60 rounded-sm" /> Resolved</span>
            </div>
          </div>
        ) : (
          <p className="text-coco-coffee/30 text-xs">No data for this period</p>
        )}
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Category Distribution */}
        <div className="card p-4 sm:p-5">
          <h3 className="text-xs font-bold text-coco-dark mb-3">By Category</h3>
          <div className="space-y-2">
            {Object.entries(g.categoryDist).sort(([, a], [, b]) => b - a).map(([cat, count]) => (
              <div key={cat} className="flex items-center justify-between">
                <span className="text-xs text-coco-coffee">{CATEGORY_LABELS[cat] || cat}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-coco-dark/5 rounded-full overflow-hidden">
                    <div className="h-full bg-coco-accent rounded-full" style={{ width: `${(count / g.totalTickets) * 100}%` }} />
                  </div>
                  <span className="text-xs font-bold text-coco-dark w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Server Distribution */}
        <div className="card p-4 sm:p-5">
          <h3 className="text-xs font-bold text-coco-dark mb-3">By Server</h3>
          <div className="space-y-2">
            {Object.entries(g.serverDist).sort(([, a], [, b]) => b - a).map(([srv, count]) => (
              <div key={srv} className="flex items-center justify-between">
                <span className="text-xs text-coco-coffee">{srv}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-coco-dark/5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400 rounded-full" style={{ width: `${(count / g.totalTickets) * 100}%` }} />
                  </div>
                  <span className="text-xs font-bold text-coco-dark w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="card p-4 sm:p-5">
          <h3 className="text-xs font-bold text-coco-dark mb-3">By Priority</h3>
          <div className="space-y-2">
            {Object.entries(g.priorityDist).sort(([, a], [, b]) => b - a).map(([pri, count]) => {
              const colors: Record<string, string> = { urgent: "bg-red-400", high: "bg-orange-400", normal: "bg-coco-accent", low: "bg-gray-300" };
              return (
                <div key={pri} className="flex items-center justify-between">
                  <span className="text-xs text-coco-coffee capitalize">{pri}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-coco-dark/5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${colors[pri] || "bg-coco-accent"}`} style={{ width: `${(count / g.totalTickets) * 100}%` }} />
                    </div>
                    <span className="text-xs font-bold text-coco-dark w-8 text-right">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Staff Leaderboard */}
      <div className="card overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b-2 border-coco-dark/10 flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-bold text-coco-dark">Staff Performance</h3>
          {viewStaff && (
            <button onClick={() => setSelectedStaff(null)} className="text-xs text-coco-accent hover:text-coco-ember font-bold min-h-[36px]">
              &larr; All Staff
            </button>
          )}
        </div>

        {viewStaff ? (
          /* Individual Staff Detail */
          <div className="p-4 sm:p-5 space-y-5">
            <div className="flex items-center gap-4">
              <img src={getAvatarUrl(viewStaff.discord_id, viewStaff.avatar)} alt="" className="w-14 h-14 rounded-sm border-2 border-coco-accent/30" />
              <div>
                <h4 className="text-lg font-black text-coco-dark">{viewStaff.username}</h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 ${ROLE_COLORS[viewStaff.role] || "bg-gray-100 text-gray-600"}`}>
                  {viewStaff.role.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-coco-warm/30 border border-coco-dark/5">
                <p className="text-[9px] font-bold text-coco-coffee/50 uppercase">Assigned</p>
                <p className="text-xl font-black text-coco-dark">{viewStaff.assigned}</p>
              </div>
              <div className="p-3 bg-green-50 border border-green-200">
                <p className="text-[9px] font-bold text-coco-coffee/50 uppercase">Resolved</p>
                <p className="text-xl font-black text-green-600">{viewStaff.closed}</p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200">
                <p className="text-[9px] font-bold text-coco-coffee/50 uppercase">Avg Response</p>
                <p className="text-lg font-black text-blue-600">{formatTime(viewStaff.avgResponseMin)}</p>
              </div>
              <div className="p-3 bg-purple-50 border border-purple-200">
                <p className="text-[9px] font-bold text-coco-coffee/50 uppercase">Avg Resolution</p>
                <p className="text-lg font-black text-purple-600">{formatTime(viewStaff.avgResolutionMin)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category breakdown */}
              <div>
                <h5 className="text-xs font-bold text-coco-coffee uppercase tracking-wider mb-2">Ticket Types Handled</h5>
                <div className="space-y-1.5">
                  {Object.entries(viewStaff.categories).sort(([, a], [, b]) => b - a).map(([cat, count]) => (
                    <div key={cat} className="flex items-center justify-between text-xs">
                      <span className="text-coco-coffee">{CATEGORY_LABELS[cat] || cat}</span>
                      <span className="font-bold text-coco-dark">{count}</span>
                    </div>
                  ))}
                  {Object.keys(viewStaff.categories).length === 0 && (
                    <p className="text-xs text-coco-coffee/30">No assigned tickets</p>
                  )}
                </div>
              </div>

              {/* Weekly resolved */}
              <div>
                <h5 className="text-xs font-bold text-coco-coffee uppercase tracking-wider mb-2">Weekly Resolutions</h5>
                <div className="flex items-end gap-2 h-20">
                  {viewStaff.weeklyResolved.map((count, i) => {
                    const max = Math.max(...viewStaff.weeklyResolved, 1);
                    const labels = ["This Week", "Last Week", "2 Weeks Ago", "3 Weeks Ago"];
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[9px] font-bold text-coco-dark">{count}</span>
                        <div className="w-full bg-coco-accent/60 rounded-t-sm transition-all" style={{ height: `${(count / max) * 100}%`, minHeight: count > 0 ? "4px" : "2px" }} />
                        <span className="text-[7px] text-coco-coffee/40 text-center">{labels[i]?.split(" ").slice(0, 2).join(" ")}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-coco-dark/5">
              <p className="text-xs text-coco-coffee/40">
                Total messages sent: <strong className="text-coco-dark">{viewStaff.messages}</strong> &middot;
                Resolution rate: <strong className="text-coco-dark">{viewStaff.assigned > 0 ? ((viewStaff.closed / viewStaff.assigned) * 100).toFixed(0) : 0}%</strong>
              </p>
            </div>
          </div>
        ) : (
          /* Staff List */
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b-2 border-coco-dark/10 bg-coco-warm/30">
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold text-coco-coffee/60 uppercase">Staff</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold text-coco-coffee/60 uppercase">Assigned</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold text-coco-coffee/60 uppercase">Resolved</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold text-coco-coffee/60 uppercase">Rate</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold text-coco-coffee/60 uppercase">Avg Response</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold text-coco-coffee/60 uppercase">Messages</th>
                  <th className="px-3 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.discord_id} className="border-b border-coco-dark/5 hover:bg-coco-warm/20 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <img src={getAvatarUrl(s.discord_id, s.avatar)} alt="" className="w-7 h-7 rounded-sm border border-coco-dark/10" />
                        <div>
                          <p className="text-xs font-medium text-coco-dark">{s.username}</p>
                          <span className={`text-[8px] font-bold px-1 py-0.5 ${ROLE_COLORS[s.role] || ""}`}>{s.role}</span>
                        </div>
                      </div>
                    </td>
                    <td className="text-center px-3 py-2.5 font-bold text-coco-dark text-xs">{s.assigned}</td>
                    <td className="text-center px-3 py-2.5 font-bold text-green-600 text-xs">{s.closed}</td>
                    <td className="text-center px-3 py-2.5 text-xs text-coco-coffee">
                      {s.assigned > 0 ? `${((s.closed / s.assigned) * 100).toFixed(0)}%` : "—"}
                    </td>
                    <td className="text-center px-3 py-2.5 text-xs text-coco-coffee">{s.avgResponseMin > 0 ? formatTime(s.avgResponseMin) : "—"}</td>
                    <td className="text-center px-3 py-2.5 text-xs text-coco-coffee/60">{s.messages}</td>
                    <td className="px-3 py-2.5">
                      <button onClick={() => setSelectedStaff(s.discord_id)} className="text-[10px] text-coco-accent hover:text-coco-ember font-bold min-h-[36px]">
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
                {staff.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-8 text-coco-coffee/30 text-xs">No staff activity in this period</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
