"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { ReplayCard } from "@/components/cards/ReplayCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { fetchVideoPage, queryKeys } from "@/lib/api/endpoints";
import type { CursorEnvelope, VideoSummary, VideoType } from "@/lib/api/types";
import { useInView } from "@/lib/hooks/useInView";

const PAGE_SIZE = 12;

interface VideoFeedProps {
  /** First page, rendered on the server (offset page 1 also carries next_cursor). */
  initial: CursorEnvelope<VideoSummary[]>;
  type?: VideoType;
}

const buttonClass =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-stone bg-paper px-5 font-graphik text-body-sm font-semibold text-ink transition-colors hover:bg-cream disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember";

/**
 * Infinite replay feed: keyset pages load as the sentinel nears the viewport.
 * The "Load more" button stays for keyboard/screen-reader users and as a
 * fallback. Pages live in the query cache, so returning via the back button
 * restores the whole list (and with it the scroll position).
 */
export function VideoFeed({ initial, type }: VideoFeedProps) {
  const feed = useInfiniteQuery({
    queryKey: queryKeys.videoFeed(type),
    queryFn: ({ pageParam, signal }) =>
      fetchVideoPage({ type, cursor: pageParam, pageSize: PAGE_SIZE }, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => (last?.meta?.has_more ? last.meta.next_cursor : undefined),
    initialData: { pages: [initial], pageParams: [null] },
    staleTime: 60_000,
  });

  const { ref, inView } = useInView<HTMLDivElement>();
  const { hasNextPage, isFetchingNextPage, isError, fetchNextPage } = feed;

  useEffect(() => {
    // Stop auto-loading after an error so a failing API is not hammered;
    // the button lets the visitor retry.
    if (inView && hasNextPage && !isFetchingNextPage && !isError) {
      void fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, isError, fetchNextPage]);

  const videos = feed.data?.pages.flatMap((page) => page?.data ?? []) ?? [];
  const loadedPages = feed.data?.pages.length ?? 1;

  return (
    <div className="flex flex-col gap-10">
      <ul className="grid gap-x-6 gap-y-10 min-[641px]:grid-cols-2 min-[901px]:grid-cols-3">
        {videos.map((video, index) => (
          // content-visibility skips layout/paint for off-screen cards in long feeds.
          <li key={video?.id} className="[contain-intrinsic-size:auto_360px] [content-visibility:auto]">
            {/* First row (up to 3 columns) is above the fold: load it eagerly. */}
            <ReplayCard video={video} priority={index < 3} headingLevel={2} />
          </li>
        ))}
        {isFetchingNextPage
          ? Array.from({ length: 3 }, (_, index) => (
              <li key={`skeleton-${index}`} className="flex flex-col gap-3" aria-hidden="true">
                <Skeleton variant="media" bg="bg-stone/40" className="rounded-image" />
                <Skeleton bg="bg-stone/40" className="w-1/3" />
                <Skeleton bg="bg-stone/40" className="w-4/5" />
              </li>
            ))
          : null}
      </ul>

      <p aria-live="polite" className="sr-only">
        {loadedPages > 1 ? `${videos.length} replays loaded` : ""}
      </p>

      <div ref={ref} className="flex flex-col items-center gap-3 pb-4">
        {isError ? (
          <>
            <p className="text-body-sm text-pencil">Could not load more replays.</p>
            <button type="button" onClick={() => void fetchNextPage()} className={buttonClass}>
              Try again
            </button>
          </>
        ) : hasNextPage ? (
          <button
            type="button"
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
            className={buttonClass}
          >
            {isFetchingNextPage ? "Loading…" : "Load more replays"}
          </button>
        ) : videos.length > 0 ? (
          <p className="text-body-sm text-pencil">You have reached the end.</p>
        ) : null}
      </div>
    </div>
  );
}
