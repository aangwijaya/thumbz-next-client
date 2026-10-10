import Image from "next/image";
import Link from "next/link";

import { AccountArea, DrawerAccountLink } from "@/components/layout/AccountArea";
import { HeaderShell } from "@/components/layout/HeaderShell";
import { InstallDrawerRow, InstallPill } from "@/components/pwa/InstallApp";
import { SearchCommand } from "@/components/search/SearchCommand";
import { SpoilerToggle } from "@/components/spoiler/SpoilerToggle";
import { Badge } from "@/components/ui/Badge";
import { LiveDot } from "@/components/ui/LiveDot";
import { apiFetch } from "@/lib/api/client";
import type { ApiEnvelope, MatchSummary } from "@/lib/api/types";

const navItems = [
  { href: "/live", label: "Live" },
  { href: "/matches", label: "Matches" },
  { href: "/tournaments", label: "Tournaments" },
  { href: "/teams", label: "Teams" },
  { href: "/videos", label: "Replays" },
];

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember";

const ghostLink = `inline-flex items-center gap-1.5 rounded-lg p-2 text-[15px] font-medium text-ink transition-colors hover:text-deep-ember max-[900px]:hidden ${focusRing}`;

const drawerLink =
  "flex items-center justify-between border-b border-[#eeecea] py-3 text-left font-graphik font-semibold text-ink last:border-b-0";

// How many matches are live right now. A missing count just hides the badge.
async function fetchLiveCount(): Promise<number> {
  try {
    const response = await apiFetch<ApiEnvelope<MatchSummary[]>>(
      "/matches/live?pageSize=1",
      { next: { revalidate: 15 } },
    );
    return response?.meta?.total ?? response?.data?.length ?? 0;
  } catch {
    return 0;
  }
}

export async function Header() {
  const liveCount = await fetchLiveCount();

  const logo = (
    <Link href="/" aria-label="THUMBZ home" className={`rounded-lg ${focusRing}`}>
      <Image
        src="/images/thumbz-logo.png"
        alt="THUMBZ"
        width={1080}
        height={154}
        priority
        sizes="182px"
        className="h-[26px] w-auto"
      />
    </Link>
  );

  const nav = (
    <nav aria-label="Primary" className="flex items-center gap-1">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 font-graphik text-body font-semibold text-ink transition-colors hover:bg-cream ${focusRing}`}
        >
          {item.label === "Live" && liveCount > 0 ? (
            <>
              <LiveDot />
              Live
              <span className="rounded-md bg-cream px-1.5 py-px font-body text-caption font-semibold text-deep-ember">
                {liveCount}
              </span>
            </>
          ) : (
            item.label
          )}
        </Link>
      ))}
    </nav>
  );

  const actions = (
    <>
      <SpoilerToggle variant="icon" />
      <SearchCommand
        triggerClassName={`grid size-11 place-items-center min-[641px]:size-10 rounded-lg text-pencil transition-colors hover:bg-cream hover:text-ink ${focusRing}`}
      />
      <AccountArea linkClassName={ghostLink} />
      <InstallPill />
    </>
  );

  const drawer = (
    <>
      {navItems.map((item) => (
        <Link key={item.href} href={item.href} className={drawerLink}>
          {item.label}
          {item.label === "Live" && liveCount > 0 ? (
            <Badge tone="ember">
              <LiveDot />
              {liveCount} on air
            </Badge>
          ) : null}
        </Link>
      ))}
      <InstallDrawerRow className={drawerLink} />
      <DrawerAccountLink className={drawerLink} />
    </>
  );

  return <HeaderShell logo={logo} nav={nav} actions={actions} drawer={drawer} />;
}
