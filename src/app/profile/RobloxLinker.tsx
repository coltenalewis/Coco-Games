"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface RobloxLinkerProps {
  currentRobloxId: string | null;
  currentRobloxUsername: string | null;
}

export default function RobloxLinker({
  currentRobloxId,
  currentRobloxUsername,
}: RobloxLinkerProps) {
  const [robloxId, setRobloxId] = useState("");
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState("");
  const [showInput, setShowInput] = useState(false);
  const router = useRouter();

  const handleLink = async () => {
    if (!robloxId.trim()) return;
    setLinking(true);
    setError("");

    try {
      const res = await fetch("/api/link-roblox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ robloxId: robloxId.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to link account");
        return;
      }

      // Refresh the page to show updated state
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async () => {
    setLinking(true);
    try {
      await fetch("/api/link-roblox", { method: "DELETE" });
      router.refresh();
    } catch {
      setError("Failed to unlink account");
    } finally {
      setLinking(false);
    }
  };

  // Already linked
  if (currentRobloxId) {
    return (
      <div className="flex items-center justify-between p-4 bg-coco-light border-2 border-coco-dark/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#E2231A] flex items-center justify-center">
            <span className="text-white font-black text-xs">R</span>
          </div>
          <div>
            <p className="font-bold text-coco-dark text-sm">Roblox</p>
            <p className="text-xs text-coco-coffee">
              {currentRobloxUsername || currentRobloxId}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-green-700 font-bold bg-green-100 border border-green-300 px-2.5 py-1">
            Connected
          </span>
          <button
            onClick={handleUnlink}
            disabled={linking}
            className="text-xs text-red-600 hover:text-red-800 font-bold px-2 py-1 border border-red-200 hover:border-red-400 transition-colors disabled:opacity-50"
          >
            Unlink
          </button>
        </div>
      </div>
    );
  }

  // Not linked
  return (
    <div className="p-4 bg-coco-light border-2 border-dashed border-coco-accent/40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#E2231A] flex items-center justify-center">
            <span className="text-white font-black text-xs">R</span>
          </div>
          <div>
            <p className="font-bold text-coco-dark text-sm">Roblox</p>
            <p className="text-xs text-coco-coffee">
              Link to get Verified
            </p>
          </div>
        </div>
        {!showInput && (
          <button
            onClick={() => setShowInput(true)}
            className="btn-primary text-xs !px-4 !py-2"
          >
            Link Account
          </button>
        )}
      </div>

      {showInput && (
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1.5">
              Your Roblox User ID
            </label>
            <p className="text-xs text-coco-coffee/60 mb-2">
              Find your ID at{" "}
              <a
                href="https://www.roblox.com/users/profile"
                target="_blank"
                rel="noopener noreferrer"
                className="text-coco-accent hover:underline"
              >
                roblox.com/users/profile
              </a>
              {" "}&mdash; it&apos;s the number in the URL.
            </p>
            <input
              type="text"
              value={robloxId}
              onChange={(e) => {
                setRobloxId(e.target.value.replace(/\D/g, ""));
                setError("");
              }}
              placeholder="e.g. 133970833"
              className="w-full px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-coco-dark text-sm focus:outline-none focus:border-coco-accent transition-colors font-mono"
            />
          </div>

          {error && (
            <p className="text-red-600 text-xs font-bold">{error}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleLink}
              disabled={linking || !robloxId.trim()}
              className="btn-primary text-xs !px-4 !py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {linking ? "Linking..." : "Verify & Link"}
            </button>
            <button
              onClick={() => {
                setShowInput(false);
                setError("");
                setRobloxId("");
              }}
              className="text-xs text-coco-coffee font-bold px-4 py-2 border-2 border-coco-dark/10 hover:border-coco-dark/20 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
