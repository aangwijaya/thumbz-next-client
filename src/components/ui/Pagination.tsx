import Link from "next/link";

interface PaginationProps {
  page: number;
  totalPages: number;
  /** URL of a given page, preserving the current filters. */
  hrefFor: (page: number) => string;
  label?: string;
}

type Slot = number | "gap";

/** 1 … 4 5 [6] 7 8 … 20 — first, last and a window around the current page. */
export function pageSlots(page: number, totalPages: number, radius = 2): Slot[] {
  const slots: Slot[] = [];
  for (let n = 1; n <= totalPages; n += 1) {
    if (n === 1 || n === totalPages || Math.abs(n - page) <= radius) {
      slots.push(n);
    } else if (slots[slots.length - 1] !== "gap") {
      slots.push("gap");
    }
  }
  return slots;
}

const base =
  "inline-grid min-h-10 min-w-10 place-items-center rounded-lg px-3 text-body-sm font-semibold tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember";

/**
 * Numbered pagination rendered as plain links: crawlable, shareable,
 * prefetched by next/link when visible, and fully keyboard accessible.
 */
export function Pagination({ page, totalPages, hrefFor, label = "Pagination" }: PaginationProps) {
  if (totalPages <= 1) return null;
  const previous = page > 1 ? hrefFor(page - 1) : null;
  const next = page < totalPages ? hrefFor(page + 1) : null;

  return (
    <nav aria-label={label} className="flex flex-wrap items-center justify-center gap-1.5">
      {previous ? (
        <Link href={previous} rel="prev" className={`${base} text-ink hover:bg-cream`}>
          <span aria-hidden="true">←</span>
          <span className="sr-only">Previous page</span>
        </Link>
      ) : (
        <span aria-hidden="true" className={`${base} text-stone`}>
          ←
        </span>
      )}

      <ul className="flex flex-wrap items-center gap-1.5">
        {pageSlots(page, totalPages).map((slot, index) =>
          slot === "gap" ? (
            <li key={`gap-${index}`} aria-hidden="true" className="px-1 text-pencil">
              …
            </li>
          ) : (
            <li key={slot}>
              <Link
                href={hrefFor(slot)}
                aria-current={slot === page ? "page" : undefined}
                aria-label={`Page ${slot}`}
                className={`${base} ${
                  slot === page ? "bg-ink text-paper" : "text-ink hover:bg-cream"
                }`}
              >
                {slot}
              </Link>
            </li>
          ),
        )}
      </ul>

      {next ? (
        <Link href={next} rel="next" className={`${base} text-ink hover:bg-cream`}>
          <span aria-hidden="true">→</span>
          <span className="sr-only">Next page</span>
        </Link>
      ) : (
        <span aria-hidden="true" className={`${base} text-stone`}>
          →
        </span>
      )}
    </nav>
  );
}
