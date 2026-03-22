"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import TicketChat from "@/components/TicketChat";

interface TicketDetail {
  id: string;
  ticket_number: number;
  user_discord_id: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  server_name: string;
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

const CATEGORIES = [
  { value: "question", label: "Question" },
  { value: "bug_report", label: "Bug Report" },
  { value: "game_report", label: "Game Report" },
  { value: "discord_appeal", label: "Discord Appeal" },
  { value: "game_appeal", label: "Game Appeal" },
  { value: "business", label: "Business Inquiry" },
];

const AUTOFILL_MESSAGES: Record<string, string[]> = {
  closed: [
    "This ticket has been resolved. Thank you for reaching out!",
    "After investigation, this issue has been resolved. If you continue to experience problems, please open a new ticket.",
    "Your appeal has been reviewed and a decision has been made. This ticket is now closed.",
    "Thank you for your report. We've taken appropriate action. This ticket is now closed.",
    "This inquiry has been addressed. Feel free to open a new ticket if you have further questions.",
  ],
  in_progress: [
    "We're looking into this and will get back to you shortly.",
    "Your ticket has been escalated to the appropriate team.",
    "We've received your report and are investigating. Please allow some time for review.",
  ],
  open: [
    "This ticket has been reopened for further review.",
    "Additional information is needed. Please respond with the requested details.",
  ],
};

export default function AdminTicketDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const ticketId = params.id as string;
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Status change modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState("");
  const [closingMessage, setClosingMessage] = useState("");

