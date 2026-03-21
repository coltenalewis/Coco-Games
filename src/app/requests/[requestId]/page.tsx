"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface RequestDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  requester_discord_id: string;
  requester_username: string;
  requester_avatar: string | null;
  created_at: string;
  updated_at: string;
}

interface Comment {
  id: string;
  content: string;
  author_discord_id: string;
  author_username: string;
  author_role: string;
  created_at: string;
}

const categoryColors: Record<string, string> = {
  feature_request: "bg-blue-100 text-blue-700 border-blue-300",
  bug_report: "bg-red-100 text-red-700 border-red-300",
  resource_request: "bg-purple-100 text-purple-700 border-purple-300",
  time_off: "bg-amber-100 text-amber-700 border-amber-300",
  access_request: "bg-green-100 text-green-700 border-green-300",
  general: "bg-gray-100 text-gray-600 border-gray-300",
};

const statusColors: Record<string, string> = {
  open: "bg-green-100 text-green-700 border-green-300",
  approved: "bg-emerald-100 text-emerald-700 border-emerald-300",
  denied: "bg-red-100 text-red-700 border-red-300",
  in_progress: "bg-yellow-100 text-yellow-700 border-yellow-300",
  completed: "bg-blue-100 text-blue-700 border-blue-300",
  cancelled: "bg-gray-100 text-gray-500 border-gray-300",
};

const roleBadgeColors: Record<string, string> = {
  Owner: "bg-red-100 text-red-700",
  Executive: "bg-purple-100 text-purple-700",
  Admin: "bg-orange-100 text-orange-700",
  Developer: "bg-blue-100 text-blue-700",
  Mod: "bg-green-100 text-green-700",
  Contractor: "bg-yellow-100 text-yellow-700",
  User: "bg-gray-100 text-gray-600",
};

const STATUSES = ["open", "approved", "denied", "in_progress", "completed", "cancelled"];
const PRIORITIES = ["low", "normal", "high", "urgent"];

