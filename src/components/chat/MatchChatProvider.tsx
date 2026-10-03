"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

import { useSpoilers } from "@/components/spoiler/SpoilerProvider";
import { fetchMatchComments } from "@/lib/api/endpoints";
import type { MatchComment } from "@/lib/api/types";

// Contract §6.2: poll comments about every 5s, never faster.
const POLL_MS = 5_000;
const KEEP = 30;

function merge(incoming: MatchComment[], previous: MatchComment[]): MatchComment[] {
  const known = new Set(previous.map((comment) => comment?.id));
  const fresh = incoming.filter((comment) => comment?.id && !known.has(comment.id));
  return fresh.length > 0 ? [...fresh, ...previous].slice(0, KEEP) : previous;
}

interface MatchChatValue {
  matchId: string;
  /** Newest first. */
  comments: MatchComment[];
  total: number | null;
  loaded: boolean;
  /** False while scores are hidden for this match: the chat can mention them. */
  visible: boolean;
  addComment: (comment: MatchComment) => void;
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

  const poll = useCallback(async () => {
    try {
      const response = await fetchMatchComments(matchId, cursor.current ?? undefined);
      setComments((previous) => merge(response?.data ?? [], previous));
      if (response?.meta?.next_cursor) cursor.current = response.meta.next_cursor;
      if (typeof response?.meta?.total === "number") setTotal(response.meta.total);
    } catch {
      // Keep what we have and try again on the next tick.
    } finally {
      setLoaded(true);
    }
  }, [matchId]);

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
    setComments((previous) => merge([comment], previous));
    setTotal((count) => (count == null ? count : count + 1));
  }

  return (
    <MatchChatContext.Provider value={{ matchId, comments, total, loaded, visible, addComment }}>
      {children}
    </MatchChatContext.Provider>
  );
}

