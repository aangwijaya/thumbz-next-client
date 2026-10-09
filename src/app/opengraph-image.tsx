import { ImageResponse } from "next/og";

import { SITE_DESCRIPTION } from "@/lib/site";

export const alt = "THUMBZ — Mobile Legends esports";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default share card for every page without its own. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "#fefdfc",
          color: "#25221e",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 34, fontWeight: 700, letterSpacing: 2 }}>
          THUMB<span style={{ color: "#f37a0a" }}>Z</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: -1 }}>Mobile Legends esports, live.</div>
          <div style={{ fontSize: 32, color: "#6f6c69", maxWidth: 900 }}>{SITE_DESCRIPTION}</div>
        </div>
        <div style={{ display: "flex", height: 10, width: 220, background: "#e34432", borderRadius: 5 }} />
      </div>
    ),
    size,
  );
}
