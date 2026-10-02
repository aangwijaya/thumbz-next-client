import { cache } from "react";

import { apiFetch } from "./client";
import type { ApiEnvelope, HomePayload } from "./types";

// One /home request per render: the home page and the banner slot both read it.
export const getHome = cache(async (token: string | null): Promise<HomePayload> => {
  const response = await apiFetch<ApiEnvelope<HomePayload>>("/home", {
    token: token ?? undefined,
    cache: "no-store",
  });
  return response?.data;
});
