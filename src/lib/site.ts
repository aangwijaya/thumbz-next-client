/**
 * Canonical origin for absolute URLs (metadata, sitemap, Open Graph).
 * NEXT_PUBLIC_SITE_URL wins; on Vercel the production domain is the fallback.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
).replace(/\/+$/, "");

export const SITE_NAME = "THUMBZ";
export const SITE_DESCRIPTION =
  "Live Mobile Legends esports: matches, replays, tournaments, teams, players and statistics in one place.";
