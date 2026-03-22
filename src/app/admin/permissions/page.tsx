"use client";

import { useState, useEffect, useCallback } from "react";

interface Permission {
  id: string;
  permission_key: string;
  permission_label: string;
  permission_group: string;
  allowed_roles: string[];
  description: string | null;
  updated_at: string;
}

const ALL_ROLES = [
  { value: "owner", label: "Owner", color: "bg-orange-500" },
  { value: "executive", label: "Executive", color: "bg-green-500" },
  { value: "admin", label: "Admin", color: "bg-red-500" },
  { value: "developer", label: "Developer", color: "bg-violet-500" },
  { value: "coordinator", label: "Coordinator", color: "bg-cyan-500" },
  { value: "mod", label: "Mod", color: "bg-blue-500" },
  { value: "contractor", label: "Contractor", color: "bg-amber-500" },
  { value: "user", label: "User", color: "bg-gray-400" },
];

const GROUP_ICONS: Record<string, string> = {
  Pages: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z",
  "Ticket Visibility": "M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z",
  "Staff Portal": "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0",
  Actions: "M13 10V3L4 14h7v7l9-11h-7z",
};

const GROUP_COLORS: Record<string, string> = {
  Pages: "border-blue-400",
  "Ticket Visibility": "border-purple-400",
  "Staff Portal": "border-coco-accent",
  Actions: "border-green-400",
};

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newPerm, setNewPerm] = useState({ key: "", label: "", group: "Pages", description: "", roles: [] as string[] });

  const fetchPerms = useCallback(async () => {
    try {
      const res = await fetch("/api/permissions");
      if (res.ok) {
        const data = await res.json();
        setPermissions(data.permissions || []);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPerms(); }, [fetchPerms]);

  const toggleRole = async (permKey: string, role: string) => {
    if (role === "owner") return; // Owner always has access
    const perm = permissions.find((p) => p.permission_key === permKey);
    if (!perm) return;

    const current = perm.allowed_roles || [];
    const updated = current.includes(role)
      ? current.filter((r) => r !== role)
      : [...current, role];

    // Optimistic update
    setPermissions((prev) =>
      prev.map((p) => p.permission_key === permKey ? { ...p, allowed_roles: updated } : p)
    );

    setSaving(permKey);
    try {
      await fetch("/api/permissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permission_key: permKey, allowed_roles: updated }),
      });
    } catch {
      fetchPerms(); // Revert on error
    } finally {
      setSaving(null);
    }
  };

  const handleAddPerm = async () => {
    if (!newPerm.key || !newPerm.label) return;
    try {
      const res = await fetch("/api/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          permission_key: newPerm.key,
          permission_label: newPerm.label,
          permission_group: newPerm.group,
          allowed_roles: newPerm.roles,
          description: newPerm.description || null,
        }),
      });
      if (res.ok) {
        setShowAdd(false);
        setNewPerm({ key: "", label: "", group: "Pages", description: "", roles: [] });
        fetchPerms();
      }
    } catch { /* ignore */ }
  };

  const handleDeletePerm = async (key: string) => {
    if (!confirm(`Delete permission "${key}"?`)) return;
    await fetch("/api/permissions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permission_key: key }),
    });
    fetchPerms();
  };

  // Group permissions
  const groups = new Map<string, Permission[]>();
  for (const p of permissions) {
    const g = groups.get(p.permission_group) || [];
    g.push(p);
    groups.set(p.permission_group, g);
  }

  if (loading) {
    return <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="card p-6 animate-pulse h-32" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-coco-dark">Permissions Manager</h2>
          <p className="text-[10px] sm:text-xs text-coco-coffee/50 mt-0.5">
            Configure which roles can access pages, tickets, and features. Changes take effect immediately.
          </p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary text-xs !px-4 !py-2 min-h-[40px]">
          {showAdd ? "Cancel" : "+ Add Permission"}
        </button>
      </div>

      {/* Role Legend */}
      <div className="card p-3 sm:p-4">
        <p className="text-[10px] sm:text-xs font-bold text-coco-coffee uppercase tracking-wider mb-2">Role Legend</p>
        <div className="flex flex-wrap gap-2">
          {ALL_ROLES.map((r) => (
            <div key={r.value} className="flex items-center gap-1.5 text-xs">
              <div className={`w-3 h-3 rounded-sm ${r.color}`} />
              <span className="text-coco-dark font-medium">{r.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Add Permission Form */}
      {showAdd && (
        <div className="card p-4 sm:p-5 space-y-3">
          <h3 className="text-sm font-bold text-coco-dark">New Permission</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-coco-coffee uppercase tracking-wider mb-1">Key</label>
              <input type="text" value={newPerm.key} onChange={(e) => setNewPerm({ ...newPerm, key: e.target.value })} placeholder="e.g. page.my_feature" className="w-full px-3 py-2 border-2 border-coco-dark/10 bg-white text-sm focus:outline-none focus:border-coco-accent min-h-[40px]" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-coco-coffee uppercase tracking-wider mb-1">Label</label>
              <input type="text" value={newPerm.label} onChange={(e) => setNewPerm({ ...newPerm, label: e.target.value })} placeholder="My Feature" className="w-full px-3 py-2 border-2 border-coco-dark/10 bg-white text-sm focus:outline-none focus:border-coco-accent min-h-[40px]" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-coco-coffee uppercase tracking-wider mb-1">Group</label>
              <select value={newPerm.group} onChange={(e) => setNewPerm({ ...newPerm, group: e.target.value })} className="w-full px-3 py-2 border-2 border-coco-dark/10 bg-white text-sm focus:outline-none focus:border-coco-accent min-h-[40px]">
                <option value="Pages">Pages</option>
                <option value="Ticket Visibility">Ticket Visibility</option>
                <option value="Staff Portal">Staff Portal</option>
                <option value="Actions">Actions</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-coco-coffee uppercase tracking-wider mb-1">Description</label>
              <input type="text" value={newPerm.description} onChange={(e) => setNewPerm({ ...newPerm, description: e.target.value })} placeholder="What does this control?" className="w-full px-3 py-2 border-2 border-coco-dark/10 bg-white text-sm focus:outline-none focus:border-coco-accent min-h-[40px]" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-coco-coffee uppercase tracking-wider mb-1">Allowed Roles</label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_ROLES.filter((r) => r.value !== "owner").map((r) => (
                <label key={r.value} className={`flex items-center gap-1.5 px-2.5 py-1.5 border-2 cursor-pointer text-xs font-bold transition-colors min-h-[36px] ${
                  newPerm.roles.includes(r.value) ? "border-coco-accent bg-coco-accent/10 text-coco-dark" : "border-coco-dark/10 text-coco-coffee/60"
                }`}>
                  <input type="checkbox" checked={newPerm.roles.includes(r.value)} onChange={() => {
                    setNewPerm({ ...newPerm, roles: newPerm.roles.includes(r.value) ? newPerm.roles.filter((x) => x !== r.value) : [...newPerm.roles, r.value] });
                  }} className="w-3.5 h-3.5 accent-coco-accent" />
                  {r.label}
                </label>
              ))}
            </div>
          </div>
          <button onClick={handleAddPerm} disabled={!newPerm.key || !newPerm.label} className="btn-primary text-xs disabled:opacity-50 min-h-[40px]">Create Permission</button>
        </div>
      )}

      {/* Permission Groups */}
      {Array.from(groups.entries()).map(([groupName, perms]) => (
        <div key={groupName} className={`card overflow-hidden border-l-4 ${GROUP_COLORS[groupName] || "border-coco-accent"}`}>
          {/* Group Header */}
          <div className="px-4 sm:px-5 py-3 border-b-2 border-coco-dark/5 bg-coco-warm/30 flex items-center gap-2">
            <svg className="w-4 h-4 text-coco-coffee/60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d={GROUP_ICONS[groupName] || GROUP_ICONS.Pages} />
            </svg>
            <h3 className="text-xs sm:text-sm font-black text-coco-dark uppercase tracking-wider">{groupName}</h3>
            <span className="text-[10px] text-coco-coffee/40 ml-1">{perms.length} permission{perms.length !== 1 ? "s" : ""}</span>
          </div>

          {/* Permission Matrix */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-coco-dark/5">
                  <th className="text-left px-4 py-2.5 text-[10px] sm:text-xs font-bold text-coco-coffee/60 uppercase tracking-wider w-48">Permission</th>
                  {ALL_ROLES.map((r) => (
                    <th key={r.value} className="text-center px-1 py-2.5 w-16">
                      <div className="flex flex-col items-center gap-0.5">
                        <div className={`w-3 h-3 rounded-sm ${r.color}`} />
                        <span className="text-[8px] sm:text-[9px] font-bold text-coco-coffee/50 uppercase">{r.label.slice(0, 5)}</span>
                      </div>
                    </th>
                  ))}
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {perms.map((perm) => (
                  <tr key={perm.permission_key} className="border-b border-coco-dark/5 hover:bg-coco-warm/20 transition-colors">
                    <td className="px-4 py-2">
                      <p className="text-xs sm:text-sm font-medium text-coco-dark">{perm.permission_label}</p>
                      {perm.description && (
                        <p className="text-[9px] sm:text-[10px] text-coco-coffee/40">{perm.description}</p>
                      )}
                    </td>
                    {ALL_ROLES.map((r) => {
                      const isAllowed = (perm.allowed_roles || []).includes(r.value);
                      const isOwner = r.value === "owner";
                      const isSaving = saving === perm.permission_key;
                      return (
                        <td key={r.value} className="text-center px-1 py-2">
                          <button
                            onClick={() => toggleRole(perm.permission_key, r.value)}
                            disabled={isOwner || isSaving}
                            className={`w-8 h-8 sm:w-9 sm:h-9 mx-auto flex items-center justify-center border-2 rounded-sm transition-all ${
                              isAllowed
                                ? `${r.color} border-transparent text-white`
                                : "bg-white border-coco-dark/10 text-transparent hover:border-coco-dark/20"
                            } ${isOwner ? "opacity-60 cursor-not-allowed" : "cursor-pointer"} ${isSaving ? "animate-pulse" : ""}`}
                          >
                            {isAllowed && (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        </td>
                      );
                    })}
                    <td className="px-2 py-2">
                      <button onClick={() => handleDeletePerm(perm.permission_key)} className="text-red-400 hover:text-red-600 text-[10px] font-bold min-h-[36px] min-w-[36px] flex items-center justify-center">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
