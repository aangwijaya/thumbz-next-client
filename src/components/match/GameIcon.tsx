import Image from "next/image";

import { initialsOf } from "@/lib/utils/format";

/**
 * A hero, item, emblem or talent icon through the image CDN loader, with the
 * name's initials when there is no icon. Decorative: callers render or label
 * the name themselves.
 */
export function GameIcon({
  src,
  name,
  size,
  className = "",
  tint,
}: {
  src?: string | null;
  name: string;
  size: number;
  className?: string;
  /** Background behind initials (team color). */
  tint?: string;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        title={name}
        className={`shrink-0 bg-stone/40 object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      title={name}
      className={`grid shrink-0 place-items-center font-graphik text-[10px] font-extrabold text-ink ${className}`}
      style={{ width: size, height: size, background: tint ?? "var(--color-stone)" }}
    >
      {initialsOf(name)}
    </span>
  );
}
