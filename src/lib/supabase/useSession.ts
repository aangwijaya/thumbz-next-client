"use client";

import { useSyncExternalStore } from "react";


export interface ClientSession {
  userId: string;
  token: string;
  /** First letter of the display name or email, for the avatar. */
  initial: string;
}

function toClientSession(session: {
  access_token: string;
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> };
}): ClientSession {
  const meta = session.user.user_metadata ?? {};
  const name =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    session.user.email ||
    "";
  return {
    userId: session.user.id,
    token: session.access_token,
    initial: name.trim().charAt(0).toUpperCase() || "U",
  };
}

interface SessionState {
  session: ClientSession | null;
  ready: boolean;
}

/*
 * One session store per tab: a single Supabase client and auth listener no
 * matter how many components ask. supabase-js is imported on first use, so
 * it stays off the critical path of every page that only needs the header.
 */
const SERVER_STATE: SessionState = { session: null, ready: false };
let state: SessionState = SERVER_STATE;
let started = false;
const listeners = new Set<() => void>();

function set(next: SessionState) {
  state = next;
  listeners.forEach((listener) => listener());
}

function start() {
  if (started) return;
  started = true;
  import("./client")
    .then(({ createClient }) => createClient())
    .then((supabase) => {
      supabase.auth.getSession().then(({ data }) => {
        const s = data?.session;
        set({ session: s ? toClientSession(s) : null, ready: true });
      });
      supabase.auth.onAuthStateChange((_event, s) => {
        set({ session: s ? toClientSession(s) : null, ready: true });
      });
    })
    .catch(() => set({ session: null, ready: true }));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  start();
  return () => listeners.delete(listener);
}

export function useSupabaseSession(): SessionState {
  return useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);
}

/** Current access token outside React (realtime handshake); undefined when signed out. */
export function currentAccessToken(): string | undefined {
  return state.session?.token;
}

/** Notified whenever the session changes (sign-in, sign-out, token refresh). */
export function onSessionChange(listener: () => void): () => void {
  start();
  listeners.add(listener);
  return () => listeners.delete(listener);
}
