import { parseVital } from "@/lib/vitals";

export const runtime = "nodejs";

const MAX_BODY = 2048;

/**
 * Field data sink for Core Web Vitals: one structured log line per metric,
 * picked up by the host's log pipeline (Vercel Logs / log drains).
 */
export async function POST(request: Request): Promise<Response> {
  const text = await request.text();
  if (text.length > MAX_BODY) return new Response(null, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400 });
  }
  const vital = parseVital(body);
  if (!vital) return new Response(null, { status: 400 });
  console.info(JSON.stringify({ type: "web-vital", ...vital }));
  return new Response(null, { status: 204 });
}
