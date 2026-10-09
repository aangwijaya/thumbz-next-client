/** Core Web Vitals reported by the browser (plus Next's own hydration timings are ignored). */
export const VITAL_NAMES = ["CLS", "FCP", "INP", "LCP", "TTFB"] as const;
export type VitalName = (typeof VITAL_NAMES)[number];

export interface VitalReport {
  name: VitalName;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  /** Route with ids collapsed (/matches/:id), so reports group per page type. */
  route: string;
  navigationType?: string;
}

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

export function routeOf(pathname: string): string {
  return pathname.replace(UUID, ":id").slice(0, 120) || "/";
}

/** Validates an untrusted beacon body; null when it is not a vital we accept. */
export function parseVital(body: unknown): VitalReport | null {
  if (typeof body !== "object" || body === null) return null;
  const { name, value, rating, route, navigationType } = body as Record<string, unknown>;
  if (!VITAL_NAMES.includes(name as VitalName)) return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 600_000) return null;
  if (rating !== "good" && rating !== "needs-improvement" && rating !== "poor") return null;
  if (typeof route !== "string" || !route.startsWith("/") || route.length > 120) return null;
  return {
    name: name as VitalName,
    value: Math.round(value * 1000) / 1000,
    rating,
    route,
    navigationType: typeof navigationType === "string" ? navigationType.slice(0, 20) : undefined,
  };
}
