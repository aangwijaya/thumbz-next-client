import type { Metadata } from "next";

import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChips } from "@/components/ui/FilterChips";
import { PageHeader } from "@/components/ui/PageHeader";
import { VideoFeed } from "@/components/video/VideoFeed";
import { apiFetch } from "@/lib/api/client";
import { query } from "@/lib/api/server";
import type { CursorEnvelope, VideoSummary, VideoType } from "@/lib/api/types";
import { enumParam, hrefWith, type SearchParamsRecord } from "@/lib/utils/search-params";

/** Small pages: the demo has one week of replays, and the feed should still page. */
const PAGE_SIZE = 4;

const TYPES = ["highlight", "replay", "vod"] as const satisfies readonly VideoType[];
const TYPE_LABELS: Record<VideoType, string> = {
  highlight: "Highlights",
  replay: "Full replays",
  vod: "VODs",
};

export const metadata: Metadata = {
  title: "Replays & highlights",
  description: "Full match replays, highlights and VODs from Mobile Legends esports.",
  alternates: { canonical: "/videos" },
};

export default async function VideosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsRecord>;
}) {
  const type = enumParam(await searchParams, "type", TYPES);
  const first = await apiFetch<CursorEnvelope<VideoSummary[]>>(
    `/videos${query({ type, pageSize: PAGE_SIZE })}`,
    { next: { revalidate: 60, tags: ["catalog"] } },
  );

  return (
    <div className="flex-1 bg-paper">
      <Container size="page" className="flex flex-col gap-8 py-10 min-[801px]:py-14">
        <PageHeader
          eyebrow="Watch back"
          title="Replays & highlights"
          description="Every game, in full or in two minutes. Keep scrolling: more load as you go."
        />
        <FilterChips
          label="Video type"
          chips={[
            { label: "All", href: "/videos", active: !type },
            ...TYPES.map((value) => ({
              label: TYPE_LABELS[value],
              href: hrefWith("/videos", {}, { type: value }),
              active: type === value,
            })),
          ]}
        />
        {(first?.data?.length ?? 0) === 0 ? (
          <EmptyState title="No videos yet" description="Replays appear here after each match." />
        ) : (
          // Keyed by type so switching filters starts a fresh feed.
          <VideoFeed key={type ?? "all"} initial={first} type={type} pageSize={PAGE_SIZE} />
        )}
      </Container>
    </div>
  );
}
