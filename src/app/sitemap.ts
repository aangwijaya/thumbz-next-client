import type { MetadataRoute } from "next";

import { getOptional } from "@/lib/api/server";
import { SITE_URL } from "@/lib/site";

// Rebuilt at most hourly; entity pages also self-refresh through ISR.
export const revalidate = 3600;

interface Entity {
  id: string;
  updated_at?: string;
  published_at?: string;
  scheduled_at?: string;
}

/** One page of a list endpoint (the contract caps pageSize at 50); [] if the API is down. */
async function list(path: string): Promise<Entity[]> {
  return (await getOptional<Entity[]>(`${path}${path.includes("?") ? "&" : "?"}pageSize=50`, { revalidate: 3600 })) ?? [];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [tournaments, teams, players, matches, videos] = await Promise.all([
    list("/tournaments"),
    list("/teams"),
    list("/players"),
    list("/matches?sort=scheduled_at&order=desc"),
    list("/videos"),
  ]);

  const entry = (path: string, item: Entity, priority: number): MetadataRoute.Sitemap[number] => {
    const date = item?.updated_at ?? item?.published_at ?? item?.scheduled_at;
    return { url: `${SITE_URL}${path}/${item?.id}`, lastModified: date ? new Date(date) : undefined, priority };
  };

  return [
    { url: `${SITE_URL}/`, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE_URL}/live`, changeFrequency: "always", priority: 0.9 },
    { url: `${SITE_URL}/matches`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${SITE_URL}/tournaments`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/teams`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/players`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/videos`, changeFrequency: "daily", priority: 0.7 },
    ...tournaments.map((item) => entry("/tournaments", item, 0.7)),
    ...matches.map((item) => entry("/matches", item, 0.6)),
    ...teams.map((item) => entry("/teams", item, 0.5)),
    ...players.map((item) => entry("/players", item, 0.4)),
    ...videos.map((item) => entry("/videos", item, 0.5)),
  ];
}
