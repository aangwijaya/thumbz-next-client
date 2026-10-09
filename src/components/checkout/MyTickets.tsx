"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { LocalTime } from "@/components/ui/LocalTime";
import { fetchMyTickets, queryKeys } from "@/lib/api/endpoints";
import type { MatchTicket } from "@/lib/api/types";
import { useSupabaseSession } from "@/lib/supabase/useSession";

import { TicketQrList } from "./TicketQrList";

export function MyTickets() {
  const { session, ready } = useSupabaseSession();
  const tickets = useQuery({
    queryKey: queryKeys.myTickets(1),
    queryFn: () => fetchMyTickets(session!.token),
    enabled: Boolean(session),
  });
  if (!ready || tickets.isLoading) {
    return <div className="h-48 rounded-image bg-stone/30 motion-safe:animate-pulse" aria-hidden="true" />;
  }
  const rows = tickets.data?.data ?? [];
  if (rows.length === 0) {
    return <p className="text-body text-pencil">No tickets yet. Paid orders appear here with their QR codes.</p>;
  }
  // Group by match: one block per event.
  const byMatch = new Map<string, MatchTicket[]>();
  for (const ticket of rows) byMatch.set(ticket.match_id, [...(byMatch.get(ticket.match_id) ?? []), ticket]);
  return (
    <div className="flex flex-col gap-10">
      {[...byMatch.values()].map((group) => {
        const match = group[0]?.match;
        return (
          <section key={group[0]!.match_id} className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-graphik text-body-lg font-bold text-ink">
                <Link href={`/matches/${group[0]!.match_id}`} className="hover:text-deep-ember">
                  {match ? `${match.team_a?.name ?? "TBD"} vs ${match.team_b?.name ?? "TBD"}` : "Match"}
                </Link>
              </h2>
              {match?.scheduled_at ? (
                <span className="text-body-sm text-pencil">
                  <LocalTime iso={match.scheduled_at} format="datetime" />
                </span>
              ) : null}
            </div>
            <TicketQrList tickets={group} />
          </section>
        );
      })}
    </div>
  );
}
