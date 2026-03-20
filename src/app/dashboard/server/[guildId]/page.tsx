import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getGuildDetails,
  getGuildChannels,
  getGuildRoles,
  getGuildIconUrl,
} from "@/lib/discord";
import Link from "next/link";
import ServerConfigForm from "./ServerConfigForm";
export const runtime = 'edge';

export const metadata = {
  title: "Server Config | COCO GAMES",
};

export default async function ServerConfigPage({
  params,
}: {
  params: { guildId: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.discordId !== process.env.OWNER_DISCORD_ID) {
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
    redirect("/dashboard");
  }

  const textChannels = channels.filter((c) => c.type === 0);
  const assignableRoles = roles.filter((r) => r.name !== "@everyone");
  const iconUrl = getGuildIconUrl(params.guildId, guild.icon);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Back Link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-coco-coffee hover:text-coco-accent text-sm font-bold mb-8 transition-colors"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="square"
            strokeLinejoin="miter"
            strokeWidth={2.5}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Dashboard
      </Link>

      {/* Server Header */}
      <div className="flex items-center gap-5 mb-10">
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

      {/* Config Form */}
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
