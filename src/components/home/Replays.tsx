
import { SpoilerToggle } from "@/components/spoiler/SpoilerToggle";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Container } from "@/components/ui/Container";
import { Rail } from "@/components/ui/Rail";
import { ReplayCard } from "@/components/cards/ReplayCard";
import type { VideoSummary } from "@/lib/api/types";

interface ReplaysProps {
  videos: VideoSummary[];
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
