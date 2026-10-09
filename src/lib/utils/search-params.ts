export type SearchParamsRecord = Record<string, string | string[] | undefined>;

/** First value of a search param, trimmed; undefined when absent or empty. */
export function param(params: SearchParamsRecord, key: string): string | undefined {
  const raw = params[key];
  const value = (Array.isArray(raw) ? raw[0] : raw)?.trim();
  return value ? value : undefined;
}

/** A positive page number from `?page=`, clamped to [1, max]. */
export function pageParam(params: SearchParamsRecord, max = 500): number {
  const page = Number.parseInt(param(params, "page") ?? "1", 10);
  return Number.isFinite(page) ? Math.min(Math.max(page, 1), max) : 1;
}

/** One of `allowed`, or undefined (unknown values are ignored, never echoed). */
export function enumParam<T extends string>(
  params: SearchParamsRecord,
  key: string,
  allowed: readonly T[],
): T | undefined {
  const value = param(params, key);
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

/**
 * `pathname` with the current params patched: `null`/"" removes a key.
 * Keys are sorted so equivalent URLs are identical (cache-friendly, shareable).
 */
export function hrefWith(
  pathname: string,
  current: Record<string, string | undefined>,
  patch: Record<string, string | number | null | undefined>,
): string {
  const merged: Record<string, string> = {};
  for (const [key, value] of Object.entries(current)) {
    if (value !== undefined && value !== "") merged[key] = value;
  }
  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === undefined || value === "") delete merged[key];
    else merged[key] = String(value);
  }
  const query = new URLSearchParams(
    Object.keys(merged)
      .sort()
      .map((key) => [key, merged[key] as string]),
  ).toString();
  return query ? `${pathname}?${query}` : pathname;
}
