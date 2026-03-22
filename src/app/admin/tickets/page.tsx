"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Ticket {
  id: string;
  user_discord_id: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

const categoryLabels: Record<string, { text: string; color: string }> = {
  discord_appeal: { text: "DISCORD", color: "bg-indigo-100 text-indigo-700 border-indigo-300" },
  game_appeal: { text: "GAME APPEAL", color: "bg-purple-100 text-purple-700 border-purple-300" },
  question: { text: "QUESTION", color: "bg-cyan-100 text-cyan-700 border-cyan-300" },
  bug_report: { text: "BUG", color: "bg-orange-100 text-orange-700 border-orange-300" },
  game_report: { text: "REPORT", color: "bg-red-100 text-red-700 border-red-300" },
  business: { text: "BUSINESS", color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
};

const statusColors: Record<string, string> = {
  open: "bg-green-100 text-green-700 border-green-300",
  in_progress: "bg-yellow-100 text-yellow-700 border-yellow-300",
  closed: "bg-gray-100 text-gray-500 border-gray-300",
};

const priorityColors: Record<string, string> = {
  low: "text-gray-500",
  normal: "text-coco-dark",
  high: "text-orange-600 font-bold",
  urgent: "text-red-600 font-bold",
};

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tickets?status=${filter}&page=${page}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-coco-dark">All Tickets</h2>
          <p className="text-sm text-coco-coffee/60 mt-1">
            {total} total tickets
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["all", "open", "in_progress", "closed"].map((s) => (
          <button
            key={s}
            onClick={() => {
              setFilter(s);
              setPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-2 transition-all ${
              filter === s
                ? "bg-coco-dark text-coco-gold border-coco-dark"
                : "bg-white text-coco-dark border-coco-dark/15 hover:border-coco-accent"
            }`}
          >
            {s === "in_progress"
              ? "In Progress"
              : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Tickets */}
      {loading ? (
        <div className="space-y-3">
          <div className="card p-5 animate-pulse h-16" />
          <div className="card p-5 animate-pulse h-16" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="card p-8 text-center text-coco-coffee/60">
          No tickets found.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-coco-dark/10 bg-coco-warm/50">
                <th className="text-left px-4 py-3 text-xs font-bold text-coco-accent uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-coco-accent uppercase tracking-wider">
                  Subject
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-coco-accent uppercase tracking-wider">
                  Category
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-coco-accent uppercase tracking-wider">
                  User
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-coco-accent uppercase tracking-wider">
                  Priority
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-coco-accent uppercase tracking-wider">
                  Updated
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="border-b border-coco-dark/5 hover:bg-coco-warm/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 border ${
                        statusColors[ticket.status] || statusColors.open
                      }`}
                    >
                      {ticket.status === "in_progress"
                        ? "IN PROGRESS"
                        : ticket.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-coco-dark">
                    {ticket.subject}
                  </td>
                  <td className="px-4 py-3">
                    {ticket.category && categoryLabels[ticket.category] ? (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 border ${
                          categoryLabels[ticket.category].color
                        }`}
                      >
                        {categoryLabels[ticket.category].text}
                      </span>
                    ) : (
                      <span className="text-xs text-coco-coffee/40">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-coco-coffee/70">
                    {ticket.user_discord_id}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs ${
                        priorityColors[ticket.priority] || priorityColors.normal
                      }`}
                    >
                      {ticket.priority.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-coco-coffee/60">
                    {new Date(ticket.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/tickets/${ticket.id}`}
                      className="text-coco-accent hover:text-coco-ember text-xs font-bold uppercase tracking-wider"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
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
            className="px-3 py-1.5 text-sm font-bold border-2 border-coco-dark/10 disabled:opacity-30 hover:border-coco-accent"
          >
            Prev
          </button>
          <span className="text-sm text-coco-coffee px-3">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-sm font-bold border-2 border-coco-dark/10 disabled:opacity-30 hover:border-coco-accent"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
