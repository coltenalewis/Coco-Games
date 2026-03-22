"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Ticket {
  id: string;
  ticket_number: number;
  subject: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

const categoryLabels: Record<string, { text: string; color: string }> = {
  discord_appeal: { text: "DISCORD APPEAL", color: "bg-indigo-100 text-indigo-700 border-indigo-300" },
  game_appeal: { text: "GAME APPEAL", color: "bg-purple-100 text-purple-700 border-purple-300" },
  question: { text: "QUESTION", color: "bg-cyan-100 text-cyan-700 border-cyan-300" },
  business: { text: "BUSINESS", color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  bug_report: { text: "BUG", color: "bg-orange-100 text-orange-700 border-orange-300" },
  game_report: { text: "REPORT", color: "bg-red-100 text-red-700 border-red-300" },
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

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tickets?status=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="text-coco-accent font-bold text-xs uppercase tracking-[0.2em]">
            Support
          </span>
          <h1 className="text-3xl font-black text-coco-dark mt-1">
            My Tickets
          </h1>
        </div>
        <Link href="/tickets/new" className="btn-primary text-sm">
          New Ticket
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {["all", "open", "in_progress", "closed"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-2 transition-all ${
              filter === s
                ? "bg-coco-dark text-coco-gold border-coco-dark"
                : "bg-white text-coco-dark border-coco-dark/15 hover:border-coco-accent"
            }`}
          >
            {s === "in_progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Ticket List */}
      {loading ? (
        <div className="space-y-3">
          <div className="card p-5 animate-pulse h-20" />
          <div className="card p-5 animate-pulse h-20" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-coco-coffee mb-4 font-medium">
            No tickets found.
          </p>
          <Link href="/tickets/new" className="btn-primary inline-block text-sm">
            Create Your First Ticket
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/tickets/${ticket.id}`}
              className="card-interactive block p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 border ${
                      statusColors[ticket.status] || statusColors.open
                    }`}
                  >
                    {ticket.status === "in_progress"
                      ? "IN PROGRESS"
                      : ticket.status.toUpperCase()}
                  </span>
                  {ticket.category && categoryLabels[ticket.category] && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 border ${
                        categoryLabels[ticket.category].color
                      }`}
                    >
                      {categoryLabels[ticket.category].text}
                    </span>
                  )}
                  <h3 className="font-bold text-coco-dark">
                    <span className="text-coco-coffee/50 font-mono text-xs mr-1.5">
                      #{ticket.ticket_number}
                    </span>
                    {ticket.subject}
                  </h3>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span
                    className={
                      priorityColors[ticket.priority] || priorityColors.normal
                    }
                  >
                    {ticket.priority.toUpperCase()}
                  </span>
                  <span className="text-coco-coffee/50">
                    {new Date(ticket.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
