"use client";

import Link from "next/link";

import { useMatchChat } from "@/components/chat/MatchChatProvider";
import { useCommentComposer } from "@/components/chat/useCommentComposer";

import { RevealButton } from "@/components/spoiler/Spoiler";

// Desktop: the chat as a phone overlapping the player's lower right corner.
export { MatchChatProvider as HeroChatProvider } from "@/components/chat/MatchChatProvider";

export function HeroChatPhone() {
  const { matchId, comments, total, loaded, visible } = useMatchChat();
  const { session, draft, setDraft, sending, send } = useCommentComposer();

  // Newest last, like a chat.
  const shown = comments.slice(0, 9).reverse();

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
            <form onSubmit={send} className="flex gap-1.5">
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
  const { matchId, comments, total, loaded, visible } = useMatchChat();
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
