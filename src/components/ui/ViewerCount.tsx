import { formatViewerCount } from "@/lib/utils/format";

interface ViewerCountProps {
  count?: number;
  className?: string;
}

export function ViewerCount({ count, className = "" }: ViewerCountProps) {
  if (typeof count !== "number") return null;
  return (
    <span className={`font-mono text-xs text-text-secondary ${className}`}>
      <span className="tabular-nums">{formatViewerCount(count)}</span>{" "}
      <span className="uppercase tracking-wider">watching</span>
    </span>
  );
}
