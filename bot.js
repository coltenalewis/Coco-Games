const {
  Client,
  GatewayIntentBits,
  ActivityType,
  AuditLogEvent,
  SlashCommandBuilder,
  EmbedBuilder,
  REST,
  Routes,
  PermissionFlagsBits,
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
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!BOT_TOKEN || !SUPABASE_URL || !SUPABASE_KEY || !CLIENT_ID) {
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

// ============================================
// SLASH COMMAND DEFINITIONS
// ============================================
const commands = [
  new SlashCommandBuilder()
    .setName("lookup")
    .setDescription("Look up a user's account info, Roblox profile, and account age")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("The Discord user to look up").setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("link-roblox")
    .setDescription("Link a Roblox account to a Discord user")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("The Discord user").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("roblox_id").setDescription("The Roblox user ID to link").setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("unlink-roblox")
    .setDescription("Unlink a Roblox account from a Discord user")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("The Discord user").setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("set-role")
    .setDescription("Set a user's site role")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("The Discord user").setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("role")
        .setDescription("The role to assign")
        .setRequired(true)
        .addChoices(
          { name: "User", value: "user" },
          { name: "Contractor", value: "contractor" },
          { name: "Mod", value: "mod" },
          { name: "Coordinator", value: "coordinator" },
          { name: "Developer", value: "developer" },
          { name: "Admin", value: "admin" },
          { name: "Executive", value: "executive" },
          { name: "Owner", value: "owner" }
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("update")
    .setDescription("Force sync a user's nickname, verified role, and site data")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("The Discord user to sync").setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMembers),
];

// ============================================
// REGISTER SLASH COMMANDS ON READY
// ============================================
async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(BOT_TOKEN);
  const commandData = commands.map((c) => c.toJSON());

  // Clear global commands to remove duplicates
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
  } catch {}

  // Register per-guild only (instant, no duplicates)
  for (const guild of client.guilds.cache.values()) {
    try {
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, guild.id), { body: commandData });
      console.log(`Commands registered for: ${guild.name}`);
    } catch (err) {
      console.error(`Failed to register commands for ${guild.name}:`, err.message);
    }
  }
}

