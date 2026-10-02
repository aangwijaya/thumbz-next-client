import Image from "next/image";

interface ThumbnailProps {
  src?: string | null;
  /** Team or brand colors used for the fallback when there is no image. */
  colors?: Array<string | undefined>;
  sizes: string;
  priority?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function Thumbnail({
  src,
  colors = [],
  sizes,
  priority = false,
  className = "",
  children,
}: ThumbnailProps) {
  const first = colors[0] || "var(--color-graphite)";
  const second = colors[1] || colors[0] || "var(--color-teal-dusk)";

  return (
    <div
      className={`relative aspect-video overflow-hidden bg-ink ${className}`}
      style={
        src
          ? undefined
          : {
              backgroundImage: `radial-gradient(55% 65% at 28% 42%, color-mix(in oklab, ${first} 42%, transparent), transparent 70%), radial-gradient(50% 60% at 76% 64%, color-mix(in oklab, ${second} 36%, transparent), transparent 70%), repeating-linear-gradient(135deg, rgb(255 255 255 / 0.04) 0 1px, transparent 1px 40px), linear-gradient(160deg, #2c332d, #191b1d 58%, #262033)`,
            }
      }
    >
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      ) : null}
      {children}
    </div>
  );
}
