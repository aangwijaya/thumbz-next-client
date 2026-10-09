const PROBE_ORIGIN = "http://thumbz.invalid";

/**
 * Returns `raw` only when it is a same-origin path ("/matches?x=1"),
 * otherwise `fallback`. Blocks open redirects via "https://evil.com",
 * protocol-relative "//evil.com", backslash tricks ("/\evil.com") and
 * "javascript:" URLs coming from ?next= parameters.
 */
export function safeNextPath(raw: string | null | undefined, fallback = "/"): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
    return fallback;
  }
  try {
    const url = new URL(raw, PROBE_ORIGIN);
    if (url.origin !== PROBE_ORIGIN) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
