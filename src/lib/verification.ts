import { getSupabase } from "./supabase";
import { addGuildMemberRole, getBotGuilds, getUserGuilds } from "./discord";

/**
 * Assigns the Verified role to a user in all mutual guilds,
 * but ONLY if they have both Discord and Roblox accounts linked.
 */
export async function assignVerifiedRole(
  discordId: string,
  userAccessToken: string
) {
  try {
    // Check if user has Roblox linked
    const { data: user } = await getSupabase()
      .from("users")
      .select("roblox_id")
      .eq("discord_id", discordId)
      .maybeSingle();

    if (!user?.roblox_id) {
      // Roblox not linked — skip verification
      return;
    }

    // Find mutual guilds
    const [userGuilds, botGuilds] = await Promise.all([
      getUserGuilds(userAccessToken),
      getBotGuilds(),
    ]);
    const botGuildIds = new Set(botGuilds.map((g) => g.id));
    const mutualGuildIds = userGuilds
      .filter((g) => botGuildIds.has(g.id))
      .map((g) => g.id);

    if (mutualGuildIds.length === 0) return;

    // Fetch guild configs that have a verified_role_id set
    const { data: configs } = await getSupabase()
      .from("guild_configs")
      .select("guild_id, verified_role_id")
      .in("guild_id", mutualGuildIds)
      .not("verified_role_id", "is", null);

    if (configs && configs.length > 0) {
      await Promise.allSettled(
        configs.map(
          (cfg: { guild_id: string; verified_role_id: string }) =>
            addGuildMemberRole(cfg.guild_id, discordId, cfg.verified_role_id)
        )
      );
    }
  } catch {
    // Don't block login if role assignment fails
  }
}
