"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  deleteMatchComment,
  fetchMatchComments,
  postMatchComment,
} from "@/lib/api/endpoints";
import { isApiError } from "@/lib/api/errors";
import type { MatchComment } from "@/lib/api/types";
import { useSupabaseSession } from "@/lib/supabase/useSession";
import { formatRelativeTime, initialsOf } from "@/lib/utils/format";

import { LiveIndicator } from "../ui/LiveIndicator";

const POLL_MS = 5_000;
const MAX_BODY = 280;

const AVATAR_COLORS = ["#ff9473", "#a0b5eb", "#a7fccd", "#ecda98"];

interface LiveCommentPanelProps {
  matchId: string;
  live: boolean;
  className?: string;
}

function avatarColor(name: string): string {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? "#a0b5eb";
}

function CommentAvatar({ name }: { name: string }) {
  const color = avatarColor(name);
  return (
    <span
      aria-hidden="true"
      className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-[10px]"
      style={{ backgroundColor: `${color}26`, color }}
    >
      {initialsOf(name)}
    </span>
  );
}

export function LiveCommentPanel({ matchId, live, className = "" }: LiveCommentPanelProps) {
  const { session } = useSupabaseSession();
  const [comments, setComments] = useState<MatchComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [hasNew, setHasNew] = useState(false);

  const cursorRef = useRef<string | null>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const atTopRef = useRef(true);

  const prepend = useCallback((incoming: MatchComment[]) => {
    if (incoming.length === 0) return;
    setComments((previous) => {
      const known = new Set(previous.map((comment) => comment?.id));
      const fresh = incoming.filter((comment) => comment?.id && !known.has(comment.id));
      return fresh.length > 0 ? [...fresh, ...previous] : previous;
    });
    if (!atTopRef.current) setHasNew(true);
    else listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const poll = useCallback(async () => {
    try {
      const response = await fetchMatchComments(matchId, cursorRef.current ?? undefined);
      prepend(response?.data ?? []);
      if (response?.meta?.next_cursor) cursorRef.current = response.meta.next_cursor;
      setError(null);
    } catch (pollError) {
      setError(isApiError(pollError) ? pollError.message : "Comments unavailable");
    } finally {
      setLoading(false);
    }
  }, [matchId, prepend]);

  useEffect(() => {
    setLoading(true);
    poll();
    if (!live) return;
    const timer = setInterval(() => {
      if (document.hidden) return;
      poll();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [poll, live]);

  function handleScroll() {
    const element = listRef.current;
    if (!element) return;
    atTopRef.current = element.scrollTop < 40;
    if (atTopRef.current) setHasNew(false);
  }

  async function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!session || body.length === 0 || body.length > MAX_BODY || sending) return;
    setSending(true);
    setNotice(null);
    try {
      const created = await postMatchComment(matchId, body, session.token);
      prepend([created]);
      if (created?.created_at) cursorRef.current = cursorRef.current ?? created.created_at;
      setDraft("");
    } catch (sendError) {
      if (isApiError(sendError) && sendError.status === 429) {
        setNotice("Slow down — one comment every few seconds.");
      } else if (isApiError(sendError) && sendError.status === 401) {
        setNotice("Session expired — please sign in again.");
      } else if (isApiError(sendError) && sendError.status === 422) {
        setNotice("Comments open while the match is live.");
      } else {
        setNotice("Could not send your comment. Try again.");
      }
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(commentId: string) {
    if (!session) return;
    setComments((previous) => previous.filter((comment) => comment?.id !== commentId));
    try {
      await deleteMatchComment(commentId, session.token);
    } catch {
      poll();
    }
  }

  return (
    <aside
      className={`flex flex-col rounded-xl border border-page-dark-border bg-page-dark-surface ${className}`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-page-dark-border p-4 sm:px-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-secondary">
          Live comments
        </p>
        {live ? <LiveIndicator /> : null}
      </div>

      <div className="relative flex-1">
        <ol
          ref={listRef}
          onScroll={handleScroll}
          className="flex max-h-80 flex-col gap-4 overflow-y-auto p-4 sm:px-5"
        >
          {loading ? (
            <li className="py-8 text-center font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
              Loading comments…
            </li>
          ) : comments.length === 0 ? (
            <li className="py-8 text-center text-sm text-text-secondary">
              {error ?? "No comments yet — start the conversation."}
            </li>
          ) : (
            comments.map((comment) => (
              <li key={comment?.id} className="group flex gap-3">
                <CommentAvatar name={comment?.author_name ?? "?"} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-semibold">
                      {comment?.author_name ?? "User"}
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="font-mono text-[10px] text-text-secondary">
                        {formatRelativeTime(comment?.created_at ?? "")}
                      </span>
                      {session && comment?.user_id === session.userId ? (
                        <button
                          type="button"
                          onClick={() => handleDelete(comment?.id ?? "")}
                          aria-label="Delete your comment"
                          className="text-text-secondary opacity-0 transition-opacity hover:text-error focus-visible:opacity-100 group-hover:opacity-100"
                        >
                          ×
                        </button>
                      ) : null}
                    </span>
                  </p>
                  <p className="mt-0.5 break-words text-sm text-text-secondary">
                    {comment?.body ?? ""}
                  </p>
                </div>
              </li>
            ))
          )}
        </ol>

        {hasNew ? (
          <button
            type="button"
            onClick={() => {
              listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
              setHasNew(false);
            }}
            className="absolute inset-x-0 bottom-3 mx-auto flex w-fit items-center gap-1.5 rounded-full border border-page-dark-border bg-page-dark-surface px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-text-primary shadow-sm transition-colors hover:border-text-secondary"
          >
            ↓ New comments
          </button>
        ) : null}
      </div>

      <div className="border-t border-page-dark-border p-4 sm:px-5">
        {session ? (
          live ? (
            <form onSubmit={handleSend} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  maxLength={MAX_BODY}
                  placeholder="Write a comment…"
                  aria-label="Write a comment"
                  className="min-w-0 flex-1 rounded-full border border-page-dark-border bg-page-dark px-4 py-2 text-sm placeholder:text-text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
                />
                <button
                  type="submit"
                  disabled={sending || draft.trim().length === 0}
                  className="shrink-0 rounded-full bg-text-primary px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-widest text-background transition-colors hover:bg-text-primary/90 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
                >
                  Send
                </button>
              </div>
              {notice ? <p className="text-xs text-warning">{notice}</p> : null}
            </form>
          ) : (
            <p className="text-center font-mono text-[11px] uppercase tracking-[0.16em] text-text-secondary">
              Comments open while the match is live
            </p>
          )
        ) : (
          <Link
            href={`/login?next=${encodeURIComponent(`/matches/${matchId}`)}`}
            className="flex items-center justify-center rounded-full bg-text-primary px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-widest text-background transition-colors hover:bg-text-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
          >
            Log in to comment
          </Link>
        )}
      </div>

      {error && comments.length > 0 ? (
        <p className="border-t border-page-dark-border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-warning sm:px-5">
          Reconnecting…
        </p>
      ) : null}
    </aside>
  );
}
