import Link from "next/link";

import { LiveDot } from "@/components/ui/LiveDot";

interface StatusTab {
  label: string;
  href: string;
  active: boolean;
  count: number | null;
  live?: boolean;
}

/** All · Live · Upcoming · Results, with how many matches each holds. */
export function StatusTabs({ tabs }: { tabs: StatusTab[] }) {
  return (
    <nav
      aria-label="Match status"
      className="inline-flex gap-0.5 rounded-[10px] border border-stone bg-paper p-1 max-[640px]:w-full max-[640px]:overflow-x-auto max-[640px]:[scrollbar-width:none]"
    >
      {tabs.map((tab) => (
        <Link
          key={tab.label}
          href={tab.href}
          scroll={false}
          aria-current={tab.active ? "page" : undefined}
          className={`inline-flex min-h-9 shrink-0 items-center gap-[7px] whitespace-nowrap rounded-[7px] px-3.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember ${
            tab.active ? "bg-ink text-paper" : "text-charcoal hover:bg-cream hover:text-ink"
          }`}
        >
          {tab.live ? <LiveDot /> : null}
          {tab.label}
          {tab.count != null ? <span className="font-medium opacity-70">{tab.count}</span> : null}
        </Link>
      ))}
    </nav>
  );
}
