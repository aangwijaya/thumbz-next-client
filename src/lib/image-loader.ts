import type { ImageLoaderProps } from "next/image";

const IMAGE_CDN = "https://wsrv.nl/";

/**
 * next/image loader backed by the wsrv.nl image CDN (Cloudflare-cached):
 * remote images are resized to the requested width and served as WebP, so
 * the app never runs its own optimizer (no open image proxy, no cold-start
 * resizing). Sources that already point at wsrv keep their own params
 * (crop, fit) and only get width/quality/format applied.
 */
export default function imageLoader({ src, width, quality }: ImageLoaderProps): string {
  // Files in /public are already sized; the width param only keeps srcset URLs distinct.
  if (src.startsWith("/")) return `${src}?w=${width}`;
  if (src.startsWith("data:") || src.startsWith("blob:")) return src;

  let params: URLSearchParams;
  try {
    const parsed = new URL(src);
    params =
      parsed.hostname === "wsrv.nl"
        ? new URLSearchParams(parsed.search)
        : new URLSearchParams({ url: src });
  } catch {
    return src;
  }
  if (!params.get("url")) return src;

  params.set("w", String(width));
  params.set("q", String(quality ?? 75));
  params.set("output", "webp");
  // Never upscale small sources (team logos are often 256px).
  params.set("we", "1");
  return `${IMAGE_CDN}?${params.toString()}`;
}
