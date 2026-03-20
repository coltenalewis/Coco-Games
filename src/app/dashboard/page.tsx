import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getBotGuilds, generateBotInviteUrl } from "@/lib/discord";
import ServerCard from "@/components/ServerCard";

export const metadata = {
  title: "Dashboard | COCO GAMES",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== "owner") {
    redirect("/");
  }

  let guilds: { id: string; name: string; icon: string | null }[] = [];
  let error = "";

  try {
    guilds = await getBotGuilds();
  } catch (e) {
    error =
      e instanceof Error
        ? e.message
        : "Failed to fetch servers. Check your bot token.";
  }

  const inviteUrl = generateBotInviteUrl();

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
        <div>
          <span className="text-coco-accent font-bold text-xs uppercase tracking-[0.2em]">
            Owner Panel
          </span>
          <h1 className="text-3xl font-black text-coco-dark mt-1">
            Dashboard
          </h1>
        </div>
        <a
          href={inviteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-discord inline-flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="square"
              strokeLinejoin="miter"
              strokeWidth={2.5}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Bot to Server
        </a>
      </div>

      {/* Bot Info */}
      <div className="card p-6 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-coco-accent font-bold uppercase tracking-widest">
              App ID
            </p>
            <p className="font-mono text-sm text-coco-dark mt-1.5">
              {process.env.DISCORD_CLIENT_ID}
            </p>
          </div>
          <div>
            <p className="text-xs text-coco-accent font-bold uppercase tracking-widest">
              Servers
            </p>
            <p className="text-3xl font-black text-coco-dark mt-1">
              {guilds.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-coco-accent font-bold uppercase tracking-widest">
              Status
            </p>
            <p className="text-sm text-green-700 font-bold mt-1.5 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-green-500 inline-block" />
              Online
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border-2 border-red-300 p-4 mb-8">
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Server List */}
      <h2 className="text-sm font-bold text-coco-accent uppercase tracking-[0.2em] mb-4">
        Connected Servers
      </h2>
      {guilds.length === 0 && !error ? (
        <div className="card p-16 text-center">
          <p className="text-coco-coffee mb-4 font-medium">
            No servers connected yet.
          </p>
          <a
            href={inviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-block"
          >
            Add Bot to Server
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {guilds.map((guild) => (
            <ServerCard
              key={guild.id}
              id={guild.id}
              name={guild.name}
              icon={guild.icon}
            />
          ))}
        </div>
      )}
    </div>
  );
}
