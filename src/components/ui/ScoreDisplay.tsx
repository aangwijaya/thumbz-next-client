interface ScoreDisplayProps {
  scoreA: number | null;
  scoreB: number | null;
  colorA?: string;
  colorB?: string;
  className?: string;
}

export function ScoreDisplay({
  scoreA,
  scoreB,
  colorA,
  colorB,
  className = "",
}: ScoreDisplayProps) {
  return (
    <span
      className={`font-mono text-lg tabular-nums tracking-tight ${className}`}
      aria-label={`${scoreA ?? "–"} to ${scoreB ?? "–"}`}
    >
      <span style={colorA ? { color: colorA } : undefined}>{scoreA ?? "–"}</span>
      <span aria-hidden="true" className="mx-1.5 text-text-secondary">
        :
      </span>
      <span style={colorB ? { color: colorB } : undefined}>{scoreB ?? "–"}</span>
    </span>
  );
}
