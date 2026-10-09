import { cookies } from "next/headers";

import { SPOILER_COOKIE } from "@/lib/spoiler";

/** Dynamic pages only: reading cookies opts the route out of static rendering. */
export async function hideScoresFromCookie(): Promise<boolean> {
  return (await cookies()).get(SPOILER_COOKIE)?.value === "1";
}
