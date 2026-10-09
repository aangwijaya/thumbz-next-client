"use client";

import Link from "next/link";

import { AccountMenu, LogoutButton } from "@/components/layout/AccountMenu";
import { useSupabaseSession } from "@/lib/supabase/useSession";

/**
 * The signed-in part of the header, resolved in the browser so the header
 * (and every page under it) can be statically rendered. A fixed-size
 * placeholder holds the space until the session is known (no layout shift).
 */
export function AccountArea({ linkClassName }: { linkClassName: string }) {
  const { session, ready } = useSupabaseSession();
  if (!ready) {
    return <span aria-hidden="true" className="inline-block h-10 w-10 max-[900px]:hidden min-[901px]:w-[150px]" />;
  }
  if (session) return <AccountMenu initial={session.initial} />;
  return (
    <>
      <Link href="/login" className={linkClassName}>
        Log in
      </Link>
      <Link href="/login?mode=register" className={linkClassName}>
        Sign up
      </Link>
    </>
  );
}

export function DrawerAccountLink({ className }: { className: string }) {
  const { session, ready } = useSupabaseSession();
  if (!ready) return null;
  return session ? (
    <LogoutButton className={className} />
  ) : (
    <Link href="/login" className={className}>
      Log in
    </Link>
  );
}
