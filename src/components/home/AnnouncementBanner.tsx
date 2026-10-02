"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Container } from "@/components/ui/Container";
import { LiveDot } from "@/components/ui/LiveDot";

interface AnnouncementBannerProps {
  message: string;
  linkLabel: string;
  href: string;
}

export function AnnouncementBanner({ message, linkLabel, href }: AnnouncementBannerProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);

  // The slot keeps its last content while navigating to other pages, so the
  // banner hides itself anywhere but the home page.
  if (!open || pathname !== "/") return null;

  return (
    <aside aria-label="Announcement" className="border-b border-stone bg-cream">
      <Container size="page" className="relative">
        <div className="flex min-h-11 items-center justify-center gap-x-2.5 px-9 py-1.5 text-center text-[15px] text-ink min-[641px]:flex-wrap min-[641px]:px-10">
          <LiveDot className="min-[641px]:hidden" />
          <p className="max-[640px]:hidden">{message}</p>
          <Link
            href={href}
            className="min-w-0 truncate rounded-lg font-shantell text-[17px] leading-snug text-deep-ember hover:underline hover:underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember min-[641px]:text-[19px]"
          >
            {linkLabel} →
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Dismiss announcement"
          className="absolute right-1 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-lg text-pencil transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember min-[641px]:right-4 min-[641px]:size-10 lg:right-6"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="size-4"
          >
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </Container>
    </aside>
  );
}
