"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface Board {
  id: string;
  name: string;
  description: string | null;
  color: string;
  view_roles: string[];
  edit_roles: string[];
  created_at: string;
}

const ALL_ROLES = [
  { value: "contractor", label: "Contractor" },
  { value: "mod", label: "Mod" },
  { value: "developer", label: "Developer" },
  { value: "admin", label: "Admin" },
  { value: "executive", label: "Executive" },
  { value: "owner", label: "Owner" },
];

const PRESET_COLORS = [
  "#E8944A", "#D35400", "#F5B041", "#3498db", "#2ecc71",
  "#9b59b6", "#e74c3c", "#1abc9c", "#34495e", "#f39c12",
];

const inputCls = "w-full px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-sm focus:outline-none focus:border-coco-accent transition-colors";

export default function BoardsPage() {
  const { data: session } = useSession();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newColor, setNewColor] = useState("#E8944A");
  const [viewRoles, setViewRoles] = useState<Set<string>>(new Set(["contractor", "mod", "developer", "admin", "executive", "owner"]));
  const [editRoles, setEditRoles] = useState<Set<string>>(new Set(["developer", "admin", "executive", "owner"]));

  const isOwner = session?.user?.role === "owner";

  const fetchBoards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/boards");
      if (res.ok) {
        const data = await res.json();
        setBoards(data.boards || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBoards(); }, [fetchBoards]);

  const toggleRole = (set: Set<string>, setFn: (s: Set<string>) => void, role: string) => {
    const next = new Set(set);
    if (next.has(role)) next.delete(role); else next.add(role);
    setFn(next);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          description: newDescription,
          color: newColor,
          view_roles: Array.from(viewRoles),
          edit_roles: Array.from(editRoles),
        }),
      });
      if (res.ok) {
        setNewName("");
        setNewDescription("");
        setNewColor("#E8944A");
        setViewRoles(new Set(["contractor", "mod", "developer", "admin", "executive", "owner"]));
        setEditRoles(new Set(["developer", "admin", "executive", "owner"]));
        setShowCreate(false);
        fetchBoards();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create board");
      }
    } catch {
      setError("Failed to create board");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <span className="text-coco-accent font-bold text-xs uppercase tracking-[0.2em]">Project Management</span>
          <h1 className="text-2xl sm:text-3xl font-black text-[--dp-text] mt-1">Boards</h1>
        </div>
        {isOwner && (
          <button onClick={() => setShowCreate(!showCreate)} className="btn-primary text-xs !px-4 !py-2 min-h-[40px]">
            {showCreate ? "Cancel" : "+ Create Board"}
          </button>
        )}
      </div>

      {/* Create Form */}
      {showCreate && isOwner && (
        <form onSubmit={handleCreate} className="card p-4 sm:p-6 mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[10px] sm:text-xs font-bold text-[--dp-muted] uppercase tracking-wider mb-1">Board Name</label>
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Game Development" className={inputCls} required />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] sm:text-xs font-bold text-[--dp-muted] uppercase tracking-wider mb-1">Description</label>
              <input type="text" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="What is this board for?" className={inputCls} />
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-[10px] sm:text-xs font-bold text-[--dp-muted] uppercase tracking-wider mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setNewColor(c)}
                  className={`w-8 h-8 rounded-sm border-2 transition-all ${newColor === c ? "border-coco-dark scale-110" : "border-transparent"}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          {/* View Roles */}
          <div>
            <label className="block text-[10px] sm:text-xs font-bold text-[--dp-muted] uppercase tracking-wider mb-2">Who Can View</label>
            <div className="flex flex-wrap gap-2">
              {ALL_ROLES.map((r) => (
                <label key={r.value} className={`flex items-center gap-2 px-3 py-2 border-2 cursor-pointer text-xs font-bold transition-colors min-h-[40px] ${
                  viewRoles.has(r.value) ? "border-green-400 bg-green-50 text-green-700" : "border-coco-dark/10 text-[--dp-muted]"
                }`}>
                  <input type="checkbox" checked={viewRoles.has(r.value)} onChange={() => toggleRole(viewRoles, setViewRoles, r.value)} className="w-4 h-4 accent-green-500" />
                  {r.label}
                </label>
              ))}
            </div>
          </div>

          {/* Edit Roles */}
          <div>
            <label className="block text-[10px] sm:text-xs font-bold text-[--dp-muted] uppercase tracking-wider mb-2">Who Can Edit</label>
            <div className="flex flex-wrap gap-2">
              {ALL_ROLES.map((r) => (
                <label key={r.value} className={`flex items-center gap-2 px-3 py-2 border-2 cursor-pointer text-xs font-bold transition-colors min-h-[40px] ${
                  editRoles.has(r.value) ? "border-blue-400 bg-blue-50 text-blue-700" : "border-coco-dark/10 text-[--dp-muted]"
                }`}>
                  <input type="checkbox" checked={editRoles.has(r.value)} onChange={() => toggleRole(editRoles, setEditRoles, r.value)} className="w-4 h-4 accent-blue-500" />
                  {r.label}
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-red-600 text-xs font-bold">{error}</p>}

          <button type="submit" disabled={creating || !newName.trim()} className="btn-primary text-sm disabled:opacity-50 min-h-[44px]">
            {creating ? "Creating..." : "Create Board"}
          </button>
        </form>
      )}

      {/* Board Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="card p-6 animate-pulse h-32" />)}
        </div>
      ) : boards.length === 0 ? (
        <div className="card p-8 sm:p-12 text-center">
          <p className="text-[--dp-muted]/40 text-sm">No boards yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {boards.map((board) => (
            <Link key={board.id} href={`/boards/${board.id}`} className="card-interactive p-0 overflow-hidden group">
              <div className="h-2" style={{ background: board.color }} />
              <div className="p-4 sm:p-5">
                <h3 className="font-bold text-[--dp-text] text-sm sm:text-base mb-1 group-hover:text-coco-accent transition-colors">{board.name}</h3>
                {board.description && (
                  <p className="text-xs text-[--dp-muted]/50 line-clamp-2">{board.description}</p>
                )}
                <div className="flex flex-wrap gap-1 mt-3">
                  {(board.view_roles || []).slice(0, 4).map((r) => (
                    <span key={r} className="text-[9px] px-1.5 py-0.5 bg-coco-dark/5 text-[--dp-muted]/60 font-medium">{r}</span>
                  ))}
                  {(board.view_roles || []).length > 4 && (
                    <span className="text-[9px] text-[--dp-muted]/30">+{board.view_roles.length - 4}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
