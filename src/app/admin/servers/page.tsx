"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Guild {
  id: string;
  name: string;
  icon: string | null;
}

interface GuildConfig {
  guild_id: string;
  welcome_enabled: boolean;
  announcement_channel: string | null;
}

export default function AdminServersPage() {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [configs, setConfigs] = useState<Map<string, GuildConfig>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [guildsRes, configsRes] = await Promise.all([
          fetch("/api/admin/guilds"),
          fetch("/api/admin/guilds/configs"),
        ]);
        if (guildsRes.ok) setGuilds(await guildsRes.json());
        if (configsRes.ok) {
          const data: GuildConfig[] = await configsRes.json();
          const map = new Map<string, GuildConfig>();
          data.forEach((c) => map.set(c.guild_id, c));
          setConfigs(map);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const getGuildIcon = (guild: Guild) => {
    if (guild.icon) {
      return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=64`;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-coco-dark">Server Management</h2>
          <p className="text-sm text-coco-coffee/60 mt-1">
            {guilds.length} connected server{guilds.length !== 1 ? "s" : ""}
          </p>
        </div>
        <a
          href={`https://discord.com/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || ""}&scope=bot%20applications.commands&permissions=268504064`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-discord text-sm inline-flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="square" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add to Server
        </a>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-5 animate-pulse h-32" />
          ))}
        </div>
      ) : guilds.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-coco-coffee font-medium">No servers connected yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {guilds.map((guild) => {
            const icon = getGuildIcon(guild);
            const config = configs.get(guild.id);
            return (
              <Link
                key={guild.id}
                href={`/admin/servers/${guild.id}`}
                className="card-interactive block p-5"
              >
                <div className="flex items-center gap-4 mb-3">
                  {icon ? (
                    <img
                      src={icon}
                      alt={guild.name}
                      className="w-12 h-12 border-2 border-coco-dark/10"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-coco-dark flex items-center justify-center text-coco-gold text-xl font-black border-2 border-coco-dark/10">
                      {guild.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-bold text-coco-dark truncate">
                      {guild.name}
                    </h3>
                    <p className="font-mono text-[10px] text-coco-coffee/50">
                      {guild.id}
                    </p>
                  </div>
                </div>

                {/* Config status indicators */}
                <div className="flex flex-wrap gap-2">
                  {config ? (
                    <>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 border ${
                          config.welcome_enabled
                            ? "bg-green-100 text-green-700 border-green-300"
                            : "bg-gray-100 text-gray-500 border-gray-300"
                        }`}
                      >
                        WELCOME {config.welcome_enabled ? "ON" : "OFF"}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 border ${
                          config.announcement_channel
                            ? "bg-blue-100 text-blue-700 border-blue-300"
                            : "bg-gray-100 text-gray-500 border-gray-300"
                        }`}
                      >
                        ANNOUNCE {config.announcement_channel ? "ON" : "OFF"}
                      </span>
                    </>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 border bg-yellow-100 text-yellow-700 border-yellow-300">
                      NOT CONFIGURED
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
