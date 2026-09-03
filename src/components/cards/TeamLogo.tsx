import Image from "next/image";

import type { TeamSummary } from "@/lib/api/types";
import { initialsOf } from "@/lib/utils/format";

interface TeamLogoProps {
  team?: TeamSummary | null;
  size?: number;
  className?: string;
}

export function TeamLogo({ team, size = 24, className = "" }: TeamLogoProps) {
  const url = team?.logo_url;
  if (url) {
    return (
      <Image
        src={url}
        alt={`${team?.name ?? "Team"} logo`}
        width={size}
        height={size}
        className={`shrink-0 rounded-sm object-contain ${className}`}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-sm bg-surface-elevated font-mono text-text-secondary ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {initialsOf(team?.name ?? "?")}
    </span>
  );
}
