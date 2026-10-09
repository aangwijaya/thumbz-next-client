import type { NextConfig } from "next";

function originOf(url: string | undefined): string | null {
  try {
    return url ? new URL(url).origin : null;
  } catch {
    return null;
  }
}

const apiOrigin = originOf(process.env.NEXT_PUBLIC_API_URL);
const supabaseOrigin = originOf(process.env.NEXT_PUBLIC_SUPABASE_URL);
const isDev = process.env.NODE_ENV !== "production";

// Report-only for now: violations are logged by the browser without breaking
// the app, so the policy can be tightened from real reports before enforcing.
const contentSecurityPolicy = [
  "default-src 'self'",
  // Next.js inlines bootstrap scripts; dev mode additionally needs eval.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://wsrv.nl",
  "font-src 'self' data:",
  // Streams and DRM licenses come from the API, Supabase Storage and stream hosts.
  "media-src 'self' blob: https:",
  [
    "connect-src 'self'",
    apiOrigin,
    apiOrigin?.replace(/^http/, "ws"),
    supabaseOrigin,
    supabaseOrigin?.replace(/^http/, "ws"),
    "https:",
  ]
    .filter(Boolean)
    .join(" "),
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    // encrypted-media, fullscreen and picture-in-picture stay allowed for the player.
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
  { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicy },
];

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  poweredByHeader: false,
  images: {
    // All remote images go through the wsrv.nl CDN (see image-loader.ts), so
    // the built-in optimizer is never used as an open proxy for arbitrary hosts.
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // The browser must always revalidate the worker script, or updates stall.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
    ];
  },
};

export default nextConfig;
