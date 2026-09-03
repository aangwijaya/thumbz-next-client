import Image from "next/image";
import Link from "next/link";

import type { VideoSummary } from "@/lib/api/types";
import { formatDate, formatDuration } from "@/lib/utils/format";

interface VideoCardProps {
  video: VideoSummary;
  className?: string;
}

export function VideoCard({ video, className = "" }: VideoCardProps) {
  const external = !video?.match_id;
  const href = video?.match_id ? `/matches/${video.match_id}` : (video?.url ?? "#");
  const duration = formatDuration(video?.duration_seconds ?? 0);

  return (
    <Link
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className={`group block overflow-hidden rounded-lg border border-page-dark-border bg-page-dark-surface transition-colors hover:border-text-secondary/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary ${className}`}
    >
      <div className="relative aspect-video bg-surface-elevated">
        {video?.thumbnail_url ? (
          <Image
            src={video.thumbnail_url}
            alt={video?.title ?? "Video"}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover motion-safe:transition-transform motion-safe:group-hover:scale-[1.02]"
          />
        ) : null}
        {video?.type ? (
          <span className="absolute left-3 top-3 rounded bg-background/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-text-secondary">
            {video.type}
          </span>
        ) : null}
        {duration ? (
          <span className="absolute bottom-3 right-3 rounded bg-background/80 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-text-primary">
            {duration}
          </span>
        ) : null}
      </div>

      <div className="p-4">
        <h3 className="line-clamp-2 text-sm font-medium">
          {video?.title ?? "Untitled video"}
        </h3>
        <p className="mt-1.5 font-mono text-xs text-text-secondary">
          {formatDate(video?.published_at ?? "")}
        </p>
      </div>
    </Link>
  );
}
