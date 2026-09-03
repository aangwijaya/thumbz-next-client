import Link from "next/link";

import { Container } from "@/components/ui/Container";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <Container className="flex flex-col gap-2 py-8 md:flex-row md:items-center md:justify-between">
        <Link
          href="/"
          className="font-display text-lg tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-text-primary"
        >
          THUMBZ
        </Link>
        <p className="text-xs text-text-secondary">
          Premium Mobile Legends esports streaming and content platform.
        </p>
        <p className="text-xs text-text-secondary">
          © {new Date().getFullYear()} THUMBZ
        </p>
      </Container>
    </footer>
  );
}
