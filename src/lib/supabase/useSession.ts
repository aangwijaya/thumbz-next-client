"use client";

import { useEffect, useMemo, useState } from "react";

import { createClient } from "./client";

export interface ClientSession {
  userId: string;
  token: string;
}

export function useSupabaseSession(): { session: ClientSession | null; ready: boolean } {
  const supabase = useMemo(() => {
    try {
      return createClient();
    } catch {
      return null;
    }
  }, []);
  const [session, setSession] = useState<ClientSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      const s = data?.session;
      setSession(s ? { userId: s.user.id, token: s.access_token } : null);
      setReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ? { userId: s.user.id, token: s.access_token } : null);
    });
    return () => listener?.subscription.unsubscribe();
  }, [supabase]);

  return { session, ready };
}
