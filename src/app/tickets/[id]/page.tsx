"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import TicketChat from "@/components/TicketChat";

interface TicketDetail {
  id: string;
  user_discord_id: string;
  subject: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  creator_username: string;
  creator_avatar: string | null;
}

const statusColors: Record<string, string> = {
  open: "bg-green-100 text-green-700 border-green-300",
  in_progress: "bg-yellow-100 text-yellow-700 border-yellow-300",
  closed: "bg-gray-100 text-gray-500 border-gray-300",
};

export default function TicketDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const ticketId = params.id as string;
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tickets/${ticketId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setTicket(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ticketId]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="card p-6 animate-pulse h-96" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-coco-coffee font-medium">Ticket not found.</p>
        <Link
          href="/tickets"
          className="text-coco-accent text-sm mt-2 inline-block"
        >
          Back to Tickets
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link
        href="/tickets"
        className="text-coco-accent hover:text-coco-ember text-sm font-bold uppercase tracking-wider"
      >
        &larr; My Tickets
      </Link>

      {/* Ticket Header */}
      <div className="card p-5 mt-4 mb-4">
        <div className="flex items-start justify-between">
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
              Opened by {ticket.creator_username} on{" "}
              {new Date(ticket.created_at).toLocaleDateString()}
            </p>
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
