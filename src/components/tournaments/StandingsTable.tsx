import type { StandingsPayload } from "@/lib/api/types";

import { TeamLogo } from "../cards/TeamLogo";
import { EmptyState } from "../ui/EmptyState";

interface StandingsTableProps {
  standings?: StandingsPayload | null;
}

export function StandingsTable({ standings }: StandingsTableProps) {
  const rows = standings?.standings ?? [];
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No standings yet"
        description="Standings appear once matches in this tournament are completed."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-page-dark-border bg-page-dark-surface">
      <table className="w-full min-w-md text-sm">
        <thead>
          <tr className="border-b border-page-dark-border font-mono text-[10px] uppercase tracking-[0.16em] text-text-secondary">
            <th className="px-4 py-3 text-left font-medium">#</th>
            <th className="px-4 py-3 text-left font-medium">Team</th>
            <th className="px-4 py-3 text-right font-medium">P</th>
            <th className="px-4 py-3 text-right font-medium">W</th>
            <th className="px-4 py-3 text-right font-medium">L</th>
            <th className="px-4 py-3 text-right font-medium">Win rate</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row?.team?.id ?? row?.rank}
              className="border-b border-page-dark-border last:border-b-0"
            >
              <td className="px-4 py-3 font-mono tabular-nums text-text-secondary">
                {row?.rank ?? "—"}
              </td>
              <td className="px-4 py-3">
                <span className="flex items-center gap-2.5">
                  <TeamLogo team={row?.team} size={20} />
                  <span className="truncate font-medium">{row?.team?.name ?? "TBD"}</span>
                </span>
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums">
                {row?.played ?? 0}
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums text-success">
                {row?.wins ?? 0}
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums text-text-secondary">
                {row?.losses ?? 0}
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums">
                {row?.win_rate != null ? `${Math.round(row.win_rate * 100)}%` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
