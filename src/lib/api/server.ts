import { notFound } from "next/navigation";

import { apiFetch } from "./client";
import { isApiError } from "./errors";
import type { ApiEnvelope } from "./types";

/**
 * Server-side reads of public API data. Responses land in the Next.js data
 * cache for `revalidate` seconds and carry the API's cache tags, so the API's
 * revalidation webhook (/api/revalidate) refreshes them on writes.
 */
export interface ReadPolicy {
  revalidate?: number;
  tags?: string[];
}

const DEFAULT_POLICY: ReadPolicy = { revalidate: 30, tags: ["catalog"] };

export function getEnvelope<T>(path: string, policy: ReadPolicy = DEFAULT_POLICY) {
  return apiFetch<ApiEnvelope<T>>(path, {
    next: { revalidate: policy.revalidate ?? 30, tags: policy.tags },
  });
}

/** `data` of a resource, rendering the not-found page on 404. */
export async function getOrNotFound<T>(path: string, policy?: ReadPolicy): Promise<T> {
  try {
    const envelope = await getEnvelope<T>(path, policy);
    if (envelope?.data === undefined || envelope.data === null) notFound();
    return envelope.data;
  } catch (error) {
    if (isApiError(error) && (error.status === 404 || error.status === 400)) notFound();
    throw error;
  }
}

/** Optional page sections: a failed or empty read renders nothing, not an error page. */
export async function getOptional<T>(path: string, policy?: ReadPolicy): Promise<T | null> {
  try {
    return (await getEnvelope<T>(path, policy))?.data ?? null;
  } catch {
    return null;
  }
}

export function query(params: Record<string, string | number | boolean | undefined | null>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}
