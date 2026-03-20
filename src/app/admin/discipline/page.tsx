"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
export const runtime = 'edge';

interface DisciplineEntry {
  id: string;
  target_discord_id: string;
  guild_id: string | null;
  guild_name: string | null;
  action_type: string;
  reason: string | null;
  moderator_discord_id: string | null;
  moderator_username: string | null;
  created_at: string;
}

const actionLabels: Record<string, { text: string; color: string }> = {
  ban: { text: "BAN", color: "bg-red-100 text-red-700 border-red-300" },
  unban: { text: "UNBAN", color: "bg-green-100 text-green-700 border-green-300" },
  kick: { text: "KICK", color: "bg-orange-100 text-orange-700 border-orange-300" },
  warn: { text: "WARN", color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  note: { text: "NOTE", color: "bg-blue-100 text-blue-700 border-blue-300" },
};

export default function AdminDisciplinePage() {
  const [entries, setEntries] = useState<DisciplineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        ...(filter !== "all" ? { type: filter } : {}),
        ...(search ? { q: search } : {}),
      });
      const res = await fetch(`/api/admin/discipline?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [filter, page, search]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEntries();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-coco-dark">Discipline Log</h2>
        <p className="text-sm text-coco-coffee/60 mt-1">
          {total} total entries across all servers
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by Discord ID..."
          className="flex-1 px-4 py-2.5 border-2 border-coco-dark/10 bg-white text-coco-dark text-sm focus:outline-none focus:border-coco-accent transition-colors"
        />
        <button type="submit" className="btn-primary text-sm">
          Search
        </button>
      </form>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["all", "ban", "unban", "kick", "warn", "note"].map((type) => (
          <button
            key={type}
            onClick={() => {
              setFilter(type);
              setPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-2 transition-all ${
              filter === type
                ? "bg-coco-dark text-coco-gold border-coco-dark"
                : "bg-white text-coco-dark border-coco-dark/15 hover:border-coco-accent"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Entries */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="card p-4 animate-pulse h-16" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="card p-8 text-center text-coco-coffee/60">
          No discipline entries found.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-coco-dark/10 bg-coco-warm/50">
                <th className="text-left px-4 py-3 text-xs font-bold text-coco-accent uppercase tracking-wider">
                  Type
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-coco-accent uppercase tracking-wider">
                  Target
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-coco-accent uppercase tracking-wider">
                  Server
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-coco-accent uppercase tracking-wider">
                  Reason
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-coco-accent uppercase tracking-wider">
                  Moderator
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-coco-accent uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const label = actionLabels[entry.action_type] || actionLabels.note;
                return (
                  <tr
                    key={entry.id}
                    className="border-b border-coco-dark/5 hover:bg-coco-warm/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 border ${label.color}`}
                      >
                        {label.text}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/users/${entry.target_discord_id}`}
                        className="font-mono text-xs text-coco-accent hover:text-coco-ember"
                      >
                        {entry.target_discord_id}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-coco-coffee/70">
                      {entry.guild_name || "\u2014"}
                    </td>
                    <td className="px-4 py-3 text-xs text-coco-dark max-w-[200px] truncate">
                      {entry.reason || "\u2014"}
                    </td>
                    <td className="px-4 py-3 text-xs text-coco-coffee/60">
                      {entry.moderator_username || "System"}
                    </td>
                    <td className="px-4 py-3 text-xs text-coco-coffee/50 whitespace-nowrap">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 text-sm font-bold border-2 border-coco-dark/10 disabled:opacity-30 hover:border-coco-accent transition-colors"
          >
            Prev
          </button>
          <span className="text-sm text-coco-coffee px-3">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-sm font-bold border-2 border-coco-dark/10 disabled:opacity-30 hover:border-coco-accent transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
