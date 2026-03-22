import { getSupabase } from "./supabase";

export async function logAudit(params: {
  action: string;
  actorDiscordId: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  details?: Record<string, unknown>;
  note?: string;
}) {
  try {
    await getSupabase().from("audit_logs").insert({
      action: params.action,
      actor_discord_id: params.actorDiscordId,
      target_type: params.targetType || null,
      target_id: params.targetId || null,
      target_name: params.targetName || null,
      details: params.details || {},
      note: params.note || null,
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }
}
