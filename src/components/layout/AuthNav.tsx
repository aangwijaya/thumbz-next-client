"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

interface AuthNavProps {
  isAuthed: boolean;
  asMenuItem?: boolean;
  className?: string;
}

export function AuthNav({ isAuthed, asMenuItem = false, className = "" }: AuthNavProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const classes = asMenuItem
    ? `rounded-sm px-3 py-2 text-left text-sm transition-colors hover:bg-black/5 ${className}`
    : `text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-page-light-text ${className}`;

  if (!isAuthed) {
    return (
      <Link
        href="/login"
        className={`${classes} text-page-light-text-secondary hover:text-page-light-text font-medium`}
      >
        Login
      </Link>
    );
  }

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
      className={`${classes} text-page-light-text-secondary hover:text-page-light-text disabled:opacity-60`}
    >
      {pending ? "Signing out…" : "Logout"}
    </button>
  );
}
