import { timingSafeEqual } from "node:crypto";

import { revalidateTag } from "next/cache";

export const runtime = "nodejs";

const TAG_PATTERN = /^[a-z0-9:_-]{1,100}$/i;
const MAX_TAGS = 100;

function matchesSecret(provided: string, secret: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * On-demand revalidation webhook called by the API after writes
 * (FrontendRevalidationListener): marks the given data-cache tags stale so
 * ISR pages refresh on change instead of waiting for their interval.
 */
export async function POST(request: Request): Promise<Response> {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return Response.json({ error: "revalidation disabled" }, { status: 404 });
  }

  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!matchesSecret(provided, secret)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  let tags: unknown;
  try {
    tags = ((await request.json()) as { tags?: unknown })?.tags;
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (
    !Array.isArray(tags) ||
    tags.length === 0 ||
    tags.length > MAX_TAGS ||
    !tags.every((tag) => typeof tag === "string" && TAG_PATTERN.test(tag))
  ) {
    return Response.json({ error: "tags must be 1-100 valid tag strings" }, { status: 400 });
  }

  for (const tag of new Set(tags as string[])) {
    revalidateTag(tag);
  }
  return Response.json({ revalidated: tags.length });
}
