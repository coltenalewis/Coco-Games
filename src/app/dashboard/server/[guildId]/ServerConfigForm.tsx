"use client";

import { useState, useEffect } from "react";

interface ServerConfigFormProps {
  guildId: string;
  textChannels: { id: string; name: string }[];
  roles: { id: string; name: string; color: number }[];
}

export default function ServerConfigForm({
  guildId,
  textChannels,
  roles,
}: ServerConfigFormProps) {
  const [welcomeEnabled, setWelcomeEnabled] = useState(false);
  const [welcomeChannel, setWelcomeChannel] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState(
    "Welcome to the server, {user}!"
  );
  const [autoRoles, setAutoRoles] = useState<string[]>([]);
  const [verifiedRoleId, setVerifiedRoleId] = useState("");
  const [moderatorRoleId, setModeratorRoleId] = useState("");
  const [adminRoleId, setAdminRoleId] = useState("");
  const [announcementChannel, setAnnouncementChannel] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/guild-config/${guildId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.welcomeEnabled !== undefined) {
          setWelcomeEnabled(data.welcomeEnabled);
          setWelcomeChannel(data.welcomeChannel || "");
          setWelcomeMessage(
            data.welcomeMessage || "Welcome to the server, {user}!"
          );
          setAutoRoles(data.autoRoles || []);
        }
        if (data.verifiedRoleId) setVerifiedRoleId(data.verifiedRoleId);
        if (data.moderatorRoleId) setModeratorRoleId(data.moderatorRoleId);
        if (data.adminRoleId) setAdminRoleId(data.adminRoleId);
        if (data.announcementChannel)
          setAnnouncementChannel(data.announcementChannel);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [guildId]);

  const toggleRole = (roleId: string) => {
    setAutoRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((r) => r !== roleId)
        : [...prev, roleId]
    );
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/guild-config/${guildId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          welcomeEnabled,
          welcomeChannel,
          welcomeMessage,
          autoRoles,
          verifiedRoleId: verifiedRoleId || null,
          moderatorRoleId: moderatorRoleId || null,
          adminRoleId: adminRoleId || null,
          announcementChannel: announcementChannel || null,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      alert("Failed to save configuration");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card p-6 animate-pulse h-32" />
        <div className="card p-6 animate-pulse h-32" />
      </div>
    );
  }

  const roleSelect = (
    label: string,
    description: string,
    value: string,
    onChange: (v: string) => void
  ) => (
    <div>
      <label className="block text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1">
        {label}
      </label>
      <p className="text-xs text-coco-coffee/60 mb-1.5">{description}</p>
      <select
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setSaved(false);
        }}
        className="w-full px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-coco-dark text-sm focus:outline-none focus:border-coco-accent transition-colors"
      >
        <option value="">None</option>
        {roles.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>
    </div>
  );

  const channelSelect = (
    label: string,
    description: string,
    value: string,
    onChange: (v: string) => void
  ) => (
    <div>
      <label className="block text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1">
        {label}
      </label>
      <p className="text-xs text-coco-coffee/60 mb-1.5">{description}</p>
      <select
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setSaved(false);
        }}
        className="w-full px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-coco-dark text-sm focus:outline-none focus:border-coco-accent transition-colors"
      >
        <option value="">None</option>
        {textChannels.map((ch) => (
          <option key={ch.id} value={ch.id}>
            # {ch.name}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Role Mappings */}
      <div className="card p-6">
        <h2 className="text-sm font-bold text-coco-accent uppercase tracking-widest mb-5">
          Role Mappings
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {roleSelect(
            "Verified",
            "Auto-assigned when a user connects their account",
            verifiedRoleId,
            setVerifiedRoleId
          )}
          {roleSelect(
            "Moderator",
            "Identifies moderators on the platform",
            moderatorRoleId,
            setModeratorRoleId
          )}
          {roleSelect(
            "Administrator",
            "Identifies administrators on the platform",
            adminRoleId,
            setAdminRoleId
          )}
        </div>
      </div>

      {/* Announcement Channel */}
      <div className="card p-6">
        <h2 className="text-sm font-bold text-coco-accent uppercase tracking-widest mb-5">
          Announcements
        </h2>
        {channelSelect(
          "Announcement Channel",
          "Channel where @everyone announcements will be sent via webhook",
          announcementChannel,
          setAnnouncementChannel
        )}
      </div>

      {/* Welcome Message Config */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold text-coco-accent uppercase tracking-widest">
            Welcome Message
          </h2>
          <button
            onClick={() => {
              setWelcomeEnabled(!welcomeEnabled);
              setSaved(false);
            }}
            className={`relative w-12 h-6 transition-colors border-2 ${
              welcomeEnabled
                ? "bg-green-500 border-green-600"
                : "bg-gray-200 border-gray-300"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white transition-transform ${
                welcomeEnabled ? "translate-x-6" : ""
              }`}
            />
          </button>
        </div>

        {welcomeEnabled && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1.5">
                Channel
              </label>
              <select
                value={welcomeChannel}
                onChange={(e) => {
                  setWelcomeChannel(e.target.value);
                  setSaved(false);
                }}
                className="w-full px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-coco-dark text-sm focus:outline-none focus:border-coco-accent transition-colors"
              >
                <option value="">Select a channel...</option>
                {textChannels.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    # {ch.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1.5">
                Message
              </label>
              <textarea
                value={welcomeMessage}
                onChange={(e) => {
                  setWelcomeMessage(e.target.value);
                  setSaved(false);
                }}
                rows={3}
                className="w-full px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-coco-dark text-sm focus:outline-none focus:border-coco-accent resize-none transition-colors"
                placeholder="Use {user} to mention the new member"
              />
              <p className="text-xs text-coco-coffee/60 mt-1 font-medium">
                Use {"{user}"} to mention the new member.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Auto-Role Config */}
      <div className="card p-6">
        <h2 className="text-sm font-bold text-coco-accent uppercase tracking-widest mb-2">
          Auto-Assign Roles on Join
        </h2>
        <p className="text-sm text-coco-coffee mb-5">
          These roles are assigned to every new member (separate from Verified).
        </p>
        <div className="flex flex-wrap gap-2">
          {roles.map((role) => {
            const isSelected = autoRoles.includes(role.id);
            const roleColor =
              role.color !== 0
                ? `#${role.color.toString(16).padStart(6, "0")}`
                : undefined;
            return (
              <button
                key={role.id}
                onClick={() => toggleRole(role.id)}
                className={`px-3 py-1.5 text-sm font-medium border-2 transition-all ${
                  isSelected
                    ? "bg-coco-dark text-coco-gold border-coco-dark shadow-coco-sharp-sm translate-x-0 translate-y-0"
                    : "bg-white text-coco-dark border-coco-dark/15 hover:border-coco-accent"
                }`}
                style={
                  roleColor && !isSelected
                    ? { borderColor: roleColor, color: roleColor }
                    : undefined
                }
              >
                {role.name}
              </button>
            );
          })}
          {roles.length === 0 && (
            <p className="text-sm text-coco-coffee/50 font-medium">
              No assignable roles found.
            </p>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button onClick={handleSave} className="btn-primary">
          Save Configuration
        </button>
        {saved && (
          <span className="text-green-700 text-sm font-bold">Saved!</span>
        )}
      </div>
    </div>
  );
}
