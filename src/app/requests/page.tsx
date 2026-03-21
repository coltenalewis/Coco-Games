"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Request {
  id: string;
  title: string;
  category: string;
  status: string;
  priority: string;
  requester_username: string;
  requester_discord_id: string;
  created_at: string;
  updated_at: string;
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

const priorityColors: Record<string, string> = {
  low: "text-gray-500",
  normal: "text-coco-dark",
  high: "text-orange-600 font-bold",
  urgent: "text-red-600 font-bold",
};

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "feature_request", label: "Feature Request" },
  { value: "bug_report", label: "Bug Report" },
  { value: "resource_request", label: "Resource Request" },
  { value: "time_off", label: "Time Off" },
  { value: "access_request", label: "Access Request" },
  { value: "general", label: "General" },
];

const STATUSES = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "approved", label: "Approved" },
  { value: "denied", label: "Denied" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

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

export default function RequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/requests?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="text-coco-accent font-bold text-xs uppercase tracking-[0.2em]">
            Internal
          </span>
          <h1 className="text-3xl font-black text-coco-dark mt-1">Requests</h1>
        </div>
        <Link href="/requests/new" className="btn-primary text-sm min-h-[40px]">
          New Request
        </Link>
      </div>

      {/* Category Filters */}
      <div className="mb-3 overflow-x-auto -mx-4 px-4">
        <div className="flex gap-2 min-w-max">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategoryFilter(cat.value)}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-2 transition-all whitespace-nowrap min-h-[40px] ${
                categoryFilter === cat.value
                  ? "bg-coco-dark text-coco-gold border-coco-dark"
                  : "bg-white text-coco-dark border-coco-dark/15 hover:border-coco-accent"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status Filters */}
      <div className="mb-6 overflow-x-auto -mx-4 px-4">
        <div className="flex gap-2 min-w-max">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-2 transition-all whitespace-nowrap min-h-[40px] ${
                statusFilter === s.value
                  ? "bg-coco-dark text-coco-gold border-coco-dark"
                  : "bg-white text-coco-dark border-coco-dark/15 hover:border-coco-accent"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Request List */}
      {loading ? (
        <div className="space-y-3">
          <div className="card p-5 animate-pulse h-20" />
          <div className="card p-5 animate-pulse h-20" />
          <div className="card p-5 animate-pulse h-20" />
        </div>
      ) : requests.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-coco-coffee mb-4 font-medium">
            No requests found.
          </p>
          <Link
            href="/requests/new"
            className="btn-primary inline-block text-sm min-h-[40px]"
          >
            Submit a Request
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <Link
              key={req.id}
              href={`/requests/${req.id}`}
              className="card-interactive block p-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0">
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 border whitespace-nowrap ${
                        statusColors[req.status] || statusColors.open
                      }`}
                    >
                      {formatStatus(req.status).toUpperCase()}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 border whitespace-nowrap ${
                        categoryColors[req.category] || categoryColors.general
                      }`}
                    >
                      {formatCategory(req.category).toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-bold text-coco-dark truncate">
                    {req.title}
                  </h3>
                </div>
                <div className="flex items-center gap-4 text-xs flex-shrink-0">
                  <span
                    className={
                      priorityColors[req.priority] || priorityColors.normal
                    }
                  >
                    {req.priority.toUpperCase()}
                  </span>
                  <span className="text-coco-coffee/50 whitespace-nowrap">
                    {req.requester_username}
                  </span>
                  <span className="text-coco-coffee/50 whitespace-nowrap">
                    {new Date(req.created_at).toLocaleDateString()}
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
