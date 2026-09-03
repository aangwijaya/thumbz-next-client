import Link from "next/link";

import type { TeamSummary } from "@/lib/api/types";

import { TeamLogo } from "./TeamLogo";

interface TeamCardProps {
  team: TeamSummary;
  className?: string;
}

export function TeamCard({ team, className = "" }: TeamCardProps) {
  return (
    <Link
      href={`/teams/${team?.id ?? ""}`}
      className={`group relative flex flex-col items-center gap-3 overflow-hidden rounded-xl border border-page-dark-border bg-page-dark-surface px-4 py-6 transition-colors hover:border-text-secondary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary ${className}`}
    >
      <TeamLogo team={team} size={64} />
      <div className="text-center">
        <h3 className="text-base font-semibold tracking-tight">
          {team?.name ?? "Unknown team"}
        </h3>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-text-secondary">
          {team?.region ?? "—"}
        </p>
      </div>
      {team?.color_primary ? (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-0.5 opacity-70"
          style={{ backgroundColor: team.color_primary }}
        />
      ) : null}
    </Link>
  );
}
