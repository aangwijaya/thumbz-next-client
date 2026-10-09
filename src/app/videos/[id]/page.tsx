import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";

import { typeLabels } from "@/components/cards/ReplayCard";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { ProtectedVideoPlayer } from "@/components/video/ProtectedVideoPlayer";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { getOrNotFound } from "@/lib/api/server";
import type { VideoSummary } from "@/lib/api/types";
import { formatAge, formatDuration } from "@/lib/utils/format";

type Props = { params: Promise<{ id: string }> };

// ISR: the page shell is public and cacheable; the session, keys and
// manifests are per viewer and fetched by the player in the browser.
export const revalidate = 60;
export function generateStaticParams() {
  return [];
}

const getVideo = cache((id: string) =>
  getOrNotFound<VideoSummary>(`/videos/${id}`, { revalidate: 60, tags: [`video:${id}`, "catalog"] }),
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const video = await getVideo((await params).id);
  return {
    title: video?.title ?? "Video",
    description: `${video?.type ? typeLabels[video.type].label : "Video"} — ${video?.title ?? ""}`,
    alternates: { canonical: `/videos/${video?.id}` },
    openGraph: video?.thumbnail_url ? { images: [video.thumbnail_url] } : undefined,
  };
}

export default async function VideoPage({ params }: Props) {
  const video = await getVideo((await params).id);
  const type = video?.type ? typeLabels[video.type] : undefined;
  const duration = formatDuration(video?.duration_seconds ?? 0);
  const published = formatAge(video?.published_at ?? "");
  const isProtected = Boolean(video?.media && video.media.protection !== "none");

  return (
    <div className="flex-1 bg-paper">
      <Container size="page" className="flex flex-col gap-5 py-8 min-[801px]:py-12">
        <Link
          href="/videos"
          className="w-fit rounded-lg text-[15px] font-medium text-cobalt-link hover:underline hover:underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember"
        >
          <span aria-hidden="true">←</span> All replays
        </Link>
        {isProtected && video?.media ? (
          <ProtectedVideoPlayer
            assetId={video.media.id}
            title={video.title}
            poster={video.thumbnail_url}
            colors={type?.colors}
            className="rounded-image"
          />
        ) : (
          <VideoPlayer streamUrl={video?.url ?? null} poster={video?.thumbnail_url} title={video?.title ?? ""} colors={type?.colors} className="rounded-image" />
        )}
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-pencil">
          {type ? <Badge tone={type.tone}>{type.label}</Badge> : null}
          {isProtected ? <Badge tone="dark">Protected</Badge> : null}
          {duration ? <span>{duration}</span> : null}
          {published ? <span>· {published}</span> : null}
        </div>
        <h1 className="text-pretty font-graphik text-[clamp(26px,calc(1.8vw+12px),38px)] font-bold leading-[1.2] text-ink">
          {video?.title}
        </h1>
        {video?.match_id ? (
          <Link href={`/matches/${video.match_id}`} className="w-fit text-body-sm font-semibold text-cobalt-link hover:underline">
            Match centre, stats and chat
          </Link>
        ) : null}
        {isProtected ? (
          <p className="max-w-2xl text-body-sm text-pencil">
            This replay is encrypted end to end. Keys are released per session to signed-in viewers, and an account can
            stream on up to two devices at once.
          </p>
        ) : null}
      </Container>
    </div>
  );
}
