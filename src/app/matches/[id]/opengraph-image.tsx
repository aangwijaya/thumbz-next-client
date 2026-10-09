import { ImageResponse } from "next/og";

import { getOptional } from "@/lib/api/server";
import type { MatchDetail } from "@/lib/api/types";
import { formatStage } from "@/lib/utils/format";

export const alt = "Match on THUMBZ";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Share card: "Team A vs Team B" in team colours. Scores stay off (spoilers). */
export default async function MatchImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await getOptional<MatchDetail>(`/matches/${id}`, { revalidate: 300, tags: [`match:${id}`] });
  const teams = [match?.team_a, match?.team_b].map((team) => ({
    name: team?.short_name || team?.name || "TBD",
    color: team?.color_primary || "#4a4744",
  }));
  const live = match?.status === "live";
  const subtitle = [match?.tournament?.name, match?.stage ? formatStage(match.stage) : null].filter(Boolean).join(" · ");

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#fefdfc", color: "#25221e", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flex: 1 }}>
          {teams.map((team, index) => (
            <div
              key={index}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: team.color,
                color: "#ffffff",
                fontSize: 96,
                fontWeight: 800,
                letterSpacing: -2,
              }}
            >
              {team.name}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "36px 60px", fontSize: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {live ? <span style={{ background: "#cf3520", color: "#fefdfc", padding: "6px 16px", borderRadius: 8, fontWeight: 700 }}>LIVE</span> : null}
            <span style={{ color: "#6f6c69" }}>{subtitle || "Mobile Legends esports"}</span>
          </div>
          <div style={{ display: "flex", fontWeight: 700, letterSpacing: 2 }}>
            THUMB<span style={{ color: "#f37a0a" }}>Z</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
