import type { MatchStatus, TournamentStatus } from "@/lib/api/types";

type BadgeStatus = MatchStatus | TournamentStatus;

// design.md status colours on paper (all >= 4.5:1 for 12px text).
const statusStyles: Record<BadgeStatus, string> = {
  live: "border-deep-ember/40 text-deep-ember",
  ongoing: "border-deep-ember/40 text-deep-ember",
  completed: "border-forest/40 text-forest",
  scheduled: "border-cobalt-link/40 text-cobalt-link",
  upcoming: "border-cobalt-link/40 text-cobalt-link",
  cancelled: "border-stone text-pencil",
  postponed: "border-stone text-pencil",
};

export function StatusBadge({ status }: { status: BadgeStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-xs uppercase tracking-widest ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}
