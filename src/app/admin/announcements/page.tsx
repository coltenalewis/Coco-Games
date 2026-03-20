"use client";

import { useState, useEffect, useCallback } from "react";

interface Guild {
  id: string;
  name: string;
  icon: string | null;
}

interface Announcement {
  id: string;
  author_discord_id: string;
  content: string;
  guild_ids: string[];
  sent_at: string;
}

export default function AnnouncementsPage() {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [selectedGuilds, setSelectedGuilds] = useState<string[]>([]);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{
    sent: number;
    failed: number;
  } | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sendError, setSendError] = useState("");
  const [guildConfigs, setGuildConfigs] = useState<
    { guild_id: string; announcement_channel: string | null }[]
  >([]);

  // Fetch bot guilds and their configs
  useEffect(() => {
    async function loadGuilds() {
      try {
        const [guildsRes, configsRes] = await Promise.all([
          fetch("/api/admin/guilds"),
          fetch("/api/admin/guilds/configs"),
        ]);
        if (guildsRes.ok) {
          const data = await guildsRes.json();
          setGuilds(data);
        }
        if (configsRes.ok) {
          const data = await configsRes.json();
          setGuildConfigs(data);
        }
      } catch {
        // ignore
      }
    }
    loadGuilds();
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/admin/announcements");
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.announcements || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const toggleGuild = (guildId: string) => {
    setSelectedGuilds((prev) =>
      prev.includes(guildId)
        ? prev.filter((id) => id !== guildId)
        : [...prev, guildId]
    );
  };

  const toggleAll = () => {
    if (selectedGuilds.length === guilds.length) {
      setSelectedGuilds([]);
    } else {
      setSelectedGuilds(guilds.map((g) => g.id));
    }
  };

  const handleSend = async () => {
    if (!content.trim() || selectedGuilds.length === 0) return;
    setSending(true);
    setResult(null);
    setSendError("");
    setShowConfirm(false);

    try {
      const guildIds =
        selectedGuilds.length === guilds.length
          ? ["all"]
          : selectedGuilds;

      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, guildIds }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult({ sent: data.sent, failed: data.failed });
        setContent("");
        setSelectedGuilds([]);
        fetchHistory();
      } else {
        setSendError(data.error || "Failed to send announcement");
      }
    } catch {
      setSendError("Network error — failed to send announcement");
    } finally {
      setSending(false);
    }
  };

  const getGuildIcon = (guild: Guild) => {
    if (guild.icon) {
      return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=64`;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-black text-coco-dark">Announcements</h2>

      {/* Compose */}
      <div className="card p-6 space-y-4">
        <h3 className="text-sm font-bold text-coco-accent uppercase tracking-widest">
          Compose Announcement
        </h3>

        {/* Content */}
        <div>
          <label className="block text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1.5">
            Message
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            placeholder="Write your announcement... This will be sent with @everyone."
            className="w-full px-4 py-2.5 border-2 border-coco-dark/10 bg-white text-coco-dark text-sm focus:outline-none focus:border-coco-accent resize-none transition-colors"
          />
          <p className="text-xs text-coco-coffee/50 mt-1">
            {content.length} characters &middot; Sent as @everyone via webhook
          </p>
        </div>

        {/* Server Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-coco-coffee uppercase tracking-wider">
              Target Servers
            </label>
            <button
              onClick={toggleAll}
              className="text-xs text-coco-accent hover:text-coco-ember font-bold"
            >
              {selectedGuilds.length === guilds.length
                ? "Deselect All"
                : "Select All"}
            </button>
          </div>
          {guilds.length === 0 ? (
            <p className="text-sm text-coco-coffee/50">
              Loading servers...
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {guilds.map((guild) => {
                const isSelected = selectedGuilds.includes(guild.id);
                const icon = getGuildIcon(guild);
                const hasChannel = guildConfigs.some(
                  (c) => c.guild_id === guild.id && c.announcement_channel
                );
                return (
                  <button
                    key={guild.id}
                    onClick={() => toggleGuild(guild.id)}
                    title={
                      hasChannel
                        ? "Announcement channel configured"
                        : "No announcement channel set — configure in Admin > Servers"
                    }
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-2 transition-all ${
                      isSelected
                        ? "bg-coco-dark text-coco-gold border-coco-dark shadow-coco-sharp-sm"
                        : hasChannel
                        ? "bg-white text-coco-dark border-coco-dark/15 hover:border-coco-accent"
                        : "bg-red-50 text-red-400 border-red-200 hover:border-red-300"
                    }`}
                  >
                    {icon && (
                      <img
                        src={icon}
                        alt=""
                        className="w-5 h-5 rounded-full"
                      />
                    )}
                    {guild.name}
                    {!hasChannel && (
                      <span className="text-[9px] font-bold text-red-500">
                        NO CHANNEL
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Preview */}
        {content.trim() && (
          <div>
            <label className="block text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1.5">
              Preview
            </label>
            <div className="p-4 bg-[#36393f] text-[#dcddde] text-sm rounded border border-[#202225]">
              <p className="text-[#7289da] font-medium mb-1">
                @everyone
              </p>
              <p className="whitespace-pre-wrap">{content}</p>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div
            className={`p-3 border-2 text-sm font-medium ${
              result.failed > 0
                ? "bg-yellow-50 border-yellow-300 text-yellow-700"
                : "bg-green-50 border-green-300 text-green-700"
            }`}
          >
            Sent to {result.sent} server(s).
            {result.failed > 0 && ` Failed: ${result.failed} server(s).`}
          </div>
        )}

        {/* Error */}
        {sendError && (
          <div className="p-3 border-2 bg-red-50 border-red-300 text-red-700 text-sm font-medium">
            {sendError}
          </div>
        )}

        {/* Send */}
        {showConfirm ? (
          <div className="flex items-center gap-3 p-3 bg-red-50 border-2 border-red-300">
            <p className="text-sm text-red-700 font-medium flex-1">
              Send @everyone announcement to {selectedGuilds.length} server(s)?
            </p>
            <button
              onClick={handleSend}
              disabled={sending}
              className="px-4 py-2 bg-red-600 text-white text-sm font-bold border-2 border-red-700 hover:bg-red-700 transition-colors"
            >
              {sending ? "Sending..." : "Confirm Send"}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="px-4 py-2 text-sm font-bold border-2 border-coco-dark/10 hover:border-coco-accent"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirm(true)}
            disabled={!content.trim() || selectedGuilds.length === 0}
            className="btn-primary disabled:opacity-50"
          >
            Send Announcement
          </button>
        )}
      </div>

      {/* History */}
      <div className="card p-6">
        <h3 className="text-sm font-bold text-coco-accent uppercase tracking-widest mb-4">
          Announcement History
        </h3>
        {loadingHistory ? (
          <p className="text-sm text-coco-coffee/50">Loading...</p>
        ) : announcements.length === 0 ? (
          <p className="text-sm text-coco-coffee/50">
            No announcements sent yet.
          </p>
        ) : (
          <div className="space-y-3">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="p-3 bg-coco-light/50 border border-coco-dark/5"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-coco-coffee/60">
                    Sent to {ann.guild_ids.length} server(s)
                  </span>
                  <span className="text-xs text-coco-coffee/50">
                    {new Date(ann.sent_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-coco-dark whitespace-pre-wrap">
                  {ann.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
