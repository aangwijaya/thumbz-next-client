import Link from "next/link";

import { ArrowLink } from "@/components/ui/ArrowLink";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { Rail } from "@/components/ui/Rail";
import { LiveDot } from "@/components/ui/LiveDot";
import { Thumbnail } from "@/components/ui/Thumbnail";
import type { WatchHistoryItem } from "@/lib/api/types";

interface ContinueWatchingProps {
  items: WatchHistoryItem[];
}

// The API only stores how long the visitor watched, so the share watched is
// measured against how long the match has been running (or ran).
function watchedShare(item: WatchHistoryItem): number {
  const started = new Date(item?.match?.started_at ?? "").getTime();
  if (Number.isNaN(started)) return 0;
  const ended = new Date(item?.match?.ended_at ?? "").getTime();
  const span = ((Number.isNaN(ended) ? Date.now() : ended) - started) / 1000;
  if (span <= 0) return 0;
  return Math.min(1, Math.max(0, (item?.duration_seconds ?? 0) / span));
}

function HistoryCard({ item }: { item: WatchHistoryItem }) {
  const match = item?.match;
  const isLive = match?.status === "live";
  const minutes = Math.round((item?.duration_seconds ?? 0) / 60);
  const share = watchedShare(item);
  const title = [
    `${match?.team_a?.name ?? "TBD"} vs ${match?.team_b?.name ?? "TBD"}`,
    match?.game_number != null ? `Game ${match.game_number}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Link
      href={`/matches/${item?.match_id ?? match?.id ?? ""}`}
      className="group flex flex-col gap-3 rounded-image max-[640px]:w-[280px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-deep-ember"
    >
      <Thumbnail
        src={match?.thumbnail_url}
        colors={[match?.team_a?.color_primary, match?.team_b?.color_primary]}
        sizes="(min-width: 1024px) 384px, (min-width: 640px) 50vw, 100vw"
        className="rounded-image"
      >
        {isLive ? (
          <Badge tone="light" size="sm" className="absolute left-2.5 top-2.5">
            <LiveDot />
            Live
          </Badge>
        ) : null}
        {minutes > 0 ? (
          <Badge tone="dark" size="sm" className="absolute bottom-3.5 right-2.5 font-medium">
            {minutes} min watched
          </Badge>
        ) : null}
        {share > 0 ? (
          <span
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-1 bg-paper/25"
          >
            <span
              className="absolute inset-y-0 left-0 bg-ember-red"
              style={{ width: `${Math.round(share * 100)}%` }}
            />
          </span>
        ) : null}
      </Thumbnail>

      <h3 className="text-pretty font-graphik text-[17px] font-bold leading-[1.35] text-ink transition-colors group-hover:text-deep-ember">
        {title}
      </h3>
    </Link>
  );
}

export function ContinueWatching({ items }: ContinueWatchingProps) {
  return (
    <section
      id="continue-watching"
      aria-labelledby="continue-watching-title"
      className="scroll-mt-24 py-[clamp(32px,4vw,48px)]"
    >
      <Container size="page">
        <div className="mb-6 flex flex-col items-start gap-4 min-[641px]:mb-8 min-[641px]:flex-row min-[641px]:flex-wrap min-[641px]:items-end min-[641px]:justify-between">
          <div className="flex flex-col gap-4">
            <p className="-mb-2 text-caption font-semibold text-deep-ember">
              Continue watching
            </p>
            <h2
              id="continue-watching-title"
              className="text-balance font-graphik text-[clamp(28px,calc(2.2vw+8px),38px)] font-bold leading-[1.2] tracking-[-0.005em] text-ink"
            >
              Pick up where you left off
            </h2>
          </div>
          <ArrowLink href="/history">Watch history</ArrowLink>
        </div>

        <Rail grid="min-[641px]:grid-cols-2 min-[901px]:grid-cols-3" gap="gap-6 max-[640px]:gap-4">
          {items.slice(0, 3).map((item, index) => (
            <HistoryCard key={item?.match_id ?? index} item={item} />
          ))}
        </Rail>
      </Container>
    </section>
  );
}
