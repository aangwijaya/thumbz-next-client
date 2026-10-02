"use client";

import { useFollow } from "@/components/home/FollowProvider";
import { Badge } from "@/components/ui/Badge";
import type { TeamSummary } from "@/lib/api/types";

export function FollowButton({ team }: { team: TeamSummary }) {
  const { isFollowing, toggle } = useFollow();
  const following = isFollowing(team.id);

  return (
    <button
      type="button"
      aria-pressed={following}
      onClick={() => toggle(team)}
      className="self-start rounded-lg border border-stone bg-paper px-3 py-[7px] text-body-sm font-semibold text-ink transition-colors hover:border-charcoal aria-pressed:border-transparent aria-pressed:bg-mint-wash aria-pressed:text-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember"
    >
      <span className="sr-only">{team.name}: </span>
      {following ? "✓ Following" : "Follow"}
    </button>
  );
}

// Shown on matches that involve a team the visitor follows.
export function FollowingBadge({ teamIds }: { teamIds: Array<string | undefined> }) {
  const { isFollowing } = useFollow();
  if (!teamIds.some((id) => id && isFollowing(id))) return null;
  return <Badge tone="green">Following</Badge>;
}
