"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

import { useSpoilers } from "@/components/spoiler/SpoilerProvider";
import { fetchMatchComments } from "@/lib/api/endpoints";
import type { MatchComment } from "@/lib/api/types";

import { appendOlder, mergeNewer } from "./comment-list";

// Contract §6.2: poll comments about every 5s, never faster.
const POLL_MS = 5_000;
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

// Polls a live match's comments once for every view of them on the page.
export function MatchChatProvider({
  matchId,
  live = true,
  children,
}: {
  matchId: string;
  /** Only live chats keep polling; others load once. */
  live?: boolean;
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

  // The chat is covered while scores are hidden, so it does not poll then.
  useEffect(() => {
    if (!visible) return;
    poll();
    if (!live) return;
    const timer = setInterval(() => {
      if (!document.hidden) poll();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [poll, visible, live]);

  function addComment(comment: MatchComment) {
    setComments((previous) => mergeNewer([comment], previous));
    setTotal((count) => (count == null ? count : count + 1));
  }

  return (
    <MatchChatContext.Provider
      value={{
        matchId,
        comments,
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

