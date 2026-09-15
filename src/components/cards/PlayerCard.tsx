import Image from "next/image";
import Link from "next/link";

import type { PlayerSummary } from "@/lib/api/types";
import { initialsOf } from "@/lib/utils/format";

interface PlayerCardProps {
  player: PlayerSummary;
  className?: string;
}

export function PlayerCard({ player, className = "" }: PlayerCardProps) {
  const nickname = player?.nickname ?? "Unknown";

  return (
    <Link
      href={`/players/${player?.id ?? ""}`}
      className={`group block overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-text-secondary/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary ${className}`}
    >
      <div className="relative aspect-[4/5] bg-surface-elevated">
        {player?.photo_url ? (
          <Image
            src={player.photo_url}
            alt={nickname}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            className="object-cover motion-safe:transition-transform motion-safe:group-hover:scale-[1.02]"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-full w-full items-center justify-center font-mono text-3xl text-text-secondary"
          >
            {initialsOf(nickname)}
          </span>
        )}
        {player?.role ? (
          <span className="absolute left-3 top-3 rounded bg-background/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-text-secondary">
            {player.role}
          </span>
        ) : null}
      </div>

      <div className="p-3.5">
        <h3 className="truncate text-sm font-medium">{nickname}</h3>
        <p className="mt-0.5 truncate text-xs text-text-secondary">
          {player?.team?.name ?? "Free agent"}
        </p>
      </div>
    </Link>
  );
}
