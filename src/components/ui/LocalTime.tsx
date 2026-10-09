"use client";

import { useTimeZone } from "@/lib/hooks/useTimeZone";

const FORMATS = {
  time: { hour: "2-digit", minute: "2-digit", hour12: false },
  date: { day: "numeric", month: "short", year: "numeric" },
  datetime: { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false },
} satisfies Record<string, Intl.DateTimeFormatOptions>;

/** A timestamp in the visitor's time zone (UTC until hydrated). */
export function LocalTime({
  iso,
  format = "time",
  className,
}: {
  iso: string | null | undefined;
  format?: keyof typeof FORMATS;
  className?: string;
}) {
  const timeZone = useTimeZone();
  const date = new Date(iso ?? "");
  if (Number.isNaN(date.getTime())) return null;
  return (
    <time dateTime={date.toISOString()} className={className}>
      {new Intl.DateTimeFormat("en-GB", { ...FORMATS[format], timeZone }).format(date)}
    </time>
  );
}