function formatCategory(cat: string): string {
  return cat
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatStatus(s: string): string {
  return s
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function RequestDetailPage() {
  const params = useParams();
  const requestId = params.requestId as string;

  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  // Admin controls
  const [newStatus, setNewStatus] = useState("");
  const [newPriority, setNewPriority] = useState("");
  const [assignTo, setAssignTo] = useState("");
  const [savingAssign, setSavingAssign] = useState(false);

  // Status change confirmation modal
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState("");
  const [statusComment, setStatusComment] = useState("");
  const [changingStatus, setChangingStatus] = useState(false);

  // Comments
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchRequest = useCallback(async () => {
    try {
      const res = await fetch(`/api/requests/${requestId}`);
      if (res.ok) {
        const data = await res.json();
        setRequest(data);
        setNewStatus(data.status);
        setNewPriority(data.priority);
        setAssignTo(data.assigned_to || "");
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/requests/${requestId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch {
      // ignore
    }
  }, [requestId]);

  useEffect(() => {
    fetchRequest();
    fetchComments();
  }, [fetchRequest, fetchComments]);

  const handleStatusChange = (status: string) => {
    if (status === request?.status) return;
    setPendingStatus(status);
    setStatusComment("");
    setShowStatusConfirm(true);
  };

  const confirmStatusChange = async () => {
    setChangingStatus(true);
    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: pendingStatus,
          comment: statusComment || undefined,
        }),
      });
      if (res.ok) {
        setShowStatusConfirm(false);
        setPendingStatus("");
        setStatusComment("");
        fetchRequest();
        fetchComments();
      }
    } catch {
      // ignore
    } finally {
      setChangingStatus(false);
    }
  };

  const handlePriorityChange = async (p: string) => {
    setNewPriority(p);
    try {
      await fetch(`/api/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: p }),
      });
      fetchRequest();
    } catch {
      // ignore
    }
  };

  const handleAssign = async () => {
    setSavingAssign(true);
    try {
      await fetch(`/api/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigned_to: assignTo || null }),
      });
      fetchRequest();
    } catch {
      // ignore
    } finally {
      setSavingAssign(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      await fetch(`/api/requests/${requestId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      setNewComment("");
      fetchComments();
    } catch {
      // ignore
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="card p-6 animate-pulse h-96" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-coco-coffee font-medium">Request not found.</p>
        <Link
          href="/requests"
          className="text-coco-accent text-sm mt-2 inline-block"
        >
          Back to Requests
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link
        href="/requests"
        className="text-coco-accent hover:text-coco-ember text-sm font-bold uppercase tracking-wider"
      >
        &larr; Requests
      </Link>

      {/* Request Header */}
      <div className="card p-5 mt-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 border ${
                  statusColors[request.status] || statusColors.open
                }`}
              >
                {formatStatus(request.status).toUpperCase()}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 border ${
                  categoryColors[request.category] || categoryColors.general
                }`}
              >
                {formatCategory(request.category).toUpperCase()}
              </span>
              <span className="text-[10px] font-bold text-coco-coffee/50 uppercase">
                {request.priority}
              </span>
            </div>
            <h1 className="text-xl font-black text-coco-dark">
              {request.title}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-6 h-6 rounded-full bg-coco-coffee/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                {request.requester_avatar ? (
                  <img
                    src={request.requester_avatar}
                    alt={request.requester_username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[9px] font-bold text-coco-coffee">
                    {request.requester_username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <span className="text-xs text-coco-coffee/60">
                {request.requester_username} &middot;{" "}
                {new Date(request.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        {request.description && (
          <div className="mt-4 pt-4 border-t border-coco-dark/10">
            <p className="text-sm text-coco-dark whitespace-pre-wrap">
              {request.description}
            </p>
          </div>
        )}
      </div>

      {/* Admin Controls */}
      <div className="card p-5 mb-4">
        <h3 className="text-xs font-bold text-coco-coffee uppercase tracking-wider mb-3">
          Admin Controls
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Status */}
          <div>
            <label className="block text-[10px] font-bold text-coco-coffee/60 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className={`w-full px-3 py-2 border text-xs font-bold uppercase focus:outline-none focus:border-coco-accent transition-colors min-h-[40px] ${
                statusColors[newStatus] || statusColors.open
              }`}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {formatStatus(s)}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-[10px] font-bold text-coco-coffee/60 uppercase tracking-wider mb-1">
              Priority
            </label>
            <select
              value={newPriority}
              onChange={(e) => handlePriorityChange(e.target.value)}
              className="w-full px-3 py-2 border-2 border-coco-dark/10 bg-white text-coco-dark text-xs font-bold uppercase focus:outline-none focus:border-coco-accent transition-colors min-h-[40px]"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Assign */}
          <div>
            <label className="block text-[10px] font-bold text-coco-coffee/60 uppercase tracking-wider mb-1">
              Assigned To
            </label>
            <div className="flex gap-1">
              <input
                type="text"
                value={assignTo}
                onChange={(e) => setAssignTo(e.target.value)}
                placeholder="Discord ID..."
                className="flex-1 px-3 py-2 border-2 border-coco-dark/10 bg-white text-coco-dark text-xs focus:outline-none focus:border-coco-accent min-h-[40px]"
              />
              <button
                onClick={handleAssign}
                disabled={savingAssign}
                className="btn-primary text-xs py-1 px-3 disabled:opacity-50 min-h-[40px]"
              >
                {savingAssign ? "..." : "Set"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments */}
      <div className="card p-5">
        <h3 className="text-xs font-bold text-coco-coffee uppercase tracking-wider mb-3">
          Comments
        </h3>

        <div className="space-y-3 mb-4">
          {comments.length === 0 ? (
            <p className="text-xs text-coco-coffee/40 italic py-2">
              No comments yet.
            </p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="border border-coco-dark/10 p-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-coco-dark">
                    {comment.author_username}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 ${
                      roleBadgeColors[comment.author_role] ||
                      roleBadgeColors.User
                    }`}
                  >
                    {comment.author_role}
                  </span>
                  <span className="text-[10px] text-coco-coffee/40 ml-auto">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-coco-dark whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleAddComment} className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 px-3 py-2 border-2 border-coco-dark/10 bg-white text-coco-dark text-sm focus:outline-none focus:border-coco-accent min-h-[40px]"
          />
          <button
            type="submit"
            disabled={submittingComment || !newComment.trim()}
            className="btn-primary text-xs py-1 px-4 disabled:opacity-50 min-h-[40px]"
          >
            {submittingComment ? "..." : "Send"}
          </button>
        </form>
      </div>

      {/* Status Change Confirmation Modal */}
      {showStatusConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setShowStatusConfirm(false)}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-white border-2 border-coco-dark/10 shadow-xl mx-4 p-5"
          >
            <h3 className="text-sm font-bold text-coco-dark uppercase tracking-wider mb-3">
              Confirm Status Change
            </h3>
            <p className="text-sm text-coco-coffee mb-3">
              Change status from{" "}
              <span className="font-bold">{formatStatus(request.status)}</span>{" "}
              to{" "}
              <span className="font-bold">{formatStatus(pendingStatus)}</span>?
            </p>
            <div className="mb-4">
              <label className="block text-[10px] font-bold text-coco-coffee/60 uppercase tracking-wider mb-1">
                Comment (optional)
              </label>
              <textarea
                value={statusComment}
                onChange={(e) => setStatusComment(e.target.value)}
                rows={3}
                placeholder="Add a reason for this change..."
                className="w-full px-3 py-2 border-2 border-coco-dark/10 bg-white text-coco-dark text-sm focus:outline-none focus:border-coco-accent resize-none transition-colors"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowStatusConfirm(false);
                  setNewStatus(request.status);
                }}
                className="px-4 py-2 text-xs font-bold text-coco-coffee hover:text-coco-dark transition-colors min-h-[40px]"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                disabled={changingStatus}
                className="btn-primary text-xs py-2 px-4 disabled:opacity-50 min-h-[40px]"
              >
                {changingStatus ? "Updating..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
