import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/ui/Container";

// Sections that only exist on the home page link to it, so the footer works on
// every page. The Account links go through login until those pages exist.
const columns = [
  {
    title: "Watch",
    links: [
      { href: "/#live-now", label: "Live" },
      { href: "/#schedule", label: "Schedule" },
      { href: "/#replays", label: "Replays" },
    ],
  },
  {
    title: "Explore",
    links: [
      { href: "/tournaments", label: "Tournaments" },
      { href: "/#teams", label: "Teams" },
      { href: "/#teams", label: "Players" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Log in" },
      { href: "/login", label: "Favorites" },
      { href: "/me/tickets", label: "Tickets" },
      { href: "/me/orders", label: "Orders" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-stone bg-cream pb-7 pt-10 text-ink min-[641px]:pb-8 min-[641px]:pt-14">
      <Container size="page">
        <div className="grid grid-cols-2 gap-x-4 gap-y-7 min-[761px]:grid-cols-[2fr_repeat(3,1fr)] min-[761px]:gap-8">
          <div className="col-span-full min-[761px]:col-auto">
            <Link
              href="/"
              aria-label="THUMBZ home"
              className="inline-block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember"
            >
              <Image
                src="/images/thumbz-logo.png"
                alt="THUMBZ"
                width={1080}
                height={154}
                sizes="182px"
                className="h-[26px] w-auto"
              />
            </Link>
            <p className="mt-3.5 max-w-[32ch] text-body-sm text-pencil">
              Live Mobile Legends tournaments, replays and stats in one place.
            </p>
          </div>

          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="mb-1 text-body-sm font-semibold text-ink min-[641px]:mb-3">{column.title}</h2>
              <ul className="flex flex-col text-[15px] text-pencil min-[641px]:gap-2 min-[641px]:text-body-sm">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="block rounded-lg py-2.5 transition-colors hover:text-deep-ember min-[641px]:inline min-[641px]:py-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap justify-between gap-4 border-t border-stone pt-6 text-[13px] text-pencil min-[641px]:mt-12">
          <span>© {new Date().getFullYear()} THUMBZ</span>
        </div>
      </Container>
    </footer>
  );
}
