import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private or utility pages: nothing useful to index.
      disallow: ["/me/", "/api/", "/auth/", "/login", "/offline"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
