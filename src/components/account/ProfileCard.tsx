"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { LogoutButton } from "@/components/layout/AccountMenu";
import { Badge } from "@/components/ui/Badge";
import { LocalTime } from "@/components/ui/LocalTime";
import { fetchMe, queryKeys } from "@/lib/api/endpoints";
import { useSupabaseSession } from "@/lib/supabase/useSession";

const LINKS = [
  { href: "/favorites", label: "Favorites", hint: "Teams and players you follow" },
  { href: "/history", label: "Watch history", hint: "Pick up where you left off" },
  { href: "/me/tickets", label: "Tickets", hint: "QR codes for the venue gate" },
  { href: "/me/orders", label: "Orders", hint: "Payments and receipts" },
];

/** Read-only: the API has no profile update endpoint (contract §6.8). */
export function ProfileCard() {
  const { session, ready } = useSupabaseSession();
  const me = useQuery({
    queryKey: queryKeys.me(),
    queryFn: () => fetchMe(session!.token),
    enabled: Boolean(session),
  });

  if (!ready || me.isLoading) {
    return <div className="h-40 rounded-image bg-stone/30 motion-safe:animate-pulse" aria-hidden="true" />;
  }
  if (me.isError) {
    return <p role="alert" className="text-body text-pencil">We could not load your profile. Refresh to try again.</p>;
  }
  const profile = me.data;
  const name = profile?.username || "THUMBZ fan";

  return (
    <div className="flex flex-col gap-8">
      <section className="flex items-center gap-5 rounded-image border border-stone bg-paper p-5 shadow-subtle">
        <span
          aria-hidden="true"
          className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-cream font-graphik text-[26px] font-bold text-deep-ember"
        >
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- avatar host is user-provided (OAuth), not in the image allow-list
            <img src={profile.avatar_url} alt="" className="size-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            (session?.initial ?? name.charAt(0)).toUpperCase()
          )}
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <p className="flex items-center gap-2 truncate font-graphik text-body-lg font-bold text-ink">
            {name}
            {profile?.role === "admin" ? <Badge tone="blue">Admin</Badge> : null}
          </p>
          {profile?.created_at ? (
            <p className="text-body-sm text-pencil">
              Member since <LocalTime iso={profile.created_at} format="date" />
            </p>
          ) : null}
        </div>
      </section>

      <nav aria-label="Your account">
        <ul className="grid gap-3 min-[641px]:grid-cols-2">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="flex flex-col gap-0.5 rounded-image border border-stone bg-paper p-4 transition-colors hover:border-ink/30 hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember"
              >
                <span className="font-graphik text-body font-bold text-ink">{link.label}</span>
                <span className="text-body-sm text-pencil">{link.hint}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <LogoutButton className="min-h-11 w-fit rounded-lg border border-stone px-4 text-body-sm font-semibold text-ink transition-colors hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember" />
    </div>
  );
}
