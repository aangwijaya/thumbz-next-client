"use client";

import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import Link from "next/link";

import { MatchListItem } from "@/components/match/MatchListItem";
import { useToast } from "@/components/ui/Toast";
import { deleteHistoryItem, fetchMyHistoryPage, queryKeys } from "@/lib/api/endpoints";
import type { ApiEnvelope, WatchHistoryItem } from "@/lib/api/types";
import { formatAge } from "@/lib/utils/format";
import { useSupabaseSession } from "@/lib/supabase/useSession";

type Pages = InfiniteData<ApiEnvelope<WatchHistoryItem[]>, number>;

const quietButton =
  "min-h-11 rounded-lg px-3 text-body-sm font-semibold text-pencil transition-colors hover:bg-cream hover:text-deep-ember focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember";

export function HistoryList() {
  const { session, ready } = useSupabaseSession();
  const queryClient = useQueryClient();
  const toast = useToast();
  const history = useInfiniteQuery({
    queryKey: queryKeys.myHistory(),
    queryFn: ({ pageParam, signal }) => fetchMyHistoryPage(session!.token, pageParam, signal),
    initialPageParam: 1,
    // Offset paging (contract §6.8): stop at the last page.
    getNextPageParam: (last) => {
      const meta = last?.meta;
      return meta && meta.page < meta.totalPages ? meta.page + 1 : undefined;
    },
    enabled: Boolean(session),
  });

  const remove = useMutation({
    mutationFn: (matchId: string) => deleteHistoryItem(matchId, session!.token),
    onMutate: async (matchId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.myHistory() });
      const previous = queryClient.getQueryData<Pages>(queryKeys.myHistory());
      queryClient.setQueryData<Pages>(queryKeys.myHistory(), (data) =>
        data
          ? { ...data, pages: data.pages.map((page) => ({ ...page, data: page.data.filter((row) => row.match_id !== matchId) })) }
          : data,
      );
      return { previous };
    },
    onError: (_error, _matchId, context) => {
      queryClient.setQueryData(queryKeys.myHistory(), context?.previous);
      toast("Could not remove it. Please try again.");
    },
  });

  if (!ready || history.isLoading) {
    return <div className="h-48 rounded-image bg-stone/30 motion-safe:animate-pulse" aria-hidden="true" />;
  }
  if (history.isError) {
    return <p role="alert" className="text-body text-pencil">We could not load your history. Refresh to try again.</p>;
  }
  const rows = history.data?.pages.flatMap((page) => page?.data ?? []) ?? [];
  if (rows.length === 0) {
    return (
      <p className="text-body text-pencil">
        Nothing watched yet. Matches you open appear here —{" "}
        <Link href="/live" className="font-semibold text-cobalt-link hover:underline">
          see what&apos;s live
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-col divide-y divide-stone border-y border-stone">
        {rows.map((item) => {
          const progress =
            item?.total_seconds && item.total_seconds > 0
              ? Math.min(100, Math.round(((item.duration_seconds ?? 0) / item.total_seconds) * 100))
              : null;
          return (
            <li key={item.match_id} className="flex flex-col gap-2 py-3">
              <MatchListItem match={item.match} />
              <div className="flex items-center gap-3 text-caption text-pencil">
                <span>Watched {formatAge(item.watched_at)}</span>
                {progress !== null ? (
                  <span className="flex flex-1 items-center gap-2">
                    <span
                      className="h-1 max-w-48 flex-1 overflow-hidden rounded-full bg-stone/60"
                      role="progressbar"
                      aria-label="Watched"
                      aria-valuenow={progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <span className="block h-full bg-ember-red" style={{ width: `${progress}%` }} />
                    </span>
                    <span className="tabular-nums">{progress}%</span>
                  </span>
                ) : (
                  <span className="flex-1" />
                )}
                <button type="button" className={quietButton} onClick={() => remove.mutate(item.match_id)}>
                  Remove<span className="sr-only"> from history</span>
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {history.hasNextPage ? (
        <button
          type="button"
          onClick={() => void history.fetchNextPage()}
          disabled={history.isFetchingNextPage}
          className="mx-auto inline-flex min-h-11 items-center rounded-lg border border-stone bg-paper px-5 text-body-sm font-semibold text-ink transition-colors hover:bg-cream disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember"
        >
          {history.isFetchingNextPage ? "Loading…" : "Load more"}
        </button>
      ) : null}
    </div>
  );
}
