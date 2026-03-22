"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const ROLES = [
  { value: "owner", label: "Owner" },
  { value: "executive", label: "Executive" },
  { value: "admin", label: "Admin" },
  { value: "developer", label: "Developer" },
  { value: "coordinator", label: "Coordinator" },
  { value: "mod", label: "Moderator" },
  { value: "contractor", label: "Contractor" },
  { value: "user", label: "User" },
];

export default function ViewAsRole() {
  const { data: session } = useSession();
  const router = useRouter();
  const [viewAs, setViewAs] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  // Only the actual owner (by Discord ID) can use this
  const isRealOwner = session?.user?.discordId === process.env.NEXT_PUBLIC_OWNER_DISCORD_ID;

  useEffect(() => {
    // Read cookie
    const match = document.cookie.match(/view_as_role=([^;]+)/);
    if (match) setViewAs(match[1]);
  }, []);

  if (!isRealOwner) return null;

  const handleSet = async (role: string) => {
    await fetch("/api/view-as", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setViewAs(role);
    setOpen(false);
    router.refresh();
    window.location.reload();
  };

  const handleClear = async () => {
    await fetch("/api/view-as", { method: "DELETE" });
    setViewAs(null);
    setOpen(false);
    router.refresh();
    window.location.reload();
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 z-[60] w-10 h-10 sm:w-12 sm:h-12 bg-coco-accent text-white rounded-full shadow-lg flex items-center justify-center hover:bg-coco-ember transition-colors"
        title="View as Role"
      >
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="fixed bottom-16 sm:bottom-20 right-4 z-[60] bg-[#1e1e2e] border-2 border-[#2a2a3d] shadow-xl w-56 p-3 space-y-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">View Site As</p>
          {ROLES.map((r) => (
            <button
              key={r.value}
              onClick={() => handleSet(r.value)}
              className={`w-full text-left px-3 py-2 text-xs font-medium min-h-[36px] transition-colors ${
                viewAs === r.value
                  ? "bg-coco-accent/20 text-coco-accent"
                  : "text-gray-300 hover:bg-[#2f2f45]"
              }`}
            >
              {r.label}
              {viewAs === r.value && " (active)"}
            </button>
          ))}
          {viewAs && (
            <button
              onClick={handleClear}
              className="w-full text-left px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 min-h-[36px] mt-1 border-t border-[#2a2a3d] pt-2"
            >
              Clear — Back to Owner
            </button>
          )}
        </div>
      )}

      {/* Active banner */}
      {viewAs && (
        <div className="fixed top-0 left-0 right-0 z-[55] bg-yellow-500 text-black text-center py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
          Viewing as: {ROLES.find((r) => r.value === viewAs)?.label || viewAs} —{" "}
          <button onClick={handleClear} className="underline hover:no-underline">
            Exit
          </button>
        </div>
      )}
    </>
  );
}