  // Escalation modal
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const fetchTicket = useCallback(async () => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`);
      if (res.ok) setTicket(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [ticketId]);

  useEffect(() => { fetchTicket(); }, [fetchTicket]);

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
    } catch { alert("Update failed"); }
    finally { setUpdating(false); }
  };

  const handleStatusChange = (newStatus: string) => {
    setPendingStatus(newStatus);
    // Autofill with first preset message
    const presets = AUTOFILL_MESSAGES[newStatus] || [];
    setClosingMessage(presets[0] || "");
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    setShowStatusModal(false);
    await updateTicket({
      status: pendingStatus,
      closing_message: closingMessage || null,
    });
    setClosingMessage("");
    setPendingStatus("");
  };

  const handleEscalate = async () => {
    if (!newCategory || newCategory === ticket?.category) return;
    setShowEscalateModal(false);
    await updateTicket({ category: newCategory });
    setNewCategory("");
  };

  const statusLabel = (s: string) =>
    s === "in_progress" ? "IN PROGRESS" : s.toUpperCase();

  if (loading) return <div className="card p-6 animate-pulse h-96" />;

  if (!ticket) {
    return (
      <div className="card p-8 text-center">
        <p className="text-coco-coffee font-medium">Ticket not found.</p>
        <Link href="/admin/tickets" className="text-coco-accent text-sm mt-2 inline-block">Back to Tickets</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link
        href="/admin/tickets"
        className="text-coco-accent hover:text-coco-ember text-xs sm:text-sm font-bold uppercase tracking-wider min-h-[36px] inline-flex items-center"
      >
        &larr; All Tickets
      </Link>

      {/* Ticket Header */}
      <div className="card p-3 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-[10px] font-bold px-2 py-0.5 border ${statusColors[ticket.status] || statusColors.open}`}>
                {statusLabel(ticket.status)}
              </span>
              <span className="text-[10px] font-bold text-coco-coffee/50 uppercase">{ticket.priority}</span>
              <button
                onClick={() => { setNewCategory(ticket.category); setShowEscalateModal(true); }}
                className="text-[10px] font-bold text-coco-coffee/30 uppercase hover:text-coco-accent transition-colors cursor-pointer"
                title="Click to escalate/change category"
              >
                {ticket.category.replace(/_/g, " ")}
              </button>
              {ticket.server_name && (
                <span className="text-[10px] font-bold text-coco-accent/70 uppercase">{ticket.server_name}</span>
              )}
            </div>
            <h1 className="text-lg sm:text-xl font-black text-coco-dark">
              <span className="text-coco-coffee/50 font-mono text-sm mr-1.5">#{ticket.ticket_number}</span>
              {ticket.subject}
            </h1>
            <p className="text-[10px] sm:text-xs text-coco-coffee/60 mt-1">
              By {ticket.creator_username} ({ticket.user_discord_id}) &middot; {new Date(ticket.created_at).toLocaleString()}
            </p>
            {ticket.assigned_to && (
              <p className="text-[10px] sm:text-xs text-coco-accent mt-1">Assigned to: {ticket.assigned_to}</p>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0 flex-wrap">
            <select
              value={ticket.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={updating}
              className="px-2 py-1.5 text-xs font-bold border-2 border-coco-dark/10 bg-white focus:outline-none focus:border-coco-accent min-h-[40px]"
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={ticket.priority}
              onChange={(e) => updateTicket({ priority: e.target.value })}
              disabled={updating}
              className="px-2 py-1.5 text-xs font-bold border-2 border-coco-dark/10 bg-white focus:outline-none focus:border-coco-accent min-h-[40px]"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            <button
              onClick={() => { setNewCategory(ticket.category); setShowEscalateModal(true); }}
              disabled={updating}
              className="px-2 py-1.5 text-xs font-bold border-2 border-purple-300 text-purple-600 hover:bg-purple-50 transition-colors min-h-[40px]"
            >
              Escalate
            </button>

            {ticket.assigned_to !== session?.user?.discordId &&
             ticket.user_discord_id !== session?.user?.discordId && (
              <button
                onClick={() => updateTicket({ assigned_to: session?.user?.discordId || null })}
                disabled={updating}
                className="px-2 py-1.5 text-xs font-bold border-2 border-coco-accent/30 text-coco-accent hover:bg-coco-accent/10 transition-colors min-h-[40px]"
              >
                Claim
              </button>
            )}

            <Link
              href={`/admin/users/${ticket.user_discord_id}`}
              className="px-2 py-1.5 text-xs font-bold border-2 border-coco-dark/10 text-coco-coffee text-center hover:border-coco-accent transition-colors min-h-[40px] flex items-center justify-center"
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

      {/* Status Change Modal with Autofill */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white border-2 border-coco-dark/10 shadow-coco-lg w-full max-w-md p-5 sm:p-6 space-y-4">
            <h3 className="text-lg font-black text-coco-dark">
              Change Status to {statusLabel(pendingStatus)}
            </h3>
            <p className="text-xs sm:text-sm text-coco-coffee/60">
              The user will be notified via DM.
            </p>

            {/* Quick fill presets */}
            {(AUTOFILL_MESSAGES[pendingStatus] || []).length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-coco-coffee uppercase tracking-wider mb-1.5">Quick Fill</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {(AUTOFILL_MESSAGES[pendingStatus] || []).map((msg, i) => (
                    <button
                      key={i}
                      onClick={() => setClosingMessage(msg)}
                      className={`w-full text-left text-xs px-3 py-2 border transition-colors min-h-[36px] ${
                        closingMessage === msg
                          ? "border-coco-accent bg-coco-accent/10 text-coco-dark"
                          : "border-coco-dark/10 text-coco-coffee/70 hover:border-coco-accent/30"
                      }`}
                    >
                      {msg}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom message */}
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1">
                Message to user
              </label>
              <textarea
                value={closingMessage}
                onChange={(e) => setClosingMessage(e.target.value)}
                rows={3}
                placeholder="Type a custom message or select a preset above..."
                className="w-full px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-sm focus:outline-none focus:border-coco-accent resize-y"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowStatusModal(false); setPendingStatus(""); setClosingMessage(""); }}
                className="px-4 py-2 text-xs font-bold border-2 border-coco-dark/10 text-coco-coffee min-h-[40px]"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                disabled={updating}
                className={`px-4 py-2 text-xs font-bold border-2 min-h-[40px] transition-colors ${
                  pendingStatus === "closed"
                    ? "bg-red-500 text-white border-red-600 hover:bg-red-600"
                    : "btn-primary"
                }`}
              >
                {updating ? "Updating..." : `Confirm ${statusLabel(pendingStatus)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Escalation Modal */}
      {showEscalateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white border-2 border-coco-dark/10 shadow-coco-lg w-full max-w-sm p-5 sm:p-6 space-y-4">
            <h3 className="text-lg font-black text-coco-dark">Escalate Ticket</h3>
            <p className="text-xs text-coco-coffee/60">Change the ticket category. This will move it to the appropriate team.</p>

            <div className="space-y-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setNewCategory(cat.value)}
                  className={`w-full text-left px-3 py-2.5 text-sm font-medium border-2 transition-colors min-h-[40px] ${
                    newCategory === cat.value
                      ? "border-purple-400 bg-purple-50 text-purple-700"
                      : cat.value === ticket.category
                      ? "border-coco-dark/10 text-coco-coffee/40 bg-coco-warm/30"
                      : "border-coco-dark/10 text-coco-dark hover:border-purple-300"
                  }`}
                >
                  {cat.label}
                  {cat.value === ticket.category && (
                    <span className="text-[10px] text-coco-coffee/30 ml-2">(current)</span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowEscalateModal(false); setNewCategory(""); }}
                className="px-4 py-2 text-xs font-bold border-2 border-coco-dark/10 text-coco-coffee min-h-[40px]"
              >
                Cancel
              </button>
              <button
                onClick={handleEscalate}
                disabled={updating || newCategory === ticket.category}
                className="px-4 py-2 text-xs font-bold bg-purple-500 text-white border-2 border-purple-600 hover:bg-purple-600 min-h-[40px] disabled:opacity-50"
              >
                Escalate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
