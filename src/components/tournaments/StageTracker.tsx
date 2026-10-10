import type { MatchStage, StageInfo } from "@/lib/api/types";
import type { LeagueFormat } from "@/lib/leagues";

interface Step {
  label: string;
  sub: string;
  state: "done" | "now" | "next";
  /** Share of the step played, 0–100 (the step on now). */
  fill?: number;
}

function stepsFor(current: MatchStage | null | undefined, stages: StageInfo[], format: LeagueFormat | null): Step[] {
  const regular = stages.find((stage) => stage?.stage === "regular_season" || stage?.stage === "group_stage");
  const played = regular && regular.match_count > 0 ? Math.round((regular.completed_count / regular.match_count) * 100) : 50;
  if (!current || current === "regular_season" || current === "group_stage") {
    return [
      {
        label: "Regular season",
        sub: format && format.currentWeek > 1 ? `Weeks 1–${format.currentWeek - 1} done` : "Under way",
        state: "done",
      },
      {
        label: format ? `Week ${format.currentWeek} of ${format.weeks}` : "This week",
        sub: "On now",
        state: "now",
        fill: played,
      },
      { label: "Playoffs", sub: format ? `Top ${format.playoffSpots} advance` : "Next", state: "next" },
    ];
  }
  if (current === "grand_final") {
    return [
      { label: "Regular season", sub: "Done", state: "done" },
      { label: "Playoffs", sub: "Done", state: "done" },
      { label: "Grand final", sub: "On now", state: "now", fill: 50 },
    ];
  }
  return [
    { label: "Regular season", sub: "Done", state: "done" },
    { label: "Playoffs", sub: "On now", state: "now", fill: 50 },
    { label: "Grand final", sub: "Next", state: "next" },
  ];
}

/** Where the tournament stands: three steps, the one on now partly filled. */
export function StageTracker({
  current,
  stages,
  format,
  className = "",
}: {
  current: MatchStage | null | undefined;
  stages: StageInfo[];
  format: LeagueFormat | null;
  className?: string;
}) {
  const steps = stepsFor(current, stages, format);
  return (
    <ol aria-label="Season progress" className={`grid grid-cols-3 gap-2.5 ${className}`}>
      {steps.map((step) => (
        <li key={step.label} className="relative flex flex-col gap-0.5 pt-3 text-caption text-pencil">
          <span
            aria-hidden="true"
            className={`absolute inset-x-0 top-0 h-1 rounded-sm ${step.state === "done" ? "bg-ink" : "bg-[#eeecea]"}`}
          />
          {step.state === "now" ? (
            <span
              aria-hidden="true"
              className="absolute left-0 top-0 h-1 rounded-sm bg-deep-ember"
              style={{ width: `${step.fill ?? 50}%` }}
            />
          ) : null}
          <b className={`font-graphik text-[15px] font-bold max-[640px]:text-[13px] ${step.state === "next" ? "text-charcoal" : "text-ink"}`}>
            {step.label}
            {step.state === "now" ? <span className="sr-only"> (current)</span> : null}
          </b>
          {step.sub}
        </li>
      ))}
    </ol>
  );
}
