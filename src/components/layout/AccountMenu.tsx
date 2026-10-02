"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember";

export function LogoutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // session already gone or env unavailable — fall through
    }
    router.push("/");
    router.refresh();
    setPending(false);
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

// Avatar with a small menu. The design has no account page yet, so the menu
// only holds Log out.
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
          <LogoutButton
            className={`w-full rounded-lg px-3 py-2 text-left text-body-sm font-medium text-ink transition-colors hover:bg-cream ${focusRing}`}
          />
        </div>
      ) : null}
    </div>
  );
}
