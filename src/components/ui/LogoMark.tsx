import Image from "next/image";

import { initialsOf } from "@/lib/utils/format";

type LogoMarkSize = "xs" | "sm" | "md" | "lg";

const sizeClasses: Record<LogoMarkSize, { box: string; text: string; px: number }> = {
  xs: { box: "size-5 rounded-[5px]", text: "text-[7px]", px: 20 },
  sm: { box: "size-6 rounded-md", text: "text-[10px]", px: 24 },
  md: { box: "size-9 rounded-lg", text: "text-caption", px: 36 },
  lg: { box: "size-12 rounded-lg", text: "text-body-sm", px: 48 },
};

// A team or tournament.
interface LogoSource {
  name?: string | null;
  logo_url?: string | null;
  color_primary?: string | null;
}

interface LogoMarkProps {
  source?: LogoSource | null;
  size?: LogoMarkSize;
  /** Text instead of the name's initials (e.g. a league's region code). */
  label?: string;
}

// Decorative: callers always render the name next to the mark.
export function LogoMark({ source, size = "md", label }: LogoMarkProps) {
  const { box, text, px } = sizeClasses[size];

  if (source?.logo_url) {
    return (
      <span
        aria-hidden="true"
        className={`relative shrink-0 overflow-hidden border border-stone bg-paper ${box}`}
      >
        <Image
          src={source.logo_url}
          alt=""
          fill
          sizes={`${px}px`}
          className="object-contain p-[12%]"
        />
      </span>
    );
  }

  const color = source?.color_primary || "var(--color-pencil)";
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center border font-graphik font-bold text-ink ${box} ${text}`}
      style={{
        backgroundColor: `color-mix(in oklab, ${color} 20%, var(--color-paper))`,
        borderColor: `color-mix(in oklab, ${color} 35%, transparent)`,
      }}
    >
      {label ?? initialsOf(source?.name ?? "?")}
    </span>
  );
}
