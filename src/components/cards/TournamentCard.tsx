import Image from "next/image";
import Link from "next/link";

import { StatusBadge } from "@/components/ui/StatusBadge";
import type { TournamentSummary } from "@/lib/api/types";
import { formatDate, initialsOf } from "@/lib/utils/format";

interface TournamentCardProps {
  tournament: TournamentSummary;
  className?: string;
}

export function TournamentCard({ tournament, className = "" }: TournamentCardProps) {
  const name = tournament?.name ?? "Unknown tournament";
  const dates = [
    tournament?.start_date ? formatDate(tournament.start_date) : null,
    tournament?.end_date ? formatDate(tournament.end_date) : null,
  ]
    .filter(Boolean)
    .join(" – ");

  return (
    <Link
      href={`/tournaments/${tournament?.id ?? ""}`}
      className={`group flex items-center gap-5 rounded-xl border border-page-dark-border bg-page-dark-surface p-5 transition-colors hover:border-text-secondary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary sm:p-6 ${className}`}
    >
      {tournament?.logo_url ? (
        <Image
          src={tournament.logo_url}
          alt={`${name} logo`}
          width={56}
          height={56}
          className="shrink-0 rounded-md object-contain"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex size-14 shrink-0 items-center justify-center rounded-md bg-page-dark font-mono text-base text-text-secondary"
        >
          {initialsOf(name)}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <h3 className="truncate font-display text-2xl tracking-tight">{name}</h3>
        <p className="mt-1.5 truncate font-mono text-[11px] uppercase tracking-[0.16em] text-text-secondary">
          {[tournament?.region, dates].filter(Boolean).join(" · ")}
        </p>
        {tournament?.prize_pool ? (
          <p className="mt-1.5 font-mono text-sm tabular-nums text-text-primary">
            {tournament.prize_pool}
          </p>
        ) : null}
      </div>

      {tournament?.status ? (
        <span className="shrink-0 self-start">
          <StatusBadge status={tournament.status} />
        </span>
      ) : null}
    </Link>
  );
}
