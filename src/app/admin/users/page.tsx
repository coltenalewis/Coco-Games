"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface UserResult {
  id: string;
  discord_id: string;
  discord_username: string;
  discord_avatar: string | null;
  roblox_id: string | null;
  roblox_username: string | null;
  role: string;
  created_at: string;
}

const roleBadge: Record<string, string> = {
  owner: "bg-coco-ember text-white border-coco-ember",
  executive: "bg-green-100 text-green-700 border-green-400",
  admin: "bg-red-100 text-red-700 border-red-300",
  mod: "bg-blue-100 text-blue-700 border-blue-300",
  user: "bg-gray-100 text-gray-600 border-gray-300",
};

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserResult[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async (q: string, p: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/users?q=${encodeURIComponent(q)}&page=${p}`
      );
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(query, page);
  }, [fetchUsers, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers(query, 1);
  };

  const handleRoleChange = async (discordId: string, newRole: string) => {
    if (
      !confirm(
        `Change this user's role to ${newRole.toUpperCase()}?`
      )
    )
      return;

    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discordId, role: newRole }),
    });

    if (res.ok) {
      fetchUsers(query, page);
    } else {
      const data = await res.json();
      alert(data.error || "Failed to update role");
    }
  };

  const isOwner = session?.user?.role === "owner";

  const getAvatarUrl = (user: UserResult) => {
    if (user.discord_avatar) {
      return `https://cdn.discordapp.com/avatars/${user.discord_id}/${user.discord_avatar}.png?size=64`;
    }
    const defaultIndex =
      (BigInt(user.discord_id) >> BigInt(22)) % BigInt(6);
    return `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-coco-dark">User Management</h2>
          <p className="text-sm text-coco-coffee/60 mt-1">
            {total} total users
          </p>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username or Discord ID..."
          className="flex-1 px-4 py-2.5 border-2 border-coco-dark/10 bg-white text-coco-dark text-sm focus:outline-none focus:border-coco-accent transition-colors"
        />
        <button type="submit" className="btn-primary text-sm">
          Search
        </button>
      </form>

      {/* Users Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-coco-coffee/60">Loading...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-coco-coffee/60">
            No users found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-coco-dark/10 bg-coco-warm/50">
                  <th className="text-left px-4 py-3 text-xs font-bold text-coco-accent uppercase tracking-wider">
                    User
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-coco-accent uppercase tracking-wider">
                    Discord ID
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-coco-accent uppercase tracking-wider">
                    Roblox
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-coco-accent uppercase tracking-wider">
                    Role
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-coco-accent uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-coco-dark/5 hover:bg-coco-warm/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={getAvatarUrl(user)}
                          alt=""
                          className="w-8 h-8 border border-coco-dark/10"
                        />
                        <span className="font-medium text-coco-dark">
                          {user.discord_username}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-coco-coffee/70">
                      {user.discord_id}
                    </td>
                    <td className="px-4 py-3">
                      {user.roblox_username ? (
                        <span className="text-green-700 font-medium">
                          {user.roblox_username}
                        </span>
                      ) : (
                        <span className="text-coco-coffee/40">Not linked</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isOwner &&
                      user.discord_id !== session?.user?.discordId ? (
                        <select
                          value={user.role}
                          onChange={(e) =>
                            handleRoleChange(user.discord_id, e.target.value)
                          }
                          className={`text-xs font-bold px-2 py-1 border ${
                            roleBadge[user.role] || roleBadge.user
                          } cursor-pointer`}
                        >
                          <option value="user">USER</option>
                          <option value="mod">MOD</option>
                          <option value="admin">ADMIN</option>
                          <option value="executive">EXECUTIVE</option>
                          <option value="owner">OWNER</option>
                        </select>
                      ) : (
                        <span
                          className={`text-xs font-bold px-2 py-1 border ${
                            roleBadge[user.role] || roleBadge.user
                          }`}
                        >
                          {user.role.toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-coco-coffee/60">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/users/${user.discord_id}`}
                        className="text-coco-accent hover:text-coco-ember text-xs font-bold uppercase tracking-wider"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 text-sm font-bold border-2 border-coco-dark/10 disabled:opacity-30 hover:border-coco-accent transition-colors"
          >
            Prev
          </button>
          <span className="text-sm text-coco-coffee px-3">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-sm font-bold border-2 border-coco-dark/10 disabled:opacity-30 hover:border-coco-accent transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
