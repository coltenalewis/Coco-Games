"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import TicketChat from "@/components/TicketChat";
export const runtime = 'edge';

interface TicketDetail {
  id: string;
  user_discord_id: string;
  subject: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  creator_username: string;
  creator_avatar: string | null;
}

const statusColors: Record<string, string> = {
  open: "bg-green-100 text-green-700 border-green-300",
  in_progress: "bg-yellow-100 text-yellow-700 border-yellow-300",
  closed: "bg-gray-100 text-gray-500 border-gray-300",
};

export default function AdminTicketDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const ticketId = params.id as string;
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchTicket = useCallback(async () => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`);
      if (res.ok) setTicket(await res.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  const updateTicket = async (updates: Record<string, string | null>) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        fetchTicket();
      } else {
        const data = await res.json();
        alert(data.error || "Update failed");
      }
    } catch {
      alert("Update failed");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="card p-6 animate-pulse h-96" />;
  }

  if (!ticket) {
    return (
      <div className="card p-8 text-center">
        <p className="text-coco-coffee font-medium">Ticket not found.</p>
        <Link
          href="/admin/tickets"
          className="text-coco-accent text-sm mt-2 inline-block"
        >
          Back to Tickets
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link
        href="/admin/tickets"
        className="text-coco-accent hover:text-coco-ember text-sm font-bold uppercase tracking-wider"
      >
        &larr; All Tickets
      </Link>

      {/* Ticket Header with Admin Controls */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 border ${
                  statusColors[ticket.status] || statusColors.open
                }`}
              >
                {ticket.status === "in_progress"
                  ? "IN PROGRESS"
                  : ticket.status.toUpperCase()}
              </span>
              <span className="text-[10px] font-bold text-coco-coffee/50 uppercase">
                {ticket.priority}
              </span>
            </div>
            <h1 className="text-xl font-black text-coco-dark">
              {ticket.subject}
            </h1>
            <p className="text-xs text-coco-coffee/60 mt-1">
              By {ticket.creator_username} ({ticket.user_discord_id}) &middot;{" "}
              {new Date(ticket.created_at).toLocaleString()}
            </p>
            {ticket.assigned_to && (
              <p className="text-xs text-coco-accent mt-1">
                Assigned to: {ticket.assigned_to}
              </p>
            )}
          </div>

          {/* Admin Controls */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            {/* Status */}
            <select
              value={ticket.status}
              onChange={(e) => updateTicket({ status: e.target.value })}
              disabled={updating}
              className="px-2 py-1.5 text-xs font-bold border-2 border-coco-dark/10 bg-white focus:outline-none focus:border-coco-accent"
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="closed">Closed</option>
            </select>

            {/* Priority */}
            <select
              value={ticket.priority}
              onChange={(e) => updateTicket({ priority: e.target.value })}
              disabled={updating}
              className="px-2 py-1.5 text-xs font-bold border-2 border-coco-dark/10 bg-white focus:outline-none focus:border-coco-accent"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            {/* Assign to self */}
            {ticket.assigned_to !== session?.user?.discordId && (
              <button
                onClick={() =>
                  updateTicket({
                    assigned_to: session?.user?.discordId || null,
                  })
                }
                disabled={updating}
                className="px-2 py-1.5 text-xs font-bold border-2 border-coco-accent/30 text-coco-accent hover:bg-coco-accent/10 transition-colors"
              >
                Claim
              </button>
            )}

            {/* View user */}
            <Link
              href={`/admin/users/${ticket.user_discord_id}`}
              className="px-2 py-1.5 text-xs font-bold border-2 border-coco-dark/10 text-coco-coffee text-center hover:border-coco-accent transition-colors"
            >
              View User
            </Link>
          </div>
        </div>
      </div>

      {/* Chat */}
      <div className="card overflow-hidden">
        <TicketChat
          ticketId={ticketId}
          currentUserDiscordId={session?.user?.discordId || ""}
          isClosed={ticket.status === "closed"}
        />
      </div>
    </div>
  );
}
