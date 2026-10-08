"use client";

import type { Socket } from "socket.io-client";

import { currentAccessToken, onSessionChange } from "@/lib/supabase/useSession";

import { checkSequence } from "./sequence";

/**
 * One Socket.IO connection per tab to the API's /rt namespace (contract §14),
 * created on first use (socket.io-client is imported lazily). Rooms are
 * reference-counted so several components can listen to the same room with
 * one server subscription; per-room `seq` tracking detects missed messages
 * and asks listeners to resync over REST.
 */
export type RealtimeStatus = "idle" | "connecting" | "connected" | "reconnecting";

export type Handler = (data: unknown) => void;

export interface RoomListener {
  handlers: Partial<Record<string, Handler>>;
  /** Called when messages may have been missed: refetch from REST. */
  resync?: () => void;
}

interface Envelope {
  room?: string;
  seq?: number;
  data?: unknown;
}

interface RoomState {
  listeners: Set<RoomListener>;
  lastSeq: number | null;
}

const rooms = new Map<string, RoomState>();
const statusListeners = new Set<() => void>();
let status: RealtimeStatus = "idle";
let socket: Socket | null = null;
let connecting: Promise<Socket | null> | null = null;
let lastToken: string | undefined;

function setStatus(next: RealtimeStatus) {
  if (status === next) return;
  status = next;
  statusListeners.forEach((listener) => listener());
}

export const realtimeStatus = {
  subscribe(listener: () => void) {
    statusListeners.add(listener);
    return () => statusListeners.delete(listener);
  },
  getSnapshot: () => status,
  getServerSnapshot: (): RealtimeStatus => "idle",
};

function apiOrigin(): string | null {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL ?? "").origin;
  } catch {
    return null;
  }
}

function deliver(event: string, payload: Envelope) {
  const room = payload?.room ? rooms.get(payload.room) : undefined;
  if (!room) return;
  if (typeof payload.seq === "number") {
    const { gap, last } = checkSequence(room.lastSeq, payload.seq);
    if (gap) room.listeners.forEach((listener) => listener.resync?.());
    room.lastSeq = last;
  }
  room.listeners.forEach((listener) => listener.handlers[event]?.(payload.data));
}

async function join(active: Socket, name: string) {
  try {
    const ack = (await active.timeout(5_000).emitWithAck("subscribe", { room: name })) as
      | { ok: true; seq: number }
      | { ok: false };
    const room = rooms.get(name);
    if (!room || !ack?.ok) return;
    // Rejoining after a disconnect: anything since our last seq was missed.
    if (room.lastSeq !== null && ack.seq !== room.lastSeq) {
      room.listeners.forEach((listener) => listener.resync?.());
    }
    room.lastSeq = ack.seq;
  } catch {
    // Timed out: the next reconnect rejoins.
  }
}

function connect(): Promise<Socket | null> {
  if (socket) return Promise.resolve(socket);
  const origin = apiOrigin();
  if (!origin || typeof window === "undefined") return Promise.resolve(null);
  connecting ??= import("socket.io-client").then(({ io }) => {
    setStatus("connecting");
    lastToken = currentAccessToken();
    const active = io(`${origin}/rt`, {
      transports: ["websocket", "polling"],
      // A function, so every (re)connect sends the current token.
      auth: (send) => send({ token: currentAccessToken() }),
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 10_000,
    });
    active.on("connect", () => {
      setStatus("connected");
      rooms.forEach((_room, name) => void join(active, name));
    });
    active.on("disconnect", () => setStatus("reconnecting"));
    active.on("connect_error", () => setStatus("reconnecting"));
    active.onAny((event: string, payload: Envelope) => deliver(event, payload));
    // Sign-in/out changes which private rooms we belong to: re-handshake.
    onSessionChange(() => {
      const token = currentAccessToken();
      if (token !== lastToken) {
        lastToken = token;
        active.disconnect().connect();
      }
    });
    socket = active;
    return active;
  });
  return connecting;
}

/** Starts listening to `room`; returns a function that stops listening. */
export function listen(name: string, listener: RoomListener): () => void {
  let room = rooms.get(name);
  const first = !room;
  if (!room) {
    room = { listeners: new Set(), lastSeq: null };
    rooms.set(name, room);
  }
  room.listeners.add(listener);
  if (first) {
    void connect().then((active) => {
      if (active?.connected && rooms.has(name)) void join(active, name);
    });
  }
  return () => {
    const current = rooms.get(name);
    if (!current) return;
    current.listeners.delete(listener);
    if (current.listeners.size === 0) {
      rooms.delete(name);
      socket?.emit("unsubscribe", { room: name });
    }
  };
}

/** Keeps "N watching" presence fresh for the match rooms we are in. */
export function pingPresence(): void {
  if (socket?.connected) socket.emit("presence:ping");
}
