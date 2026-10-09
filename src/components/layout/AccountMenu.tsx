"use client";

import Link from "next/link";
import { useState } from "react";


const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember";

export function LogoutButton({ className = "" }: { className?: string }) {
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // session already gone or env unavailable — fall through
    }
    // Full navigation: pages prefetched while signed in must not linger in
    // the client Router Cache after sign-out.
    window.location.assign("/");
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      className={`${className} disabled:opacity-60`}
    >
      {pending ? "Signing out…" : "Log out"}
    </button>
  );
}

// Avatar with a small account menu.
export function AccountMenu({ initial }: { initial: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative ml-1.5"
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        type="button"
        aria-label="Your account"
        aria-expanded={open}
        aria-controls="account-menu"
        onClick={() => setOpen((value) => !value)}
        className={`grid size-8 place-items-center rounded-full border border-stone bg-cream text-[13px] font-semibold text-ink ${focusRing}`}
      >
        {initial}
      </button>
      {open ? (
        <div
          id="account-menu"
          className="absolute right-0 top-full z-10 mt-2 min-w-36 rounded-lg border border-stone bg-paper p-1 shadow-subtle"
        >
          {[
            { href: "/profile", label: "Profile" },
            { href: "/favorites", label: "Favorites" },
            { href: "/history", label: "Watch history" },
            { href: "/me/tickets", label: "Your tickets" },
            { href: "/me/orders", label: "Orders" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`block rounded-lg px-3 py-2 text-body-sm font-medium text-ink transition-colors hover:bg-cream ${focusRing}`}
            >
              {item.label}
            </Link>
          ))}
          <LogoutButton
            className={`w-full rounded-lg px-3 py-2 text-left text-body-sm font-medium text-ink transition-colors hover:bg-cream ${focusRing}`}
          />
        </div>
      ) : null}
    </div>
  );
}
