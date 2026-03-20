import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasMinRole } from "@/lib/roles";
import {
  getGuildDetails,
  getGuildChannels,
  getGuildRoles,
  getGuildIconUrl,
} from "@/lib/discord";
import Link from "next/link";
import ServerConfigForm from "@/app/dashboard/server/[guildId]/ServerConfigForm";
export const runtime = 'edge';

export const metadata = {
  title: "Server Config | COCO GAMES Admin",
};

export default async function AdminServerConfigPage({
  params,
}: {
  params: { guildId: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session || !hasMinRole(session.user?.role, "admin")) {
    redirect("/");
  }

  let guild;
  let channels: { id: string; name: string; type: number }[] = [];
  let roles: { id: string; name: string; color: number }[] = [];

  try {
    [guild, channels, roles] = await Promise.all([
      getGuildDetails(params.guildId),
      getGuildChannels(params.guildId),
      getGuildRoles(params.guildId),
    ]);
  } catch {
    redirect("/admin/servers");
  }

  const textChannels = channels.filter((c) => c.type === 0);
  const assignableRoles = roles.filter((r) => r.name !== "@everyone");
  const iconUrl = getGuildIconUrl(params.guildId, guild.icon);

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/admin/servers"
        className="text-coco-accent hover:text-coco-ember text-sm font-bold uppercase tracking-wider"
      >
        &larr; All Servers
      </Link>

      {/* Server Header */}
      <div className="flex items-center gap-5">
        {iconUrl ? (
          <img
            src={iconUrl}
            alt={guild.name}
            className="w-16 h-16 border-4 border-coco-accent shadow-coco-sharp"
          />
        ) : (
          <div className="w-16 h-16 bg-coco-dark flex items-center justify-center text-coco-gold text-2xl font-black border-4 border-coco-accent">
            {guild.name.charAt(0)}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-black text-coco-dark">{guild.name}</h1>
          <p className="text-coco-coffee text-sm font-mono mt-0.5">
            {params.guildId}
          </p>
        </div>
      </div>

      {/* Reuse existing ServerConfigForm */}
      <ServerConfigForm
        guildId={params.guildId}
        textChannels={textChannels.map((c) => ({ id: c.id, name: c.name }))}
        roles={assignableRoles.map((r) => ({
          id: r.id,
          name: r.name,
          color: r.color,
        }))}
      />
    </div>
  );
}
