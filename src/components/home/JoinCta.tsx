import Link from "next/link";

import { Waves } from "@/components/home/Waves";
import { Container } from "@/components/ui/Container";
import { PrimaryLink } from "@/components/ui/PrimaryLink";

const perks = [
  "Your teams first on the home page",
  "Resume any stream or replay",
  "Chat during live matches",
];

// Shown to visitors who are not signed in.
export function JoinCta() {
  return (
    <section
      id="join"
      aria-labelledby="join-title"
      className="relative isolate mt-[clamp(8px,1vw,16px)] bg-cream py-[clamp(56px,7vw,104px)] text-center"
    >
      <Waves className="top-0 h-full" />

      <Container size="page" className="flex flex-col items-center gap-4">
        <p className="text-caption font-semibold text-deep-ember">Free account</p>
        <h2
          id="join-title"
          className="text-balance font-graphik text-[clamp(28px,calc(2.2vw+8px),38px)] font-bold leading-[1.2] tracking-[-0.005em] text-ink"
        >
          Follow your teams. Never miss a match.
        </h2>

        <ul className="mt-1 flex flex-col items-center gap-2.5 text-body-sm text-charcoal min-[641px]:flex-row min-[641px]:flex-wrap min-[641px]:justify-center min-[641px]:gap-x-6">
          {perks.map((perk) => (
            <li key={perk} className="flex items-center gap-2">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="size-4 text-forest"
              >
                <path d="m5 12 5 5 9-10" />
              </svg>
              {perk}
            </li>
          ))}
        </ul>

        <div className="mt-3 flex w-full max-w-[360px] flex-col gap-3 min-[641px]:w-auto min-[641px]:max-w-none min-[641px]:flex-row min-[641px]:items-center min-[641px]:justify-center min-[641px]:gap-4">
          <PrimaryLink href="/login?mode=register">Create free account</PrimaryLink>
          <Link
            href="/login"
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-stone bg-paper text-[15px] font-semibold text-ink transition-colors hover:border-charcoal min-[641px]:min-h-10 min-[641px]:border-0 min-[641px]:bg-transparent min-[641px]:p-2 min-[641px]:font-medium min-[641px]:hover:text-deep-ember focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember"
          >
            Log in
          </Link>
        </div>
      </Container>
    </section>
  );
}
