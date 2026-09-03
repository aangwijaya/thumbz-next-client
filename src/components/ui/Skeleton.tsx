interface SkeletonProps {
  variant?: "text" | "media";
  bg?: string;
  className?: string;
}

export function Skeleton({
  variant = "text",
  bg = "bg-surface-elevated",
  className = "",
}: SkeletonProps) {
  const sizeClass = variant === "media" ? "aspect-video" : "h-4";
  return (
    <div
      aria-hidden="true"
      className={`motion-safe:animate-pulse rounded-md ${bg} ${sizeClass} ${className}`}
    />
  );
}
