"use client";

import { useState } from "react";

import { useMatchChat } from "@/components/chat/MatchChatProvider";
import { useToast } from "@/components/ui/Toast";
import { postMatchComment } from "@/lib/api/endpoints";
import { isApiError } from "@/lib/api/errors";
import { useSupabaseSession } from "@/lib/supabase/useSession";

function sendErrorMessage(error: unknown): string {
  switch (isApiError(error) ? error.status : 0) {
    case 429:
      return "Slow down: one comment every few seconds.";
    case 401:
      return "Your session expired. Please log in again.";
    case 422:
      return "Comments are open while the match is live.";
    default:
      return "Could not send your comment. Try again.";
  }
}

/** Draft + send state for a live chat input, shared by every chat surface. */
export function useCommentComposer() {
  const { matchId, addComment } = useMatchChat();
  const { session } = useSupabaseSession();
  const toast = useToast();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!session || body.length === 0 || sending) return;
    setSending(true);
    try {
      addComment(await postMatchComment(matchId, body, session.token));
      setDraft("");
    } catch (error) {
      toast(sendErrorMessage(error));
    } finally {
      setSending(false);
    }
  }

  return { session, draft, setDraft, sending, canSend: !sending && draft.trim().length > 0, send };
}
