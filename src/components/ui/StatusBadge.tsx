import type { MatchStatus, TournamentStatus } from "@/lib/api/types";

type BadgeStatus = MatchStatus | TournamentStatus;

const statusStyles: Record<BadgeStatus, string> = {
  live: "border-live/40 text-live",
  ongoing: "border-live/40 text-live",
  completed: "border-success/40 text-success",
  scheduled: "border-warning/40 text-warning",
  upcoming: "border-warning/40 text-warning",
  cancelled: "border-border text-text-secondary",
  postponed: "border-border text-text-secondary",
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
