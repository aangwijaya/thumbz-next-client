import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/ui/Container";

const navItems = [
  { href: "/live", label: "Live" },
  { href: "/matches", label: "Matches" },
  { href: "/tournaments", label: "Tournaments" },
  { href: "/teams", label: "Teams" },
  { href: "/players", label: "Players" },
];

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="text-sm text-page-light-text-secondary transition-colors hover:text-page-light-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-page-light-text"
    >
      {label}
    </Link>
  );
}

export function Header() {
  return (
    <header className="border-b border-page-light-border bg-page-light text-page-light-text">
      <Container size="wide" className="flex items-center justify-between gap-6 py-4">
        <Link
          href="/"
          className="font-display text-xl tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-page-light-text"
        >
          <Image
            src="/images/thumbz-icon.png"
            alt="THUMBZ"
            width={100}
            height={56}
            priority
            className="h-14 w-auto"
          />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
          <NavLink href="/search" label="Search" />
        </nav>

        <details className="group relative md:hidden">
          <summary className="flex cursor-pointer list-none items-center text-sm text-page-light-text-secondary transition-colors hover:text-page-light-text [&::-webkit-details-marker]:hidden">
            Menu
          </summary>
          <nav
            aria-label="Mobile"
            className="absolute right-0 top-full z-10 mt-2 flex min-w-40 flex-col gap-1 rounded-md border border-page-light-border bg-white p-2 shadow-sm"
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-sm px-3 py-2 text-sm text-page-light-text-secondary transition-colors hover:bg-black/5 hover:text-page-light-text"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/search"
              className="rounded-sm px-3 py-2 text-sm text-page-light-text-secondary transition-colors hover:bg-black/5 hover:text-page-light-text"
            >
              Search
            </Link>
          </nav>
        </details>
      </Container>
    </header>
  );
}
