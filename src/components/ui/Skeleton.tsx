interface SkeletonProps {
  variant?: "text" | "media";
  bg?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({
  variant = "text",
  bg = "bg-surface-elevated",
  className = "",
  style,
}: SkeletonProps) {
  const sizeClass = variant === "media" ? "aspect-video" : "h-4";
  return (
    <div
      aria-hidden="true"
      style={style}
      className={`motion-safe:animate-pulse rounded-md ${bg} ${sizeClass} ${className}`}
    />
  );
}
