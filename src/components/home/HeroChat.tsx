"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

import { RevealButton } from "@/components/spoiler/Spoiler";
import { useSpoilers } from "@/components/spoiler/SpoilerProvider";
import { useToast } from "@/components/ui/Toast";
import { fetchMatchComments, postMatchComment } from "@/lib/api/endpoints";
import { isApiError } from "@/lib/api/errors";
import type { MatchComment } from "@/lib/api/types";
import { useSupabaseSession } from "@/lib/supabase/useSession";

// Contract §6.2: poll comments about every 5s, never faster.
const POLL_MS = 5_000;
const KEEP = 30;
const SHOWN = 9;

function merge(incoming: MatchComment[], previous: MatchComment[]): MatchComment[] {
  const known = new Set(previous.map((comment) => comment?.id));
  const fresh = incoming.filter((comment) => comment?.id && !known.has(comment.id));
  return fresh.length > 0 ? [...fresh, ...previous].slice(0, KEEP) : previous;
}

interface HeroChatValue {
  matchId: string;
  /** Newest first. */
  comments: MatchComment[];
  total: number | null;
  loaded: boolean;
  /** False while scores are hidden for this match: the chat can mention them. */
  visible: boolean;
  addComment: (comment: MatchComment) => void;
}

const HeroChatContext = createContext<HeroChatValue | null>(null);

function useHeroChat(): HeroChatValue {
  const value = useContext(HeroChatContext);
  if (!value) throw new Error("useHeroChat must be used inside HeroChatProvider");
  return value;
}

// Polls the featured match's chat once for both views: the phone next to the
// player on desktop and the one-line ticker under it on phones.
export function HeroChatProvider({
  matchId,
  children,
}: {
  matchId: string;
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
    const timer = setInterval(() => {
      if (!document.hidden) poll();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [poll, visible]);

  function addComment(comment: MatchComment) {
    setComments((previous) => merge([comment], previous));
    setTotal((count) => (count == null ? count : count + 1));
  }

  return (
    <HeroChatContext.Provider value={{ matchId, comments, total, loaded, visible, addComment }}>
      {children}
    </HeroChatContext.Provider>
  );
}

// Desktop: the chat as a phone overlapping the player's lower right corner.
export function HeroChatPhone() {
  const { matchId, comments, total, loaded, visible, addComment } = useHeroChat();
  const { session } = useSupabaseSession();
  const toast = useToast();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!session || body.length === 0 || sending) return;
    setSending(true);
    try {
      addComment(await postMatchComment(matchId, body, session.token));
      setDraft("");
    } catch (error) {
      const status = isApiError(error) ? error.status : 0;
      toast(
        status === 429
          ? "Slow down: one comment every few seconds."
          : status === 401
            ? "Your session expired. Please log in again."
            : status === 422
              ? "Comments are open while the match is live."
              : "Could not send your comment. Try again.",
      );
    } finally {
      setSending(false);
    }
  }

  // Newest last, like a chat.
  const shown = comments.slice(0, SHOWN).reverse();

  return (
    <section
      aria-label="Live chat"
      className="relative z-[3] col-span-full row-start-1 mt-[calc((100%-var(--off))*0.29)] w-[204px] self-start justify-self-end rounded-[26px] border border-stone bg-paper p-[7px] shadow-button max-[1080px]:w-[184px] max-[900px]:hidden"
    >
      <div className="flex flex-col overflow-hidden rounded-[20px] border border-stone/50">
        <div className="flex items-baseline justify-between gap-2 border-b border-stone/50 px-3 pb-2.5 pt-3">
          <b className="whitespace-nowrap font-graphik text-sm font-bold">Live chat</b>
          {total != null ? (
            <span className="whitespace-nowrap text-[11px] text-pencil">{total} comments</span>
          ) : null}
        </div>

        {visible ? (
          <ul
            aria-live="off"
            className="flex h-[212px] flex-col justify-end gap-[7px] overflow-hidden px-3 py-2 text-xs leading-[1.35] max-[1080px]:h-[188px]"
          >
            {shown.length === 0 ? (
              <li className="text-center text-pencil">
                {loaded ? "No comments yet. Start the conversation." : "Loading chat…"}
              </li>
            ) : (
              shown.map((comment) => (
                <li key={comment?.id} className="motion-safe:animate-msg">
                  <b
                    className={`mr-1 font-semibold ${
                      session && comment?.user_id === session.userId
                        ? "text-deep-ember"
                        : "text-ink"
                    }`}
                  >
                    {comment?.author_name ?? "User"}
                  </b>
                  {comment?.body ?? ""}
                </li>
              ))
            )}
          </ul>
        ) : (
          <div className="flex h-[212px] flex-col items-center justify-center gap-2.5 p-4 text-center text-xs leading-snug text-pencil max-[1080px]:h-[188px]">
            <span>Chat is hidden because it can mention the score.</span>
            <RevealButton matchId={matchId}>Show chat and score</RevealButton>
          </div>
        )}

        <div className="border-t border-stone/50 p-2">
          {session ? (
            <form onSubmit={handleSend} className="flex gap-1.5">
              <label htmlFor="hero-chat-input" className="sr-only">
                Write a comment
              </label>
              <input
                id="hero-chat-input"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={280}
                placeholder="Say something…"
                autoComplete="off"
                className="min-w-0 flex-1 rounded-lg border border-stone bg-paper px-[9px] py-[7px] text-xs placeholder:text-pencil focus:border-deep-ember focus:outline-none"
              />
              <button
                type="submit"
                disabled={sending || draft.trim().length === 0}
                className="rounded-lg bg-ink/5 px-2.5 text-xs font-semibold text-ink transition-colors hover:bg-ink/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember disabled:pointer-events-none disabled:opacity-50"
              >
                Send
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="block rounded-lg border border-dashed border-stone py-2 text-center text-xs font-semibold text-cobalt-link transition-colors hover:border-cobalt-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember"
            >
              Log in to chat
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

// Phones: the newest message on one line under the player.
export function HeroChatTicker() {
  const { matchId, comments, total, loaded, visible } = useHeroChat();
  const latest = comments[0];

  return (
    <div className="flex items-center gap-2.5 border-t border-stone/50 px-3 py-2.5 text-[13px] leading-[1.3] min-[901px]:hidden">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
        className="size-4 shrink-0 text-pencil"
      >
        <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12z" />
      </svg>
      <p className="min-w-0 flex-1 truncate text-charcoal">
        {!visible ? (
          "Chat is hidden with the scores"
        ) : latest ? (
          <>
            <b className="mr-1 font-semibold text-ink">{latest?.author_name ?? "User"}</b>
            {latest?.body ?? ""}
          </>
        ) : loaded ? (
          "No comments yet"
        ) : (
          "Loading chat…"
        )}
      </p>
      <Link
        href={`/matches/${matchId}`}
        className="shrink-0 rounded-lg font-semibold text-cobalt-link hover:underline hover:underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember"
      >
        {total != null ? `${total} comments` : "Open chat"}
      </Link>
    </div>
  );
}
