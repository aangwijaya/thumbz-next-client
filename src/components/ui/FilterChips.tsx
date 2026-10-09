import Link from "next/link";

export interface FilterChip {
  label: string;
  href: string;
  active: boolean;
  count?: number;
}

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember";

/**
 * URL-driven filters: each chip is a link to the filtered URL, so filters are
 * shareable, work without JavaScript and keep the back button meaningful.
 */
export function FilterChips({ label, chips }: { label: string; chips: FilterChip[] }) {
  return (
    <nav aria-label={label} className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none]">
      <ul className="flex w-max gap-2">
        {chips.map((chip) => (
          <li key={chip.href}>
            <Link
              href={chip.href}
              scroll={false}
              aria-current={chip.active ? "page" : undefined}
              className={`inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-lg border px-3.5 text-body-sm font-semibold transition-colors ${focusRing} ${
                chip.active
                  ? "border-ink bg-ink text-paper"
                  : "border-stone bg-paper text-ink hover:border-ink/40 hover:bg-cream"
              }`}
            >
              {chip.label}
              {chip.count !== undefined ? (
                <span
                  className={`tabular-nums ${chip.active ? "text-paper/70" : "text-pencil"}`}
                >
                  {chip.count}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
