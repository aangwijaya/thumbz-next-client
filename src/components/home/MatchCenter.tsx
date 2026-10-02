import { FeatureRow } from "@/components/home/FeatureRow";
import { MatchCenterPanel } from "@/components/home/MatchCenterPanel";
import { SpoilerToggle } from "@/components/spoiler/SpoilerToggle";
import type { MatchSummary } from "@/lib/api/types";

// The featured live match: gold lead, key moments and commentary language.
export function MatchCenter({ match }: { match: MatchSummary }) {
  const name = `${match?.team_a?.name ?? "TBD"} vs ${match?.team_b?.name ?? "TBD"}`;

  return (
    <FeatureRow
      id="match-center"
      flip
      eyebrow="Match center"
      title="See how the game is going before you tune in"
      body={[
        "Gold lead, key objectives and commentary in your language. Updates are held back to match the stream delay, so nothing here runs ahead of the video.",
        "Watching later? Hide scores and results across THUMBZ, then reveal only the matches you want.",
      ]}
      actions={<SpoilerToggle variant="button" />}
      action={{ href: `/matches/${match?.id ?? ""}`, label: `Open ${name}` }}
    >
      <MatchCenterPanel match={match} />
    </FeatureRow>
  );
}
