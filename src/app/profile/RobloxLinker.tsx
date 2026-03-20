"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface RobloxLinkerProps {
  currentRobloxId: string | null;
  currentRobloxUsername: string | null;
}

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: "You cancelled the Roblox login.",
  invalid_state: "Session expired. Please try again.",
  missing_params: "Something went wrong. Please try again.",
  token_failed: "Failed to connect to Roblox. Please try again.",
  userinfo_failed: "Could not fetch your Roblox account info.",
  already_linked: "This Roblox account is already linked to another user.",
  db_failed: "Failed to save. Please try again.",
};

export default function RobloxLinker({
  currentRobloxId,
  currentRobloxUsername,
}: RobloxLinkerProps) {
  const [unlinking, setUnlinking] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const robloxError = searchParams.get("roblox_error");
  const robloxLinked = searchParams.get("roblox_linked");
  const displayError = error || (robloxError ? ERROR_MESSAGES[robloxError] || "Something went wrong." : "");

  const handleUnlink = async () => {
    setUnlinking(true);
    try {
      await fetch("/api/link-roblox", { method: "DELETE" });
      router.refresh();
    } catch {
      setError("Failed to unlink account");
    } finally {
      setUnlinking(false);
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
            disabled={unlinking}
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
        <a
          href="/api/roblox/authorize"
          className="btn-primary text-xs !px-4 !py-2 inline-block"
        >
          Connect Roblox
        </a>
      </div>

      {displayError && (
        <p className="text-red-600 text-xs font-bold mt-3">{displayError}</p>
      )}

      {robloxLinked && (
        <p className="text-green-700 text-xs font-bold mt-3">
          Roblox account linked successfully!
        </p>
      )}
    </div>
  );
}
