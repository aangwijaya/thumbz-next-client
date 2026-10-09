"use client";

import "./globals.css";

/**
 * Last-resort boundary for errors in the root layout itself (header, providers).
 * It replaces the whole document, so it renders its own <html> and <body>.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-paper px-4 text-center text-ink">
        <p className="text-caption font-semibold uppercase tracking-[0.14em] text-deep-ember">Error</p>
        <h1 className="font-graphik text-[28px] font-bold">THUMBZ hit a problem</h1>
        <p className="max-w-md text-body text-pencil">Something broke while loading the app. Trying again usually fixes it.</p>
        <button
          type="button"
          onClick={reset}
          className="mt-2 inline-flex min-h-11 items-center rounded-lg bg-ink px-5 text-body-sm font-semibold text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
