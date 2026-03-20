import Link from "next/link";
import { getGuildIconUrl } from "@/lib/discord";

interface ServerCardProps {
  id: string;
  name: string;
  icon: string | null;
  memberCount?: number;
}

export default function ServerCard({
  id,
  name,
  icon,
  memberCount,
}: ServerCardProps) {
  const iconUrl = getGuildIconUrl(id, icon);

  return (
    <Link
      href={`/dashboard/server/${id}`}
      className="card-interactive block p-5 group"
    >
      <div className="flex items-center gap-4">
        {iconUrl ? (
          <img
            src={iconUrl}
            alt={name}
            className="w-12 h-12 border-2 border-coco-accent/30"
          />
        ) : (
          <div className="w-12 h-12 bg-coco-dark flex items-center justify-center text-coco-gold font-bold text-lg border-2 border-coco-accent/30">
            {name.charAt(0)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-coco-dark truncate group-hover:text-coco-accent transition-colors">
            {name}
          </h3>
          {memberCount !== undefined && (
            <p className="text-sm text-coco-coffee">
              {memberCount.toLocaleString()} members
            </p>
          )}
        </div>
        <svg
          className="w-5 h-5 text-coco-accent opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="square"
            strokeLinejoin="miter"
            strokeWidth={2.5}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </Link>
  );
}
