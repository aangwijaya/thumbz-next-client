"use client";

import { useEffect, useState } from "react";

import { Container } from "@/components/ui/Container";

interface HeaderShellProps {
  logo: React.ReactNode;
  nav: React.ReactNode;
  actions: React.ReactNode;
  /** Links shown in the phone menu. */
  drawer: React.ReactNode;
}

// Sticky header. The bottom border only appears once the page has scrolled,
// and below 900px the nav moves into a menu that opens under the bar.
export function HeaderShell({ logo, nav, actions, drawer }: HeaderShellProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b bg-paper pt-[env(safe-area-inset-top)] text-ink transition-colors duration-200 ${
        scrolled ? "border-stone" : "border-transparent"
      }`}
      onKeyDown={(event) => {
        if (event.key === "Escape") setMenuOpen(false);
      }}
    >
      <Container size="page" className="flex h-[68px] items-center gap-6">
        {logo}
        <div className="mx-auto hidden min-[901px]:block">{nav}</div>
        <div className="flex items-center gap-1 max-[900px]:ml-auto">
          {actions}
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={menuOpen}
            aria-controls="header-drawer"
            onClick={() => setMenuOpen((open) => !open)}
            className="grid size-11 place-items-center min-[641px]:size-10 rounded-lg text-pencil transition-colors hover:bg-cream hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember min-[901px]:hidden"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              className="size-[18px]"
            >
              <path d="M4 8h16M4 16h16" />
            </svg>
          </button>
        </div>
      </Container>

      {menuOpen ? (
        <div
          id="header-drawer"
          className="border-y border-stone bg-paper min-[901px]:hidden"
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("a, button")) setMenuOpen(false);
          }}
        >
          <Container size="page">
            <nav aria-label="Mobile" className="flex flex-col pb-3 pt-1">
              {drawer}
            </nav>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
