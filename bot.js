const {
  Client,
  GatewayIntentBits,
  ActivityType,
  AuditLogEvent,
} = require("discord.js");
const { createClient } = require("@supabase/supabase-js");

// Load env from .env.local
require("fs")
  .readFileSync(".env.local", "utf-8")
  .split("\n")
  .forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const [key, ...rest] = trimmed.split("=");
    process.env[key.trim()] = rest.join("=").trim();
  });

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!BOT_TOKEN || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing required env vars. Check .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
  ],
});

client.once("ready", () => {
  console.log(`Bot online as ${client.user.tag}`);
  console.log(`In ${client.guilds.cache.size} server(s)`);

  client.user.setPresence({
    activities: [
      {
        name: "cocogames.com",
        type: ActivityType.Watching,
      },
    ],
    status: "online",
  });
});

// ============================================
// MEMBER JOIN — welcome message + auto-roles
// ============================================
client.on("guildMemberAdd", async (member) => {
  try {
    const { data: config } = await supabase
      .from("guild_configs")
      .select("*")
      .eq("guild_id", member.guild.id)
      .maybeSingle();

    if (!config) return;

    // Welcome message
    if (config.welcome_enabled && config.welcome_channel) {
      const channel = member.guild.channels.cache.get(config.welcome_channel);
      if (channel && channel.isTextBased()) {
        const msg = (config.welcome_message || "Welcome, {user}!").replace(
          /\{user\}/g,
          `<@${member.id}>`
        );
        channel.send(msg).catch(() => {});
      }
    }

    // Auto-assign roles on join
    if (config.auto_roles && config.auto_roles.length > 0) {
      for (const roleId of config.auto_roles) {
        await member.roles.add(roleId).catch(() => {});
      }
    }

    // Check if this user is already verified (has Roblox linked)
    if (config.verified_role_id) {
      const { data: user } = await supabase
        .from("users")
        .select("roblox_id")
        .eq("discord_id", member.id)
        .maybeSingle();

      if (user?.roblox_id) {
        await member.roles.add(config.verified_role_id).catch(() => {});
      }
    }
  } catch (err) {
    console.error(
      `Error handling member join in ${member.guild.name}:`,
      err.message
    );
  }
});

// ============================================
// AUDIT LOG HELPER
// ============================================
async function getRecentAuditEntry(guild, actionType, targetId) {
  try {
    const logs = await guild.fetchAuditLogs({
      type: actionType,
      limit: 5,
    });

    const entry = logs.entries.find((e) => {
      if (e.target?.id !== targetId) return false;
      // Only match entries from the last 10 seconds
      const age = Date.now() - e.createdTimestamp;
      return age < 10000;
    });

    return entry || null;
  } catch (err) {
    console.error(`Failed to fetch audit logs:`, err.message);
    return null;
  }
}

// ============================================
// BAN — log to discipline_log
// ============================================
client.on("guildBanAdd", async (ban) => {
  try {
    const entry = await getRecentAuditEntry(
      ban.guild,
      AuditLogEvent.MemberBanAdd,
      ban.user.id
    );

    await supabase.from("discipline_log").insert({
      target_discord_id: ban.user.id,
      guild_id: ban.guild.id,
      guild_name: ban.guild.name,
      action_type: "ban",
      reason: entry?.reason || ban.reason || null,
      moderator_discord_id: entry?.executor?.id || null,
      moderator_username: entry?.executor?.tag || null,
    });

    console.log(
      `[DISCIPLINE] Ban logged: ${ban.user.tag} in ${ban.guild.name}`
    );
  } catch (err) {
    console.error(`Error logging ban:`, err.message);
  }
});

// ============================================
// UNBAN — log to discipline_log
// ============================================
client.on("guildBanRemove", async (ban) => {
  try {
    const entry = await getRecentAuditEntry(
      ban.guild,
      AuditLogEvent.MemberBanRemove,
      ban.user.id
    );

    await supabase.from("discipline_log").insert({
      target_discord_id: ban.user.id,
      guild_id: ban.guild.id,
      guild_name: ban.guild.name,
      action_type: "unban",
      reason: entry?.reason || null,
      moderator_discord_id: entry?.executor?.id || null,
      moderator_username: entry?.executor?.tag || null,
    });

    console.log(
      `[DISCIPLINE] Unban logged: ${ban.user.tag} in ${ban.guild.name}`
    );
  } catch (err) {
    console.error(`Error logging unban:`, err.message);
  }
});

// ============================================
// MEMBER REMOVE — detect kicks (vs voluntary leaves)
// ============================================
client.on("guildMemberRemove", async (member) => {
  try {
    // Check if this was a kick (not a voluntary leave or ban)
    const entry = await getRecentAuditEntry(
      member.guild,
      AuditLogEvent.MemberKick,
      member.id
    );

    if (!entry) return; // Not a kick, just a leave

    await supabase.from("discipline_log").insert({
      target_discord_id: member.id,
      guild_id: member.guild.id,
      guild_name: member.guild.name,
      action_type: "kick",
      reason: entry.reason || null,
      moderator_discord_id: entry.executor?.id || null,
      moderator_username: entry.executor?.tag || null,
    });

    console.log(
      `[DISCIPLINE] Kick logged: ${member.user.tag} in ${member.guild.name}`
    );
  } catch (err) {
    console.error(`Error logging kick:`, err.message);
  }
});

client.login(BOT_TOKEN);
