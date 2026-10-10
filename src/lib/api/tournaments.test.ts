import { describe, expect, it } from "vitest";

import { pickTournament, tournamentLabel } from "./tournaments";
import type { TournamentSummary } from "./types";

const tournament = (patch: Partial<TournamentSummary>): TournamentSummary => ({
  id: "t",
  slug: "t",
  name: "T",
  status: "ongoing",
  region: "Philippines",
  start_date: "2026-08-19",
  end_date: "2026-11-17",
  prize_pool: null,
  logo_url: null,
  featured: false,
  ...patch,
});

describe("pickTournament", () => {
  const ph = tournament({ id: "ph", featured: true });
  const id = tournament({ id: "id", featured: true });
  const old = tournament({ id: "old", status: "completed" });

  it("keeps the tournament from the URL", () => {
    expect(pickTournament([ph, id], "id")).toBe(id);
  });

  it("falls back to the first featured ongoing tournament", () => {
    expect(pickTournament([old, ph, id], "missing")).toBe(ph);
    expect(pickTournament([old, ph, id])).toBe(ph);
  });

  it("then to any ongoing one, then to the newest", () => {
    const plain = tournament({ id: "plain" });
    expect(pickTournament([old, plain])).toBe(plain);
    expect(pickTournament([old])).toBe(old);
    expect(pickTournament([])).toBeNull();
  });
});

describe("tournamentLabel", () => {
  it("shortens MPL leagues to their region code", () => {
    expect(tournamentLabel({ name: "MPL Philippines Season 18" })).toBe("MPL PH");
    expect(tournamentLabel({ name: "MPL Indonesia Season 18" })).toBe("MPL ID");
  });

  it("drops the season from other names", () => {
    expect(tournamentLabel({ name: "M8 Tournament" })).toBe("M8 Tournament");
    expect(tournamentLabel({ name: "EWC 2027" })).toBe("EWC 2027");
    expect(tournamentLabel({ name: "MSC Season 3" })).toBe("MSC");
    expect(tournamentLabel(null)).toBe("Tournament");
  });
});
