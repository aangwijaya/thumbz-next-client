"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

import { useSpoilers } from "@/components/spoiler/SpoilerProvider";
import { fetchMatchComments } from "@/lib/api/endpoints";
import { useRealtimeConnected, useRealtimeRoom } from "@/lib/realtime/hooks";
import type { MatchComment } from "@/lib/api/types";

import { appendOlder, mergeNewer, visibleComments } from "./comment-list";

// Contract §6.2: poll comments about every 5s, never faster. While the
// realtime channel is up, comments are pushed and polling is only a slow
// safety net.
const POLL_MS = 5_000;
const CONNECTED_POLL_MS = 60_000;
// A burst larger than one page is drained with immediate follow-up calls.
const MAX_CATCH_UP_CALLS = 5;

interface MatchChatValue {
  matchId: string;
  /** Newest first. */
  comments: MatchComment[];
  total: number | null;
  loaded: boolean;
  /** False while scores are hidden for this match: the chat can mention them. */
  visible: boolean;
  addComment: (comment: MatchComment) => void;
  /** Older comments exist beyond what is loaded. */
  hasOlder: boolean;
  loadingOlder: boolean;
  loadOlder: () => Promise<void>;
}

const MatchChatContext = createContext<MatchChatValue | null>(null);

export function useMatchChat(): MatchChatValue {
  const value = useContext(MatchChatContext);
  if (!value) throw new Error("useMatchChat must be used inside HeroChatProvider");
  return value;
}

// How often the held-back chat is re-checked so messages surface on time.
const DELAY_TICK_MS = 5_000;

// Polls a live match's comments once for every view of them on the page.
export function MatchChatProvider({
  matchId,
  live = true,
  delaySeconds = 0,
  children,
}: {
  matchId: string;
  /** Only live chats keep polling; others load once. */
  live?: boolean;
  /** Broadcast delay: other people's comments newer than this stay hidden. */
  delaySeconds?: number;
  children: React.ReactNode;
}) {
  const { isVisible } = useSpoilers();
  const visible = isVisible(matchId);
  const [comments, setComments] = useState<MatchComment[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const cursor = useRef<string | null>(null);
  const [olderCursor, setOlderCursor] = useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const initialized = useRef(false);
  const ownIds = useRef(new Set<string>());
  const [now, setNow] = useState(() => Date.now());
  // Real-time handlers compare against the latest list without re-subscribing.
  const commentsRef = useRef(comments);
  commentsRef.current = comments;

  const delayMs = live ? Math.max(0, delaySeconds * 1000) : 0;

  useEffect(() => {
    if (delayMs <= 0) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), DELAY_TICK_MS);
    return () => clearInterval(timer);
  }, [delayMs]);

  // Only other people's comments wait for the stream; own comments appear now.
  const shown = delayMs > 0 ? visibleComments(comments, now - delayMs, ownIds.current) : comments;

  const poll = useCallback(async () => {
    try {
      for (let call = 0; call < MAX_CATCH_UP_CALLS; call += 1) {
        const response = await fetchMatchComments(matchId, {
          after: cursor.current ?? undefined,
        });
        setComments((previous) => mergeNewer(response?.data ?? [], previous));
        if (response?.meta?.next_cursor) cursor.current = response.meta.next_cursor;
        if (typeof response?.meta?.total === "number") setTotal(response.meta.total);
        if (!initialized.current) {
          // The first (cursor-less) page tells us where older history starts.
          initialized.current = true;
          setOlderCursor(response?.meta?.prev_cursor ?? null);
        }
        if (!response?.meta?.has_more) break;
      }
    } catch {
      // Keep what we have and try again on the next tick.
    } finally {
      setLoaded(true);
    }
  }, [matchId]);

  const loadOlder = useCallback(async () => {
    if (!olderCursor || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const response = await fetchMatchComments(matchId, { before: olderCursor });
      setComments((previous) => appendOlder(response?.data ?? [], previous));
      setOlderCursor(response?.meta?.prev_cursor ?? null);
    } catch {
      // The button stays; the visitor can retry.
    } finally {
      setLoadingOlder(false);
    }
  }, [matchId, olderCursor, loadingOlder]);

  const connected = useRealtimeConnected();
  useRealtimeRoom(
    live ? `match:${matchId}` : null,
    {
      "comment:new": (data) => {
        const comment = data as MatchComment;
        // Our own POST is pushed back too: do not count it twice.
        const isNew = !comment?.id || !commentsRef.current.some((item) => item?.id === comment.id);
        setComments((previous) => mergeNewer([comment], previous));
        if (comment?.id && isNew) setTotal((count) => (count == null ? count : count + 1));
      },
      "comment:deleted": (data) => {
        const id = (data as { id?: string })?.id;
        setComments((previous) => previous.filter((comment) => comment?.id !== id));
      },
    },
    // Missed pushes: catch up from the cursor.
    () => void poll(),
  );

  // The chat is covered while scores are hidden, so it does not poll then.
  useEffect(() => {
    if (!visible) return;
    poll();
    if (!live) return;
    const timer = setInterval(
      () => {
        if (!document.hidden) poll();
      },
      connected ? CONNECTED_POLL_MS : POLL_MS,
    );
    return () => clearInterval(timer);
  }, [poll, visible, live, connected]);

  function addComment(comment: MatchComment) {
    if (comment?.id) ownIds.current.add(comment.id);
    setComments((previous) => mergeNewer([comment], previous));
    setTotal((count) => (count == null ? count : count + 1));
  }

  return (
    <MatchChatContext.Provider
      value={{
        matchId,
        comments: shown,
        total,
        loaded,
        visible,
        addComment,
        hasOlder: olderCursor !== null,
        loadingOlder,
        loadOlder,
      }}
    >
      {children}
    </MatchChatContext.Provider>
  );
}

