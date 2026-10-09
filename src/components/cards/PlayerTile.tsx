import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import type { PlayerSummary } from "@/lib/api/types";
import { initialsOf } from "@/lib/utils/format";

export const ROLE_LABELS: Record<string, string> = {
  exp: "EXP lane",
  jungle: "Jungler",
  mid: "Mid lane",
  gold: "Gold lane",
  roam: "Roamer",
  flex: "Flex",
  coach: "Coach",
};

export function PlayerTile({ player }: { player: PlayerSummary }) {
  return (
    <Link
      href={`/players/${player?.id ?? ""}`}
      className="group flex items-center gap-4 rounded-image border border-stone bg-paper p-4 transition-colors hover:border-ink/30 hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember"
    >
      {player?.photo_url ? (
        <Image
          src={player.photo_url}
          alt=""
          width={56}
          height={56}
          className="size-14 shrink-0 rounded-full bg-cream object-cover"
        />
      ) : (
        <span aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-full bg-cream font-graphik text-body-lg font-bold text-deep-ember">
          {initialsOf(player?.nickname ?? "?")}
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate font-graphik text-body-lg font-bold text-ink group-hover:text-deep-ember">
          {player?.nickname ?? "Player"}
        </span>
        <span className="flex flex-wrap items-center gap-2 text-body-sm text-pencil">
          {player?.role ? <Badge size="xs">{ROLE_LABELS[player.role] ?? player.role}</Badge> : null}
          <span className="truncate">{player?.team?.name ?? "Free agent"}</span>
        </span>
      </span>
    </Link>
  );
}
