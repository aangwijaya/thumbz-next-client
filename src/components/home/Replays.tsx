import Link from "next/link";

import { SpoilerToggle } from "@/components/spoiler/SpoilerToggle";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { Rail } from "@/components/ui/Rail";
import { Thumbnail } from "@/components/ui/Thumbnail";
import type { VideoSummary, VideoType } from "@/lib/api/types";
import { formatAge, formatDuration } from "@/lib/utils/format";

interface ReplaysProps {
  videos: VideoSummary[];
}

const typeLabels: Record<
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

function ReplayCard({ video }: { video: VideoSummary }) {
  const type = video?.type ? typeLabels[video.type] : undefined;
  const external = !video?.match_id;
  const href = video?.match_id ? `/matches/${video.match_id}` : (video?.url ?? "#");
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
      >
        {duration ? (
          <Badge tone="dark" className="absolute bottom-2.5 right-2.5">
            {duration}
          </Badge>
        ) : null}
      </Thumbnail>

      <div className="flex flex-wrap items-center gap-2 text-[13px] text-pencil">
        {type ? <Badge tone={type.tone}>{type.label}</Badge> : null}
        {published ? <span>{published}</span> : null}
      </div>
      <h3 className="text-pretty font-graphik text-[17px] font-bold leading-[1.35] text-ink transition-colors group-hover:text-deep-ember">
        {video?.title ?? "Untitled video"}
        {external ? <span className="sr-only"> (opens in a new tab)</span> : null}
      </h3>
    </Link>
  );
}

export function Replays({ videos }: ReplaysProps) {
  return (
    <section
      id="replays"
      aria-labelledby="replays-title"
      className="scroll-mt-24 py-[clamp(32px,4vw,48px)]"
    >
      <Container size="page">
        <div className="mb-6 flex flex-col items-start gap-4 min-[641px]:mb-8 min-[641px]:flex-row min-[641px]:flex-wrap min-[641px]:items-end min-[641px]:justify-between">
          <div className="flex flex-col gap-4">
            <p className="-mb-2 text-caption font-semibold text-deep-ember">Replays</p>
            <h2
              id="replays-title"
              className="text-balance font-graphik text-[clamp(28px,calc(2.2vw+8px),38px)] font-bold leading-[1.2] tracking-[-0.005em] text-ink"
            >
              Missed a match? Watch it back
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <SpoilerToggle variant="switch" />
            <ArrowLink href="/matches?status=completed">Browse all replays</ArrowLink>
          </div>
        </div>

        <Rail
          grid="min-[641px]:grid-cols-2 min-[901px]:grid-cols-3"
          gap="gap-x-6 gap-y-8 max-[640px]:gap-4"
        >
          {videos.slice(0, 6).map((video, index) => (
            <ReplayCard key={video?.id ?? index} video={video} />
          ))}
        </Rail>
      </Container>
    </section>
  );
}
