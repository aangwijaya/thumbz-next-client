import Image from "next/image";
import Link from "next/link";

import { initialsOf } from "@/lib/utils/format";

import { Highlight } from "./Highlight";

interface SearchResultRowProps {
  href: string;
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  /** Rounded avatar for people, square for logos. */
  shape?: "round" | "square";
  query: string;
  meta?: React.ReactNode;
}

export function SearchResultRow({
  href,
  title,
  subtitle,
  imageUrl,
  shape = "square",
  query,
  meta,
}: SearchResultRowProps) {
  const radius = shape === "round" ? "rounded-full" : "rounded-lg";
  return (
    <li>
      <Link
        href={href}
        className="group flex items-center gap-3.5 rounded-lg px-3 py-2.5 transition-colors hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember"
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            width={40}
            height={40}
            className={`size-10 shrink-0 bg-paper object-contain ${radius}`}
          />
        ) : (
          <span
            aria-hidden="true"
            className={`grid size-10 shrink-0 place-items-center bg-cream font-graphik text-body-sm font-bold text-deep-ember ${radius}`}
          >
            {initialsOf(title)}
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-graphik text-body font-semibold text-ink">
            <Highlight text={title} query={query} />
          </span>
          {subtitle ? <span className="truncate text-body-sm text-pencil">{subtitle}</span> : null}
        </span>
        {meta}
        <span aria-hidden="true" className="text-pencil transition-transform motion-safe:group-hover:translate-x-0.5">
          →
        </span>
      </Link>
    </li>
  );
}
