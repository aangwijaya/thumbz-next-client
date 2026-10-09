// @vitest-environment happy-dom
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/errors";
import type { PlaybackSession } from "@/lib/api/types";

import { usePlaybackSession } from "./usePlaybackSession";

const api = vi.hoisted(() => ({
  createPlaybackSession: vi.fn(),
  heartbeatPlaybackSession: vi.fn(),
  endPlaybackSession: vi.fn(),
}));
vi.mock("@/lib/api/endpoints", () => api);
vi.mock("@/lib/supabase/useSession", () => ({
  useSupabaseSession: () => ({ ready: true, session: { userId: "u1", token: "user-jwt", initial: "D" } }),
}));

const session = (id: string, token: string): PlaybackSession => ({
  session_id: id,
  token,
  expires_at: new Date(Date.now() + 600_000).toISOString(),
  heartbeat_seconds: 30,
  asset: { id: "a1", title: "Replay", protection: "clearkey_aes", duration_seconds: 60 },
  sources: { dash: null, hls: null },
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => (resolve = done));
  return { promise, resolve };
}

describe("usePlaybackSession", () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => {
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  it("keeps the live token when an abandoned session answers last", async () => {
    // A restart (or StrictMode's double effect, or a fast re-navigation)
    // abandons the first request; it must not clear the live session's token.
    const abandoned = deferred<PlaybackSession>();
    const live = deferred<PlaybackSession>();
    api.createPlaybackSession.mockReturnValueOnce(abandoned.promise).mockReturnValueOnce(live.promise);

    const { result } = renderHook(() => usePlaybackSession("a1"));
    act(() => result.current.restart());
    await act(async () => live.resolve(session("s2", "token-2")));
    await act(async () => abandoned.resolve(session("s1", "token-1")));

    expect(result.current.state).toMatchObject({ status: "ready", session: { session_id: "s2" } });
    expect(result.current.tokenRef.current).toBe("token-2");
    // The abandoned session still frees its device slot.
    expect(api.endPlaybackSession).toHaveBeenCalledWith("s1", "user-jwt");
    expect(api.endPlaybackSession).not.toHaveBeenCalledWith("s2", expect.anything());
  });

  it("rotates the token on every heartbeat and ends the session on unmount", async () => {
    api.createPlaybackSession.mockResolvedValue(session("s1", "token-1"));
    api.heartbeatPlaybackSession.mockResolvedValue({ token: "token-2", expires_at: "" });

    const { result, unmount } = renderHook(() => usePlaybackSession("a1"));
    await waitFor(() => expect(result.current.state.status).toBe("ready"));
    await act(async () => vi.advanceTimersByTimeAsync(30_000));

    expect(api.heartbeatPlaybackSession).toHaveBeenCalledWith("s1", "user-jwt");
    expect(result.current.tokenRef.current).toBe("token-2");
    unmount();
    expect(api.endPlaybackSession).toHaveBeenCalledWith("s1", "user-jwt");
  });

  it("reports the device limit with the server's reason", async () => {
    api.createPlaybackSession.mockRejectedValue(
      new ApiError(409, "CONFLICT", "Too many devices are streaming on this account (max 2)"),
    );
    const { result } = renderHook(() => usePlaybackSession("a1"));
    await waitFor(() =>
      expect(result.current.state).toEqual({
        status: "limit",
        message: "Too many devices are streaming on this account (max 2)",
      }),
    );
  });

  it("marks the device evicted when a heartbeat finds the session gone", async () => {
    api.createPlaybackSession.mockResolvedValue(session("s1", "token-1"));
    api.heartbeatPlaybackSession.mockRejectedValue(new ApiError(404, "NOT_FOUND", "Not found"));

    const { result } = renderHook(() => usePlaybackSession("a1"));
    await waitFor(() => expect(result.current.state.status).toBe("ready"));
    await act(async () => vi.advanceTimersByTimeAsync(30_000));

    expect(result.current.state.status).toBe("evicted");
  });

  it("opens a fresh session on restart", async () => {
    api.createPlaybackSession
      .mockResolvedValueOnce(session("s1", "token-1"))
      .mockResolvedValueOnce(session("s2", "token-2"));
    const { result } = renderHook(() => usePlaybackSession("a1"));
    await waitFor(() => expect(result.current.state.status).toBe("ready"));

    act(() => result.current.restart());
    await waitFor(() => expect(result.current.tokenRef.current).toBe("token-2"));
    expect(api.endPlaybackSession).toHaveBeenCalledWith("s1", "user-jwt");
  });
});
