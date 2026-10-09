import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offline",
  robots: { index: false },
};

/** Served by the service worker when a page is requested without a connection. */
export default function OfflinePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-paper px-4 py-24 text-center">
      <p className="text-caption font-semibold uppercase tracking-[0.14em] text-deep-ember">Offline</p>
      <h1 className="font-graphik text-[clamp(26px,calc(1.8vw+12px),36px)] font-bold text-ink">
        You&apos;re not connected
      </h1>
      <p className="max-w-md text-body text-pencil">
        Pages you opened recently still work. Live scores, chat and checkout come back as soon as you&apos;re online.
      </p>
      {/* A full navigation (not <Link>) re-tries the network through the service worker. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a
        href="/"
        className="mt-2 inline-flex min-h-11 items-center rounded-lg bg-ink px-5 text-body-sm font-semibold text-paper transition-colors hover:bg-ink/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember"
      >
        Try again
      </a>
    </div>
  );
}
