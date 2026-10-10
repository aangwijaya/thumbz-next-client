import { cache } from "react";

import { apiFetch } from "./client";
import { query } from "./server";
import type { ApiEnvelope, HomePayload } from "./types";

// One /home request per render: the home page and the banner slot both read it.
export const getHome = cache(async (token: string | null, tournamentId?: string): Promise<HomePayload> => {
  const response = await apiFetch<ApiEnvelope<HomePayload>>(`/home${query({ tournament_id: tournamentId })}`, {
    token: token ?? undefined,
    cache: "no-store",
  });
  return response?.data;
});
