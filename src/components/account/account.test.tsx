// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ToastProvider } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api/errors";
import type { Favorite, MatchSummary, WatchHistoryItem } from "@/lib/api/types";

import { FavoritesList } from "./FavoritesList";
import { HistoryList } from "./HistoryList";

const api = vi.hoisted(() => ({
  fetchMyFavorites: vi.fn(),
  removeFavorite: vi.fn(),
  fetchMyHistoryPage: vi.fn(),
  deleteHistoryItem: vi.fn(),
}));
vi.mock("@/lib/api/endpoints", async (original) => ({ ...(await original<object>()), ...api }));
vi.mock("@/lib/supabase/useSession", () => ({
  useSupabaseSession: () => ({ ready: true, session: { userId: "u1", token: "jwt", initial: "D" } }),
}));
// Match rows render links, spoiler state and time zones; stub them to the essentials.
vi.mock("@/components/match/MatchListItem", () => ({
  MatchListItem: ({ match }: { match: MatchSummary }) => <span>{match.team_a?.name} vs {match.team_b?.name}</span>,
}));

function wrap(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>{ui}</ToastProvider>
    </QueryClientProvider>,
  );
}

const team = (id: string, name: string): Favorite => ({
  entity_type: "team",
  entity_id: id,
  created_at: "2026-10-01T00:00:00Z",
  entity: { id, name, slug: id, short_name: null, region: "ID", logo_url: null } as unknown as Favorite["entity"],
});

const historyItem = (id: string): WatchHistoryItem => ({
  match_id: id,
  watched_at: "2026-10-01T00:00:00Z",
  duration_seconds: 300,
  total_seconds: 1200,
  match: { id, team_a: { name: `A${id}` }, team_b: { name: `B${id}` } } as unknown as MatchSummary,
});

describe("FavoritesList", () => {
  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  it("removes a team at once and restores it when the API refuses", async () => {
    api.fetchMyFavorites.mockResolvedValue([team("t1", "ONIC"), team("t2", "RRQ")]);
    let reject!: (error: unknown) => void;
    api.removeFavorite.mockReturnValue(new Promise((_, fail) => (reject = fail)));

    wrap(<FavoritesList />);
    fireEvent.click(await screen.findByRole("button", { name: "Unfollow ONIC" }));
    await waitFor(() => expect(screen.queryByText("ONIC")).toBeNull()); // optimistic
    expect(api.removeFavorite).toHaveBeenCalledWith("team", "t1", "jwt");

    reject(new ApiError(500, "INTERNAL_ERROR", "boom"));
    expect(await screen.findByText("ONIC")).toBeTruthy(); // rolled back
    expect(await screen.findByText("Could not unfollow. Please try again.")).toBeTruthy();
  });

  it("explains the empty state", async () => {
    api.fetchMyFavorites.mockResolvedValue([]);
    wrap(<FavoritesList />);
    expect(await screen.findByText(/not following anyone yet/)).toBeTruthy();
  });
});

describe("HistoryList", () => {
  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  it("pages with offsets, shows progress and removes rows optimistically", async () => {
    api.fetchMyHistoryPage.mockImplementation(async (_token: string, page: number) => ({
      data: [historyItem(`m${page}`)],
      meta: { page, pageSize: 20, total: 2, totalPages: 2 },
    }));
    api.deleteHistoryItem.mockResolvedValue(undefined);

    wrap(<HistoryList />);
    expect(await screen.findByText("Am1 vs Bm1")).toBeTruthy();
    expect(screen.getByRole("progressbar", { name: "Watched" }).getAttribute("aria-valuenow")).toBe("25");

    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect(await screen.findByText("Am2 vs Bm2")).toBeTruthy();
    expect(api.fetchMyHistoryPage).toHaveBeenLastCalledWith("jwt", 2, expect.anything());
    expect(screen.queryByRole("button", { name: "Load more" })).toBeNull(); // last page

    fireEvent.click(screen.getAllByRole("button", { name: "Remove from history" })[0]);
    await waitFor(() => expect(screen.queryByText("Am1 vs Bm1")).toBeNull());
    expect(api.deleteHistoryItem).toHaveBeenCalledWith("m1", "jwt");
  });
});
