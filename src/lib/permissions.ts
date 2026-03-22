import { getSupabase } from "./supabase";

// Cache permissions for 60 seconds to avoid hammering DB
let permCache: Map<string, string[]> | null = null;
let permCacheTime = 0;
const CACHE_TTL = 60000;

export async function getPermissions(): Promise<Map<string, string[]>> {
  const now = Date.now();
  if (permCache && now - permCacheTime < CACHE_TTL) {
    return permCache;
  }

  const { data } = await getSupabase()
    .from("site_permissions")
    .select("permission_key, allowed_roles");

  const map = new Map<string, string[]>();
  for (const row of data || []) {
    map.set(row.permission_key, row.allowed_roles || []);
  }

  permCache = map;
  permCacheTime = now;
  return map;
}

export function clearPermissionsCache() {
  permCache = null;
  permCacheTime = 0;
}

export async function hasPermission(role: string | undefined, key: string): Promise<boolean> {
  if (!role) return false;
  // Owner always has access to everything
  if (role === "owner") return true;
  const perms = await getPermissions();
  const allowed = perms.get(key);
  if (!allowed) return false;
  return allowed.includes(role);
}

export async function getTicketCategories(role: string | undefined): Promise<string[]> {
  if (!role) return [];
  if (role === "owner") return ["question", "bug_report", "game_report", "discord_appeal", "game_appeal", "business"];

  const perms = await getPermissions();
  const categories: string[] = [];
  const categoryKeys = ["question", "bug_report", "game_report", "discord_appeal", "game_appeal", "business"];

  for (const cat of categoryKeys) {
    const allowed = perms.get(`ticket.${cat}`);
    if (allowed && allowed.includes(role)) {
      categories.push(cat);
    }
  }

  return categories;
}
