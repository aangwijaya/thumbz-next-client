import Link from "next/link";

import { Container } from "@/components/ui/Container";
import { LiveDot } from "@/components/ui/LiveDot";

export interface LeagueTab {
  key: string;
  label: string;
  /** Full tournament name, for the tooltip and screen readers. */
  title: string;
  href: string;
  active: boolean;
  live: number;
  /** A thin divider after this tab ("All" on the matches page). */
  divider?: boolean;
}

/**
 * One 44px row of tournament tabs under the header. It scrolls sideways when
 * there are more tournaments than fit; the page never does.
 */
export function LeagueBar({ tabs, allHref }: { tabs: LeagueTab[]; allHref?: string }) {
  if (tabs.length < 2) return null;
  return (
    <div className="sticky top-(--header-h) z-30 border-y border-y-stone/50 border-b-stone bg-paper/95 backdrop-blur-sm">
      <Container size="page" className="flex h-11 items-center gap-4 max-[640px]:px-0">
        <nav
          aria-label="Tournament"
          className="-ml-3 flex h-full min-w-0 flex-1 items-stretch gap-0.5 overflow-x-auto [scrollbar-width:none] max-[640px]:ml-0 max-[640px]:px-2 max-[640px]:[mask-image:linear-gradient(90deg,#000_calc(100%-40px),transparent)] [&::-webkit-scrollbar]:hidden"
        >
          {tabs.map((tab) => (
            <span key={tab.key} className="flex shrink-0 items-stretch">
              <Link
                href={tab.href}
                scroll={false}
                title={tab.title}
                aria-current={tab.active ? "page" : undefined}
                className={`relative inline-flex items-center gap-[7px] whitespace-nowrap px-3 font-graphik text-sm font-bold leading-none [word-spacing:0.14em] transition-colors after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:origin-left after:rounded-t-sm after:bg-ink after:transition-transform after:duration-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-deep-ember ${
                  tab.active ? "text-ink after:scale-x-100" : "text-pencil after:scale-x-0 hover:text-ink"
                }`}
              >
                {tab.label}
                {tab.live > 0 ? (
                  <span className="inline-flex items-center gap-[5px] font-body text-caption font-semibold text-deep-ember">
                    <LiveDot className="size-1.5 [&>span]:size-1.5" />
                    {tab.live}
                    <span className="sr-only"> live</span>
                  </span>
                ) : null}
              </Link>
              {tab.divider ? <span aria-hidden="true" className="mx-1.5 h-4 w-px self-center bg-stone" /> : null}
            </span>
          ))}
        </nav>
        {allHref ? (
          <Link
            href={allHref}
            className="shrink-0 whitespace-nowrap text-[13px] font-medium text-cobalt-link hover:underline hover:underline-offset-[3px] max-[640px]:hidden"
          >
            All tournaments →
          </Link>
        ) : null}
      </Container>
    </div>
  );
}
