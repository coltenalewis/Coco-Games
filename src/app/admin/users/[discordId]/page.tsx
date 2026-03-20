"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface UserDetail {
  discord_id: string;
  discord_username: string;
  discord_avatar: string | null;
  roblox_id: string | null;
  roblox_username: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

interface DisciplineEntry {
  id: string;
  action_type: string;
  reason: string | null;
  guild_id: string | null;
  guild_name: string | null;
  moderator_discord_id: string | null;
  moderator_username: string | null;
  created_at: string;
}

const actionLabels: Record<string, { text: string; color: string }> = {
  ban: { text: "BAN", color: "bg-red-100 text-red-700 border-red-300" },
  unban: { text: "UNBAN", color: "bg-green-100 text-green-700 border-green-300" },
  kick: { text: "KICK", color: "bg-orange-100 text-orange-700 border-orange-300" },
  warn: { text: "WARN", color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  note: { text: "NOTE", color: "bg-blue-100 text-blue-700 border-blue-300" },
};

const roleBadge: Record<string, string> = {
  owner: "bg-coco-ember text-white border-coco-ember",
  admin: "bg-red-100 text-red-700 border-red-300",
  mod: "bg-blue-100 text-blue-700 border-blue-300",
  user: "bg-gray-100 text-gray-600 border-gray-300",
};

export default function UserDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const discordId = params.discordId as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [discipline, setDiscipline] = useState<DisciplineEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Add note form
  const [noteType, setNoteType] = useState("note");
  const [noteReason, setNoteReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [userRes, discRes] = await Promise.all([
        fetch(`/api/admin/users/${discordId}`),
        fetch(`/api/admin/users/${discordId}/discipline`),
      ]);
      if (userRes.ok) setUser(await userRes.json());
      if (discRes.ok) setDiscipline(await discRes.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [discordId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteReason.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/admin/users/${discordId}/discipline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionType: noteType, reason: noteReason }),
      });

      if (res.ok) {
        setNoteReason("");
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add entry");
      }
    } catch {
      alert("Failed to add entry");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (newRole: string) => {
    if (!confirm(`Change this user's role to ${newRole.toUpperCase()}?`)) return;

    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discordId, role: newRole }),
    });

    if (res.ok) {
      fetchData();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to update role");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="card p-6 animate-pulse h-40" />
        <div className="card p-6 animate-pulse h-60" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="card p-8 text-center">
        <p className="text-coco-coffee font-medium">User not found.</p>
        <Link href="/admin/users" className="text-coco-accent text-sm mt-2 inline-block">
          Back to Users
        </Link>
      </div>
    );
  }

  const avatarUrl = user.discord_avatar
    ? `https://cdn.discordapp.com/avatars/${user.discord_id}/${user.discord_avatar}.png?size=128`
    : `https://cdn.discordapp.com/embed/avatars/${
        (BigInt(user.discord_id) >> BigInt(22)) % BigInt(6)
      }.png`;

  const isOwner = session?.user?.role === "owner";
  const isSelf = session?.user?.discordId === user.discord_id;

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/admin/users"
        className="text-coco-accent hover:text-coco-ember text-sm font-bold uppercase tracking-wider"
      >
        &larr; All Users
      </Link>

      {/* User Profile Card */}
      <div className="card p-6">
        <div className="flex items-start gap-5">
          <img
            src={avatarUrl}
            alt={user.discord_username}
            className="w-20 h-20 border-2 border-coco-dark/10"
          />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-black text-coco-dark">
                {user.discord_username}
              </h2>
              <span
                className={`text-xs font-bold px-2 py-0.5 border ${
                  roleBadge[user.role] || roleBadge.user
                }`}
              >
                {user.role.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div>
                <span className="text-coco-coffee/60">Discord ID:</span>{" "}
                <span className="font-mono text-coco-dark">{user.discord_id}</span>
              </div>
              <div>
                <span className="text-coco-coffee/60">Roblox:</span>{" "}
                {user.roblox_username ? (
                  <span className="text-green-700 font-medium">
                    {user.roblox_username} ({user.roblox_id})
                  </span>
                ) : (
                  <span className="text-coco-coffee/40">Not linked</span>
                )}
              </div>
              <div>
                <span className="text-coco-coffee/60">Joined:</span>{" "}
                {new Date(user.created_at).toLocaleDateString()}
              </div>
              <div>
                <span className="text-coco-coffee/60">Last Updated:</span>{" "}
                {new Date(user.updated_at).toLocaleDateString()}
              </div>
            </div>

            {/* Role Changer */}
            {isOwner && !isSelf && (
              <div className="mt-4 pt-4 border-t border-coco-dark/10">
                <label className="text-xs font-bold text-coco-accent uppercase tracking-wider block mb-2">
                  Change Role
                </label>
                <div className="flex gap-2">
                  {["user", "mod", "admin", "owner"].map((r) => (
                    <button
                      key={r}
                      onClick={() => handleRoleChange(r)}
                      disabled={r === user.role}
                      className={`px-3 py-1.5 text-xs font-bold border-2 transition-all ${
                        r === user.role
                          ? "bg-coco-dark text-coco-gold border-coco-dark"
                          : "bg-white text-coco-dark border-coco-dark/15 hover:border-coco-accent"
                      }`}
                    >
                      {r.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Warning/Note Form */}
      <div className="card p-6">
        <h3 className="text-sm font-bold text-coco-accent uppercase tracking-widest mb-4">
          Add Discipline Entry
        </h3>
        <form onSubmit={handleAddNote} className="space-y-3">
          <div className="flex gap-3">
            <select
              value={noteType}
              onChange={(e) => setNoteType(e.target.value)}
              className="px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-coco-dark text-sm focus:outline-none focus:border-coco-accent"
            >
              <option value="note">Note</option>
              <option value="warn">Warning</option>
              <option value="ban">Ban</option>
              <option value="kick">Kick</option>
            </select>
            <input
              type="text"
              value={noteReason}
              onChange={(e) => setNoteReason(e.target.value)}
              placeholder="Reason or note content..."
              className="flex-1 px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-coco-dark text-sm focus:outline-none focus:border-coco-accent"
              required
            />
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {submitting ? "Adding..." : "Add"}
            </button>
          </div>
        </form>
      </div>

      {/* Discipline History */}
      <div className="card p-6">
        <h3 className="text-sm font-bold text-coco-accent uppercase tracking-widest mb-4">
          Discipline History ({discipline.length})
        </h3>
        {discipline.length === 0 ? (
          <p className="text-sm text-coco-coffee/60">
            No discipline records for this user.
          </p>
        ) : (
          <div className="space-y-2">
            {discipline.map((entry) => {
              const label =
                actionLabels[entry.action_type] || actionLabels.note;
              return (
                <div
                  key={entry.id}
                  className="p-3 bg-coco-light/50 border border-coco-dark/5"
                >
                  <div className="flex items-center gap-3 mb-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 border ${label.color}`}
                    >
                      {label.text}
                    </span>
                    {entry.guild_name && (
                      <span className="text-xs text-coco-coffee/60">
                        in {entry.guild_name}
                      </span>
                    )}
                    <span className="ml-auto text-xs text-coco-coffee/50">
                      {new Date(entry.created_at).toLocaleString()}
                    </span>
                  </div>
                  {entry.reason && (
                    <p className="text-sm text-coco-dark">{entry.reason}</p>
                  )}
                  {entry.moderator_username && (
                    <p className="text-xs text-coco-coffee/50 mt-1">
                      By: {entry.moderator_username}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
