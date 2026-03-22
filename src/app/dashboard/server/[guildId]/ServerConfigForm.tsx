"use client";

import { useState, useEffect } from "react";

interface ServerConfigFormProps {
  guildId: string;
  textChannels: { id: string; name: string }[];
  roles: { id: string; name: string; color: number }[];
}

const SITE_ROLES = [
  { key: "verifiedRoleId", label: "Verified", desc: "Auto-assigned when a user links their accounts" },
  { key: "contractorRoleId", label: "Contractor", desc: "Assigned to contractors" },
  { key: "moderatorRoleId", label: "Moderator", desc: "Assigned to moderators" },
  { key: "coordinatorRoleId", label: "Coordinator", desc: "Assigned to coordinators" },
  { key: "developerRoleId", label: "Developer", desc: "Assigned to developers" },
  { key: "adminRoleId", label: "Admin", desc: "Assigned to admins" },
  { key: "executiveRoleId", label: "Executive", desc: "Assigned to executives" },
  { key: "ownerRoleId", label: "Owner", desc: "Assigned to the studio owner" },
];

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
  const [roleMappings, setRoleMappings] = useState<Record<string, string>>({});
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
          setWelcomeMessage(data.welcomeMessage || "Welcome to the server, {user}!");
          setAutoRoles(data.autoRoles || []);
        }
        if (data.announcementChannel) setAnnouncementChannel(data.announcementChannel);

        // Load all role mappings
        const mappings: Record<string, string> = {};
        for (const r of SITE_ROLES) {
          if (data[r.key]) mappings[r.key] = data[r.key];
        }
        setRoleMappings(mappings);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [guildId]);

  const toggleRole = (roleId: string) => {
    setAutoRoles((prev) =>
      prev.includes(roleId) ? prev.filter((r) => r !== roleId) : [...prev, roleId]
    );
    setSaved(false);
  };

  const setRoleMapping = (key: string, value: string) => {
    setRoleMappings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      const body: Record<string, unknown> = {
        welcomeEnabled,
        welcomeChannel,
        welcomeMessage,
        autoRoles,
        announcementChannel: announcementChannel || null,
      };

      // Add all role mappings
      for (const r of SITE_ROLES) {
        body[r.key] = roleMappings[r.key] || null;
      }

      const res = await fetch(`/api/guild-config/${guildId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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

  return (
    <div className="space-y-6">
      {/* Role Mappings - All Roles */}
      <div className="card p-4 sm:p-6">
        <h2 className="text-sm font-bold text-coco-accent uppercase tracking-widest mb-2">
          Role Mappings
        </h2>
        <p className="text-xs text-coco-coffee/60 mb-5">
          Map each site role to a Discord role. When a user&apos;s role changes on the site, their Discord roles update automatically.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SITE_ROLES.map((r) => (
            <div key={r.key}>
              <label className="block text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1">
                {r.label}
              </label>
              <p className="text-[10px] text-coco-coffee/50 mb-1.5">{r.desc}</p>
              <select
                value={roleMappings[r.key] || ""}
                onChange={(e) => setRoleMapping(r.key, e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-coco-dark text-sm focus:outline-none focus:border-coco-accent transition-colors min-h-[40px]"
              >
                <option value="">None</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Announcement Channel */}
      <div className="card p-4 sm:p-6">
        <h2 className="text-sm font-bold text-coco-accent uppercase tracking-widest mb-5">
          Announcements
        </h2>
        <div>
          <label className="block text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1">
            Announcement Channel
          </label>
          <p className="text-[10px] text-coco-coffee/50 mb-1.5">Channel where announcements will be sent</p>
          <select
            value={announcementChannel}
            onChange={(e) => { setAnnouncementChannel(e.target.value); setSaved(false); }}
            className="w-full px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-coco-dark text-sm focus:outline-none focus:border-coco-accent transition-colors min-h-[40px]"
          >
            <option value="">None</option>
            {textChannels.map((ch) => (
              <option key={ch.id} value={ch.id}># {ch.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Welcome Message Config */}
      <div className="card p-4 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold text-coco-accent uppercase tracking-widest">
            Welcome Message
          </h2>
          <button
            onClick={() => { setWelcomeEnabled(!welcomeEnabled); setSaved(false); }}
            className={`relative w-12 h-6 transition-colors border-2 ${
              welcomeEnabled ? "bg-green-500 border-green-600" : "bg-gray-200 border-gray-300"
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white transition-transform ${welcomeEnabled ? "translate-x-6" : ""}`} />
          </button>
        </div>

        {welcomeEnabled && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1.5">Channel</label>
              <select
                value={welcomeChannel}
                onChange={(e) => { setWelcomeChannel(e.target.value); setSaved(false); }}
                className="w-full px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-coco-dark text-sm focus:outline-none focus:border-coco-accent transition-colors min-h-[40px]"
              >
                <option value="">Select a channel...</option>
                {textChannels.map((ch) => (
                  <option key={ch.id} value={ch.id}># {ch.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1.5">Message</label>
              <textarea
                value={welcomeMessage}
                onChange={(e) => { setWelcomeMessage(e.target.value); setSaved(false); }}
                rows={3}
                className="w-full px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-coco-dark text-sm focus:outline-none focus:border-coco-accent resize-none transition-colors"
                placeholder="Use {user} to mention the new member"
              />
              <p className="text-xs text-coco-coffee/60 mt-1 font-medium">Use {"{user}"} to mention the new member.</p>
            </div>
          </div>
        )}
      </div>

      {/* Auto-Role Config */}
      <div className="card p-4 sm:p-6">
        <h2 className="text-sm font-bold text-coco-accent uppercase tracking-widest mb-2">
          Auto-Assign Roles on Join
        </h2>
        <p className="text-xs text-coco-coffee/60 mb-5">
          These Discord roles are assigned to every new member automatically.
        </p>
        <div className="flex flex-wrap gap-2">
          {roles.map((role) => {
            const isSelected = autoRoles.includes(role.id);
            const roleColor = role.color !== 0 ? `#${role.color.toString(16).padStart(6, "0")}` : undefined;
            return (
              <button
                key={role.id}
                onClick={() => toggleRole(role.id)}
                className={`px-3 py-1.5 text-sm font-medium border-2 transition-all min-h-[40px] ${
                  isSelected
                    ? "bg-coco-dark text-coco-gold border-coco-dark"
                    : "bg-white text-coco-dark border-coco-dark/15 hover:border-coco-accent"
                }`}
                style={roleColor && !isSelected ? { borderColor: roleColor, color: roleColor } : undefined}
              >
                {role.name}
              </button>
            );
          })}
          {roles.length === 0 && (
            <p className="text-sm text-coco-coffee/50 font-medium">No assignable roles found.</p>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button onClick={handleSave} className="btn-primary min-h-[44px]">
          Save Configuration
        </button>
        {saved && (
          <span className="text-green-700 text-sm font-bold">Saved!</span>
        )}
      </div>
    </div>
  );
}
