"use client";

import { useState, useEffect, useCallback } from "react";

interface AuditLog {
  id: string;
  action: string;
  actor_discord_id: string;
  actor_username: string;
  target_type: string | null;
  target_id: string | null;
  target_name: string | null;
  details: Record<string, unknown>;
  note: string | null;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  role_change: "bg-purple-100 text-purple-700 border-purple-300",
  ticket_close: "bg-gray-100 text-gray-600 border-gray-300",
  ticket_escalate: "bg-yellow-100 text-yellow-700 border-yellow-300",
  board_create: "bg-blue-100 text-blue-700 border-blue-300",
  board_delete: "bg-red-100 text-red-700 border-red-300",
  document_send: "bg-green-100 text-green-700 border-green-300",
  permission_change: "bg-coco-warm text-coco-accent border-coco-accent/30",
  user_link: "bg-cyan-100 text-cyan-700 border-cyan-300",
  discipline_delete: "bg-red-100 text-red-700 border-red-300",
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (actionFilter) params.set("action", actionFilter);
      const res = await fetch(`/api/audit-logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [page, actionFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="space-y-6">
      <h2 className="text-lg sm:text-xl font-black text-coco-dark">Audit Logs</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {["", "role_change", "ticket_close", "ticket_escalate", "permission_change", "document_send", "discipline_delete"].map((a) => (
          <button key={a} onClick={() => { setActionFilter(a); setPage(1); }}
            className={`px-3 py-1.5 text-xs font-bold border-2 transition-all min-h-[36px] ${
              actionFilter === a ? "bg-coco-dark text-coco-gold border-coco-dark" : "border-coco-dark/10 text-coco-coffee hover:border-coco-accent"
            }`}>
            {a === "" ? "All" : a.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Logs */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-coco-coffee/40 text-sm">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-coco-coffee/40 text-sm">No audit logs found.</div>
        ) : (
          <div className="divide-y divide-coco-dark/5">
            {logs.map((log) => (
              <div key={log.id} className="px-4 py-3 hover:bg-coco-warm/20 transition-colors">
                <div className="flex items-start gap-3">
                  <span className={`text-[9px] font-bold px-2 py-0.5 border flex-shrink-0 mt-0.5 ${ACTION_COLORS[log.action] || "bg-gray-100 text-gray-600 border-gray-300"}`}>
                    {log.action.replace(/_/g, " ").toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-coco-dark">
                      <strong>{log.actor_username}</strong>
                      {log.target_name && <> &rarr; <strong>{log.target_name}</strong></>}
                      {log.details && (log.details as Record<string, string>).oldRole && (
                        <span className="text-coco-coffee/60">
                          {" "}({(log.details as Record<string, string>).oldRole} &rarr; {(log.details as Record<string, string>).newRole})
                        </span>
                      )}
                    </p>
                    {log.note && (
                      <p className="text-xs text-coco-coffee/60 mt-0.5 italic">&ldquo;{log.note}&rdquo;</p>
                    )}
                    <p className="text-[10px] text-coco-coffee/30 mt-0.5">
                      {new Date(log.created_at).toLocaleString()}
                      {log.target_type && <> &middot; {log.target_type}</>}
                      {log.target_id && <> &middot; <span className="font-mono">{log.target_id.slice(0, 8)}...</span></>}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
            className="px-3 py-1.5 text-sm font-bold border-2 border-coco-dark/10 disabled:opacity-30 hover:border-coco-accent min-h-[40px]">Prev</button>
          <span className="text-sm text-coco-coffee px-3">Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            className="px-3 py-1.5 text-sm font-bold border-2 border-coco-dark/10 disabled:opacity-30 hover:border-coco-accent min-h-[40px]">Next</button>
        </div>
      )}
    </div>
  );
}
