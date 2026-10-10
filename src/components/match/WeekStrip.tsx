import Link from "next/link";

interface WeekDay {
  day: string;
  href: string;
  active: boolean;
  today: boolean;
  matches: number;
  live: number;
}

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember";

function Arrow({ href, label, flip }: { href: string; label: string; flip?: boolean }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-label={label}
      className={`grid place-items-center rounded-[10px] text-pencil transition-colors hover:bg-cream hover:text-ink max-[640px]:hidden ${focusRing}`}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]">
        <path d={flip ? "m9 6 6 6-6 6" : "m15 6-6 6 6 6"} />
      </svg>
    </Link>
  );
}

/** A week of match days (UTC): a dot per match, red while live; picking a day filters the list. */
export function WeekStrip({ days, prevHref, nextHref }: { days: WeekDay[]; prevHref: string; nextHref: string }) {
  return (
    <nav
      aria-label="Pick a day"
      className="grid grid-cols-[40px_repeat(7,minmax(0,1fr))_40px] gap-1.5 pb-2 max-[640px]:-mx-5 max-[640px]:grid-cols-[repeat(7,minmax(44px,1fr))] max-[640px]:overflow-x-auto max-[640px]:px-5 max-[640px]:[scrollbar-width:none]"
    >
      <Arrow href={prevHref} label="Previous week" />
      {days.map((day) => {
        const date = new Date(`${day.day}T12:00:00Z`);
        const dots = Math.min(4, day.matches);
        return (
          <Link
            key={day.day}
            href={day.href}
            scroll={false}
            aria-current={day.active ? "date" : undefined}
            aria-label={`${new Intl.DateTimeFormat("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" }).format(date)}, ${
              day.matches ? `${day.matches} ${day.matches === 1 ? "match" : "matches"}` : "no matches"
            }`}
            className={`flex flex-col items-center gap-[3px] rounded-[10px] border px-1 pb-[9px] pt-2.5 text-caption transition-colors hover:border-stone hover:bg-[#fdfaf7] ${
              day.active ? "border-ink shadow-[inset_0_0_0_1px_var(--color-ink)]" : "border-[#eeecea]"
            } ${day.matches ? "text-pencil" : "text-graphite"} ${focusRing}`}
          >
            <span>{day.today ? "Today" : new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" }).format(date)}</span>
            <b className={`font-graphik text-xl font-bold leading-tight ${day.matches ? "text-ink" : "text-graphite"}`}>
              {date.getUTCDate()}
            </b>
            <span aria-hidden="true" className="flex h-1.5 gap-[3px]">
              {Array.from({ length: dots }, (_, index) => (
                <i key={index} className={`size-[5px] rounded-full ${index < day.live ? "bg-ember-red" : "bg-graphite"}`} />
              ))}
            </span>
          </Link>
        );
      })}
      <Arrow href={nextHref} label="Next week" flip />
    </nav>
  );
}
