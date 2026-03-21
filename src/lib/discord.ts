const DISCORD_API = "https://discord.com/api/v10";
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN!;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID!;

interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
  member_count?: number;
}

interface DiscordChannel {
  id: string;
  name: string;
  type: number;
  position: number;
}

interface DiscordRole {
  id: string;
  name: string;
  color: number;
  position: number;
  permissions: string;
  managed: boolean;
}

interface DiscordWebhook {
  id: string;
  token: string;
  name: string;
  channel_id: string;
}

async function discordFetch<T>(endpoint: string, token?: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${DISCORD_API}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bot ${token || BOT_TOKEN}`,
      ...(options?.headers || {}),
    },
    next: options?.method ? undefined : { revalidate: 30 },
  });

  if (res.status === 429) {
    const retryAfter = res.headers.get("Retry-After");
    const ms = retryAfter ? parseFloat(retryAfter) * 1000 : 5000;
    await new Promise((r) => setTimeout(r, ms));
    return discordFetch<T>(endpoint, token, options);
  }

  if (!res.ok) {
    throw new Error(`Discord API error: ${res.status} ${res.statusText}`);
  }

  // Some endpoints return 204 No Content
  if (res.status === 204) return {} as T;

  return res.json();
}

export async function getBotGuilds(): Promise<DiscordGuild[]> {
  return discordFetch<DiscordGuild[]>("/users/@me/guilds");
}

export async function getGuildDetails(guildId: string) {
  return discordFetch<DiscordGuild & { description: string | null }>(
    `/guilds/${guildId}?with_counts=true`
  );
}

export async function getGuildChannels(
  guildId: string
): Promise<DiscordChannel[]> {
  return discordFetch<DiscordChannel[]>(`/guilds/${guildId}/channels`);
}

export async function getGuildRoles(guildId: string): Promise<DiscordRole[]> {
  return discordFetch<DiscordRole[]>(`/guilds/${guildId}/roles`);
}

export async function getUserGuilds(
  accessToken: string
): Promise<DiscordGuild[]> {
  const res = await fetch(`${DISCORD_API}/users/@me/guilds`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch user guilds");
  return res.json();
}

// Default permissions: Send Messages, Manage Roles, View Channels, Manage Channels, Manage Webhooks, View Audit Log
const DEFAULT_PERMISSIONS = 268504064;

export function generateBotInviteUrl(
  permissions: number = DEFAULT_PERMISSIONS
): string {
  return `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&scope=bot%20applications.commands&permissions=${permissions}`;
}

export async function addGuildMemberRole(
  guildId: string,
  userId: string,
  roleId: string
): Promise<boolean> {
  const res = await fetch(
    `${DISCORD_API}/guilds/${guildId}/members/${userId}/roles/${roleId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bot ${BOT_TOKEN}`,
      },
    }
  );
  return res.ok || res.status === 204;
}

export async function removeGuildMemberRole(
  guildId: string,
  userId: string,
  roleId: string
): Promise<boolean> {
  const res = await fetch(
    `${DISCORD_API}/guilds/${guildId}/members/${userId}/roles/${roleId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bot ${BOT_TOKEN}`,
      },
    }
  );
  return res.ok || res.status === 204;
}

export function getGuildIconUrl(
  guildId: string,
  iconHash: string | null
): string | null {
  if (!iconHash) return null;
  return `https://cdn.discordapp.com/icons/${guildId}/${iconHash}.png?size=128`;
}

// ============================================
// WEBHOOK HELPERS (for announcements)
// ============================================

export async function getChannelWebhooks(
  channelId: string
): Promise<DiscordWebhook[]> {
  return discordFetch<DiscordWebhook[]>(`/channels/${channelId}/webhooks`);
}

export async function createWebhook(
  channelId: string,
  name: string
): Promise<DiscordWebhook> {
  return discordFetch<DiscordWebhook>(`/channels/${channelId}/webhooks`, undefined, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export async function getOrCreateWebhook(
  channelId: string,
  name: string = "Coco Games Announcements"
): Promise<{ id: string; token: string }> {
  const webhooks = await getChannelWebhooks(channelId);
  const existing = webhooks.find((w) => w.name === name);

  if (existing) {
    return { id: existing.id, token: existing.token };
  }

  const created = await createWebhook(channelId, name);
  return { id: created.id, token: created.token };
}

export async function sendWebhookMessage(
  webhookId: string,
  webhookToken: string,
  content: string
): Promise<void> {
  const res = await fetch(
    `${DISCORD_API}/webhooks/${webhookId}/${webhookToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    }
  );

  if (!res.ok && res.status !== 204) {
    throw new Error(`Webhook send failed: ${res.status}`);
  }
}

// ============================================
// SEND DISCORD DM
// ============================================
export async function sendDiscordDM(
  recipientDiscordId: string,
  embed: Record<string, unknown>
): Promise<boolean> {
  try {
    const dmRes = await fetch(`${DISCORD_API}/users/@me/channels`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ recipient_id: recipientDiscordId }),
    });
    if (!dmRes.ok) return false;
    const dmChannel = await dmRes.json();

    const msgRes = await fetch(`${DISCORD_API}/channels/${dmChannel.id}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ embeds: [embed] }),
    });
    return msgRes.ok;
  } catch {
    return false;
  }
}
