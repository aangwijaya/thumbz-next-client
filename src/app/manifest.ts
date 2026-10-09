import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "THUMBZ — Mobile Legends esports",
    short_name: "THUMBZ",
    description: "Live Mobile Legends matches, replays, tournaments, teams and players.",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#fefdfc",
    theme_color: "#fefdfc",
    categories: ["sports", "entertainment"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Live now", url: "/live", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Replays", url: "/videos", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "My tickets", url: "/me/tickets", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