// ============================================
// ROBLOX API HELPERS
// ============================================
async function fetchRobloxUser(robloxId) {
  try {
    const res = await fetch(`https://users.roblox.com/v1/users/${robloxId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchRobloxAvatar(robloxId) {
  try {
    const res = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxId}&size=150x150&format=Png`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.[0]?.imageUrl || null;
  } catch {
    return null;
  }
}

function formatRobloxNickname(robloxUser) {
  // Format: Username (@DisplayName) — capped at 32 chars (Discord limit)
  const name = robloxUser.name;
  const display = robloxUser.displayName;
  if (name === display) return name.slice(0, 32);
  const full = `${name} (@${display})`;
  if (full.length <= 32) return full;
  // Truncate display name to fit
  const available = 32 - name.length - 4; // 4 for " (@)"
  if (available > 2) return `${name} (@${display.slice(0, available)})`;
  return name.slice(0, 32);
}

async function setRobloxNickname(guild, userId, robloxUser) {
  try {
    const member = await guild.members.fetch(userId);
    const nickname = formatRobloxNickname(robloxUser);
    await member.setNickname(nickname);
    return true;
  } catch (err) {
    console.error(`Failed to set nickname for ${userId}:`, err.message);
    return false;
  }
}

function timeAgo(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "Today";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years}y ${rem}mo ago` : `${years}y ago`;
}

// ============================================
// INTERACTION HANDLER
// ============================================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  // ---- /lookup ----
  if (commandName === "lookup") {
    await interaction.deferReply();

    const targetUser = interaction.options.getUser("user");

    // Fetch from Supabase
    const { data: dbUser } = await supabase
      .from("users")
      .select("*")
      .eq("discord_id", targetUser.id)
      .maybeSingle();

    const embed = new EmbedBuilder()
      .setColor(0xe8944a)
      .setTitle(`User Lookup — ${targetUser.username}`)
      .setThumbnail(targetUser.displayAvatarURL({ size: 128 }));

    // Discord info
    const discordCreated = targetUser.createdAt;
    embed.addFields(
      {
        name: "Discord",
        value: [
          `**Username:** ${targetUser.username}`,
          `**ID:** \`${targetUser.id}\``,
          `**Account Created:** <t:${Math.floor(discordCreated.getTime() / 1000)}:R> (${discordCreated.toLocaleDateString()})`,
        ].join("\n"),
        inline: false,
      }
    );

    // Site info
    if (dbUser) {
      const joinedSite = new Date(dbUser.created_at);
      embed.addFields({
        name: "COCO GAMES Site",
        value: [
          `**Role:** ${dbUser.role.toUpperCase()}`,
          `**Joined Site:** <t:${Math.floor(joinedSite.getTime() / 1000)}:R>`,
          `**Verified:** ${dbUser.roblox_id ? "Yes" : "No"}`,
        ].join("\n"),
        inline: false,
      });
    } else {
      embed.addFields({
        name: "COCO GAMES Site",
        value: "*Not registered — user has not logged in to the site yet.*",
        inline: false,
      });
    }

    // Roblox info
    if (dbUser?.roblox_id) {
      const [robloxUser, avatarUrl] = await Promise.all([
        fetchRobloxUser(dbUser.roblox_id),
        fetchRobloxAvatar(dbUser.roblox_id),
      ]);

      if (robloxUser) {
        const created = new Date(robloxUser.created);
        const isBanned = robloxUser.isBanned;

        embed.addFields({
          name: "Roblox",
          value: [
            `**Username:** [${robloxUser.name}](https://www.roblox.com/users/${dbUser.roblox_id}/profile)`,
            `**Display Name:** ${robloxUser.displayName}`,
            `**ID:** \`${dbUser.roblox_id}\``,
            `**Account Created:** ${created.toLocaleDateString()} (${timeAgo(robloxUser.created)})`,
            robloxUser.description
              ? `**Bio:** ${robloxUser.description.slice(0, 100)}${robloxUser.description.length > 100 ? "..." : ""}`
              : "",
            isBanned ? "**Status:** ⛔ BANNED" : "",
          ]
            .filter(Boolean)
            .join("\n"),
          inline: false,
        });

        if (avatarUrl) embed.setImage(avatarUrl);
      } else {
        embed.addFields({
          name: "Roblox",
          value: `Linked ID: \`${dbUser.roblox_id}\` — *Could not fetch profile (may be deleted)*`,
          inline: false,
        });
      }
    } else {
      embed.addFields({
        name: "Roblox",
        value: "*Not linked*",
        inline: false,
      });
    }

    // Guild member info
    try {
      const member = await interaction.guild.members.fetch(targetUser.id);
      const joinedGuild = member.joinedAt;
      const roles = member.roles.cache
        .filter((r) => r.id !== interaction.guild.id)
        .sort((a, b) => b.position - a.position)
        .map((r) => r.toString())
        .slice(0, 10);

      embed.addFields({
        name: "Server Info",
        value: [
          `**Joined Server:** <t:${Math.floor(joinedGuild.getTime() / 1000)}:R>`,
          `**Roles (${roles.length}):** ${roles.join(", ") || "None"}`,
        ].join("\n"),
        inline: false,
      });
    } catch {
      // User not in this server
    }

    embed.setFooter({ text: "COCO GAMES" }).setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }

  // ---- /link-roblox ----
  if (commandName === "link-roblox") {
    await interaction.deferReply();

    const targetUser = interaction.options.getUser("user");
    const robloxId = interaction.options.getString("roblox_id");

    // Validate Roblox ID
    if (!/^\d+$/.test(robloxId)) {
      return interaction.editReply("❌ Invalid Roblox ID — must be a number.");
    }

    // Fetch Roblox user to verify
    const robloxUser = await fetchRobloxUser(robloxId);
    if (!robloxUser) {
      return interaction.editReply("❌ Roblox account not found with that ID.");
    }

    // Check if already linked to someone else
    const { data: existing } = await supabase
      .from("users")
      .select("discord_id")
      .eq("roblox_id", robloxId)
      .neq("discord_id", targetUser.id)
      .maybeSingle();

    if (existing) {
      return interaction.editReply(
        `❌ Roblox account **${robloxUser.name}** is already linked to another Discord user (\`${existing.discord_id}\`).`
      );
    }

    // Upsert user if they don't exist, then update roblox info
    await supabase.from("users").upsert(
      {
        discord_id: targetUser.id,
        discord_username: targetUser.username,
        discord_avatar: targetUser.avatar,
        roblox_id: robloxId,
        roblox_username: robloxUser.name,
      },
      { onConflict: "discord_id" }
    );

    // Try to assign verified role + set nickname
    try {
      const { data: config } = await supabase
        .from("guild_configs")
        .select("verified_role_id")
        .eq("guild_id", interaction.guild.id)
        .maybeSingle();

      if (config?.verified_role_id) {
        const member = await interaction.guild.members.fetch(targetUser.id);
        await member.roles.add(config.verified_role_id).catch(() => {});
      }
    } catch {}

    // Set Discord nickname to Roblox name
    await setRobloxNickname(interaction.guild, targetUser.id, robloxUser);

    const avatarUrl = await fetchRobloxAvatar(robloxId);

    const embed = new EmbedBuilder()
      .setColor(0x22c55e)
      .setTitle("Roblox Account Linked")
      .setDescription(
        `Linked **${robloxUser.name}** (${robloxUser.displayName}) to <@${targetUser.id}>.`
      )
      .addFields(
        { name: "Roblox ID", value: `\`${robloxId}\``, inline: true },
        { name: "Account Age", value: timeAgo(robloxUser.created), inline: true }
      )
      .setFooter({ text: `Linked by ${interaction.user.username}` })
      .setTimestamp();

    if (avatarUrl) embed.setThumbnail(avatarUrl);

    await interaction.editReply({ embeds: [embed] });
  }

  // ---- /unlink-roblox ----
  if (commandName === "unlink-roblox") {
    await interaction.deferReply();

    const targetUser = interaction.options.getUser("user");

    const { data: dbUser } = await supabase
      .from("users")
      .select("roblox_id, roblox_username")
      .eq("discord_id", targetUser.id)
      .maybeSingle();

    if (!dbUser?.roblox_id) {
      return interaction.editReply(`❌ <@${targetUser.id}> doesn't have a Roblox account linked.`);
    }

    await supabase
      .from("users")
      .update({ roblox_id: null, roblox_username: null })
      .eq("discord_id", targetUser.id);

    // Remove verified role + reset nickname
    try {
      const { data: config } = await supabase
        .from("guild_configs")
        .select("verified_role_id")
        .eq("guild_id", interaction.guild.id)
        .maybeSingle();

      const member = await interaction.guild.members.fetch(targetUser.id);

      if (config?.verified_role_id) {
        await member.roles.remove(config.verified_role_id).catch(() => {});
      }

      // Reset nickname back to their Discord username
      await member.setNickname(null).catch(() => {});
    } catch {}

    const embed = new EmbedBuilder()
      .setColor(0xef4444)
      .setTitle("Roblox Account Unlinked")
      .setDescription(
        `Unlinked **${dbUser.roblox_username || dbUser.roblox_id}** from <@${targetUser.id}>.`
      )
      .setFooter({ text: `Unlinked by ${interaction.user.username}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }

  // ---- /set-role ----
  if (commandName === "set-role") {
    await interaction.deferReply();

    const targetUser = interaction.options.getUser("user");
    const role = interaction.options.getString("role");

    // Only allow the owner to set roles
    const { data: caller } = await supabase
      .from("users")
      .select("role")
      .eq("discord_id", interaction.user.id)
      .maybeSingle();

    if (!caller || caller.role !== "owner") {
      return interaction.editReply("❌ Only the site owner can change roles.");
    }

    if (targetUser.id === interaction.user.id) {
      return interaction.editReply("❌ You can't change your own role.");
    }

    // Upsert user
    await supabase.from("users").upsert(
      {
        discord_id: targetUser.id,
        discord_username: targetUser.username,
        discord_avatar: targetUser.avatar,
        role,
      },
      { onConflict: "discord_id" }
    );

    const roleColors = {
      user: 0x9ca3af,
      contractor: 0xf59e0b,
      mod: 0x3b82f6,
      coordinator: 0x06b6d4,
      developer: 0x8b5cf6,
      admin: 0xef4444,
      executive: 0x22c55e,
      owner: 0xd35400,
    };

    const embed = new EmbedBuilder()
      .setColor(roleColors[role] || 0xe8944a)
      .setTitle("Role Updated")
      .setDescription(`Set <@${targetUser.id}>'s role to **${role.toUpperCase()}**.`)
      .setFooter({ text: `Updated by ${interaction.user.username}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }

  // ---- /update ----
  if (commandName === "update") {
    await interaction.deferReply();

    const targetUser = interaction.options.getUser("user");

    // Non-admins can only update themselves
    if (targetUser.id !== interaction.user.id) {
      const { data: caller } = await supabase
        .from("users")
        .select("role")
        .eq("discord_id", interaction.user.id)
        .maybeSingle();

      const adminRoles = ["admin", "developer", "executive", "owner"];
      if (!caller || !adminRoles.includes(caller.role)) {
        return interaction.editReply("❌ You can only update your own account. Admins can update other users.");
      }
    }

    const changes = [];

    // Fetch DB user
    const { data: dbUser } = await supabase
      .from("users")
      .select("*")
      .eq("discord_id", targetUser.id)
      .maybeSingle();

    // Update Discord info in DB
    await supabase.from("users").upsert(
      {
        discord_id: targetUser.id,
        discord_username: targetUser.username,
        discord_avatar: targetUser.avatar,
      },
      { onConflict: "discord_id" }
    );
    changes.push("Synced Discord username & avatar to database");

    // Fetch guild member
    let member;
    try {
      member = await interaction.guild.members.fetch(targetUser.id);
    } catch {
      return interaction.editReply("❌ User is not in this server.");
    }

    // Fetch guild config
    const { data: config } = await supabase
      .from("guild_configs")
      .select("verified_role_id, moderator_role_id, admin_role_id")
      .eq("guild_id", interaction.guild.id)
      .maybeSingle();

    const userRole = dbUser?.role || "user";

    // Sync verified role + nickname
    if (dbUser?.roblox_id) {
      const robloxUser = await fetchRobloxUser(dbUser.roblox_id);

      if (robloxUser) {
        // Update Roblox username in DB if it changed
        if (robloxUser.name !== dbUser.roblox_username) {
          await supabase
            .from("users")
            .update({ roblox_username: robloxUser.name })
            .eq("discord_id", targetUser.id);
          changes.push(`Updated Roblox username: **${dbUser.roblox_username}** → **${robloxUser.name}**`);
        }

        // Set nickname
        const nicknameSet = await setRobloxNickname(interaction.guild, targetUser.id, robloxUser);
        if (nicknameSet) {
          changes.push(`Nickname set to **${formatRobloxNickname(robloxUser)}**`);
        } else {
          changes.push("Could not update nickname (missing permissions or user is server owner)");
        }
      } else {
        changes.push("⚠️ Roblox account not found — may be deleted");
      }

      // Add verified role
      if (config?.verified_role_id) {
        if (!member.roles.cache.has(config.verified_role_id)) {
          await member.roles.add(config.verified_role_id).catch(() => {});
          changes.push("Added Verified role");
        } else {
          changes.push("Verified role already assigned");
        }
      }
    } else {
      // No Roblox linked — remove verified role if they have it
      if (config?.verified_role_id && member.roles.cache.has(config.verified_role_id)) {
        await member.roles.remove(config.verified_role_id).catch(() => {});
        changes.push("Removed Verified role (no Roblox linked)");
      }
    }

    // Sync mod/admin Discord roles based on site role
    if (config?.admin_role_id) {
      const shouldHave = userRole === "admin" || userRole === "executive" || userRole === "owner";
      const has = member.roles.cache.has(config.admin_role_id);
      if (shouldHave && !has) {
        await member.roles.add(config.admin_role_id).catch(() => {});
        changes.push("Added Admin role");
      } else if (!shouldHave && has) {
        await member.roles.remove(config.admin_role_id).catch(() => {});
        changes.push("Removed Admin role");
      }
    }

    if (config?.moderator_role_id) {
      const shouldHave = userRole === "mod" || userRole === "admin" || userRole === "executive" || userRole === "owner";
      const has = member.roles.cache.has(config.moderator_role_id);
      if (shouldHave && !has) {
        await member.roles.add(config.moderator_role_id).catch(() => {});
        changes.push("Added Moderator role");
      } else if (!shouldHave && has) {
        await member.roles.remove(config.moderator_role_id).catch(() => {});
        changes.push("Removed Moderator role");
      }
    }

    const embed = new EmbedBuilder()
      .setColor(0xe8944a)
      .setTitle(`User Synced — ${targetUser.username}`)
      .setThumbnail(targetUser.displayAvatarURL({ size: 64 }))
      .setDescription(changes.map((c) => `• ${c}`).join("\n"))
      .addFields(
        { name: "Site Role", value: userRole.toUpperCase(), inline: true },
        { name: "Roblox", value: dbUser?.roblox_username || "Not linked", inline: true }
      )
      .setFooter({ text: `Synced by ${interaction.user.username}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
});

// ============================================
// BOT READY
// ============================================
client.once("ready", async () => {
  console.log(`Bot online as ${client.user.tag}`);
  console.log(`In ${client.guilds.cache.size} server(s)`);

  client.user.setPresence({
    activities: [
      {
        name: "coco-games-ieew.vercel.app",
        type: ActivityType.Watching,
      },
    ],
    status: "online",
  });

  await registerCommands();
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
    const { data: user } = await supabase
      .from("users")
      .select("roblox_id")
      .eq("discord_id", member.id)
      .maybeSingle();

    if (user?.roblox_id) {
      if (config.verified_role_id) {
        await member.roles.add(config.verified_role_id).catch(() => {});
      }

      // Set nickname to Roblox name
      const robloxUser = await fetchRobloxUser(user.roblox_id);
      if (robloxUser) {
        await setRobloxNickname(member.guild, member.id, robloxUser);
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
    const entry = await getRecentAuditEntry(
      member.guild,
      AuditLogEvent.MemberKick,
      member.id
    );

    if (!entry) return;

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

// ============================================
// TIMEOUT — detect via guildMemberUpdate
// ============================================
client.on("guildMemberUpdate", async (oldMember, newMember) => {
  try {
    const oldTimeout = oldMember.communicationDisabledUntil;
    const newTimeout = newMember.communicationDisabledUntil;

    // Only log when a timeout is applied (not when it expires)
    if (!newTimeout || (oldTimeout && oldTimeout >= newTimeout)) return;

    const entry = await getRecentAuditEntry(
      newMember.guild,
      AuditLogEvent.MemberUpdate,
      newMember.id
    );

    const duration = newTimeout.getTime() - Date.now();
    const durationStr =
      duration < 60000
        ? `${Math.round(duration / 1000)}s`
        : duration < 3600000
        ? `${Math.round(duration / 60000)}m`
        : duration < 86400000
        ? `${Math.round(duration / 3600000)}h`
        : `${Math.round(duration / 86400000)}d`;

    const reason = entry?.reason
      ? `${entry.reason} (${durationStr})`
      : `Timed out for ${durationStr}`;

    await supabase.from("discipline_log").insert({
      target_discord_id: newMember.id,
      guild_id: newMember.guild.id,
      guild_name: newMember.guild.name,
      action_type: "timeout",
      reason,
      moderator_discord_id: entry?.executor?.id || null,
      moderator_username: entry?.executor?.tag || null,
    });

    console.log(
      `[DISCIPLINE] Timeout logged: ${newMember.user.tag} in ${newMember.guild.name} (${durationStr})`
    );
  } catch (err) {
    console.error(`Error logging timeout:`, err.message);
  }
});

client.login(BOT_TOKEN);
