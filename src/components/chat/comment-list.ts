import type { MatchComment } from "@/lib/api/types";

/** In-memory cap: enough scroll-back for a long match without unbounded growth. */
export const MAX_COMMENTS = 300;

/** Newest-first list with `incoming` merged in by id (new on top). */
export function mergeNewer(incoming: MatchComment[], previous: MatchComment[]): MatchComment[] {
  const known = new Set(previous.map((comment) => comment?.id));
  const fresh = incoming.filter((comment) => comment?.id && !known.has(comment.id));
  return fresh.length > 0 ? [...fresh, ...previous].slice(0, MAX_COMMENTS) : previous;
}

/** Older comments appended at the end (they arrive newest first too). */
export function appendOlder(older: MatchComment[], previous: MatchComment[]): MatchComment[] {
  const known = new Set(previous.map((comment) => comment?.id));
  const fresh = older.filter((comment) => comment?.id && !known.has(comment.id));
  return fresh.length > 0 ? [...previous, ...fresh] : previous;
}
