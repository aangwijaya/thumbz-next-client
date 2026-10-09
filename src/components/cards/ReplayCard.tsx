import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Thumbnail } from "@/components/ui/Thumbnail";
import type { VideoSummary, VideoType } from "@/lib/api/types";
import { formatAge, formatDuration } from "@/lib/utils/format";

export const typeLabels: Record<
  VideoType,
  { label: string; tone: "ember" | "neutral" | "blue"; colors: string[] }
> = {
  highlight: {
    label: "Highlight",
    tone: "ember",
    colors: ["var(--color-ember-red)", "var(--color-charcoal)"],
  },
  replay: {
    label: "Full replay",
    tone: "neutral",
    colors: ["var(--color-teal-dusk)", "var(--color-charcoal)"],
  },
  vod: {
    label: "VOD",
    tone: "blue",
    colors: ["var(--color-cobalt-link)", "var(--color-charcoal)"],
  },
};

/** `priority` for cards in the first row: one of them is usually the LCP image. */
export function ReplayCard({
  video,
  priority = false,
  headingLevel = 3,
}: {
  video: VideoSummary;
  priority?: boolean;
  /** Keeps the outline valid: h3 under a section h2, h2 directly under the page h1. */
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const type = video?.type ? typeLabels[video.type] : undefined;
  // Protected replays play on their own page; others open the match or the source.
  const internal = Boolean(video?.media) || Boolean(video?.match_id);
  const external = !internal;
  const href = video?.media
    ? `/videos/${video.id}`
    : video?.match_id
      ? `/matches/${video.match_id}`
      : (video?.url ?? "#");
  const duration = formatDuration(video?.duration_seconds ?? 0);
  const published = formatAge(video?.published_at ?? "");

  return (
    <Link
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className="group flex flex-col gap-3 rounded-image max-[640px]:w-[280px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-deep-ember"
    >
      <Thumbnail
        src={video?.thumbnail_url}
        colors={type?.colors}
        sizes="(min-width: 1024px) 384px, (min-width: 640px) 50vw, 100vw"
        className="rounded-image"
        priority={priority}
      >
        {duration ? (
          <Badge tone="dark" className="absolute bottom-2.5 right-2.5">
            {duration}
          </Badge>
        ) : null}
      </Thumbnail>

      <div className="flex flex-wrap items-center gap-2 text-[13px] text-pencil">
        {type ? <Badge tone={type.tone}>{type.label}</Badge> : null}
        {video?.media ? <Badge tone="dark">Protected</Badge> : null}
        {published ? <span>{published}</span> : null}
      </div>
      <Heading className="text-pretty font-graphik text-[17px] font-bold leading-[1.35] text-ink transition-colors group-hover:text-deep-ember">
        {video?.title ?? "Untitled video"}
        {external ? <span className="sr-only"> (opens in a new tab)</span> : null}
      </Heading>
    </Link>
  );
}
