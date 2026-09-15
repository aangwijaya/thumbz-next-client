import { ApiError, type ApiErrorBody } from "./errors";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export interface ApiFetchOptions {
  method?: string;
  token?: string;
  body?: unknown;
  headers?: HeadersInit;
  cache?: RequestCache;
  next?: { revalidate?: number | false; tags?: string[] };
  signal?: AbortSignal;
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  const headers = new Headers(options.headers);
  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      cache: options.cache,
      next: options.next,
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new ApiError(0, "INTERNAL_ERROR", "Unable to reach the server. Please try again.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    throw await errorFromResponse(response);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError(
      response.status,
      "INTERNAL_ERROR",
      "The server returned an unexpected response.",
    );
  }
}

async function errorFromResponse(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as Partial<ApiErrorBody>;
    const error = body?.error;
    if (error?.code && error?.message) {
      return new ApiError(
        response.status,
        error.code,
        error.message,
        error.details ?? null,
      );
    }
  } catch {
    // non-JSON error body
  }
  return new ApiError(
    response.status,
    "INTERNAL_ERROR",
    "Something went wrong. Please try again.",
  );
}
