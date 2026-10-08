"use client";

import Link from "next/link";

import { useMatchChat } from "@/components/chat/MatchChatProvider";
import { useCommentComposer } from "@/components/chat/useCommentComposer";
import { RevealButton } from "@/components/spoiler/Spoiler";

// Name colors, all readable on paper. Picked from the author name so a
// person keeps their color.
const NAME_COLORS = ["text-[#0f66ae]", "text-[#446c3d]", "text-[#b42d1b]", "text-[#6b4fbb]", "text-[#2f6f70]"];

function nameColor(name: string): string {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return NAME_COLORS[hash % NAME_COLORS.length];
}

export function MatchChat({ live }: { live: boolean }) {
  const { matchId, comments, loaded, visible } = useMatchChat();
  const { session, draft, setDraft, sending, send } = useCommentComposer();

  // Newest last, like a chat.
  const shown = comments.slice(0, 30).reverse();

  return (
    <>
      {visible ? (
        <ul
          aria-live="off"
          className="flex h-[440px] min-h-0 flex-col justify-end gap-2.5 overflow-hidden px-5 py-3.5 text-sm leading-[1.45] min-[641px]:px-6 min-[901px]:h-auto min-[901px]:flex-1 min-[901px]:px-4"
        >
          {shown.length === 0 ? (
            <li className="text-center text-pencil">
              {loaded ? "No comments yet. Start the conversation." : "Loading chat…"}
            </li>
          ) : (
            shown.map((comment) => (
              <li key={comment?.id} className="motion-safe:animate-msg">
                <b
                  className={`mr-1.5 font-semibold ${
                    session && comment?.user_id === session.userId
                      ? "text-deep-ember"
                      : nameColor(comment?.author_name ?? "")
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
        <div className="flex min-h-[360px] flex-1 flex-col items-center justify-center gap-2.5 p-6 text-center text-[13px] text-pencil">
          <b className="font-graphik text-base text-ink">Chat is hidden</b>
          <span>Messages can mention the score.</span>
          <RevealButton matchId={matchId}>Show chat and score</RevealButton>
        </div>
      )}

      <div className="shrink-0 border-t border-stone/50 px-5 py-3 min-[641px]:px-6 min-[901px]:px-3">
        {!live ? (
          <p className="py-2 text-center text-[13px] text-pencil">Chat opens when the match goes live.</p>
        ) : session ? (
          <form onSubmit={send}>
            <div className="flex gap-2">
              <label htmlFor="match-chat-input" className="sr-only">
                Write a comment
              </label>
              <input
                id="match-chat-input"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={280}
                placeholder="Say something…"
                autoComplete="off"
                className="min-h-11 min-w-0 flex-1 rounded-lg border border-stone bg-paper px-3 text-sm placeholder:text-pencil focus:border-deep-ember focus:outline-none"
              />
              <button
                type="submit"
                disabled={sending || draft.trim().length === 0}
                className="min-h-11 rounded-lg bg-deep-ember px-4 text-[15px] font-semibold text-paper transition-colors hover:bg-[#b42d1b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-50"
              >
                Send
              </button>
            </div>
            <p className="mt-2 text-caption text-pencil">Slow mode: one message every few seconds</p>
          </form>
        ) : (
          <Link
            href={`/login?next=/matches/${matchId}`}
            className="flex min-h-11 items-center justify-center rounded-lg border border-stone text-[15px] font-semibold text-ink transition-colors hover:border-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember"
          >
            Log in to chat
          </Link>
        )}
      </div>
    </>
  );
}
