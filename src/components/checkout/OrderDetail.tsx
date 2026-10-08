"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { fetchData, queryKeys } from "@/lib/api/endpoints";
import type { TicketAvailability } from "@/lib/api/types";

import { PaymentInstructions } from "./PaymentInstructions";
import { TicketQrList } from "./TicketQrList";
import { useOrder } from "./useOrder";

/** Order page: where gateways send buyers back, and where pending orders resume. */
export function OrderDetail({ orderId }: { orderId: string }) {
  const order = useOrder(orderId);
  const matchId = order.data?.match_id;
  const availability = useQuery({
    queryKey: queryKeys.matchTicket(matchId ?? "none"),
    queryFn: () => fetchData<TicketAvailability | null>(`/matches/${matchId}/ticket`),
    enabled: Boolean(matchId) && order.data?.status === "pending",
  });

  if (order.isLoading || !order.data) {
    return order.isError ? (
      <p className="text-body text-pencil">This order could not be found.</p>
    ) : (
      <div className="h-64 rounded-image bg-stone/30 motion-safe:animate-pulse" aria-hidden="true" />
    );
  }
  const data = order.data;
  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-image border border-stone p-5">
        <PaymentInstructions order={data} methods={availability.data?.payment_methods ?? []} />
      </section>
      {data.status === "paid" ? (
        <section aria-labelledby="tickets-title" className="flex flex-col gap-4">
          <h2 id="tickets-title" className="font-graphik text-subheading font-bold text-ink">
            Your tickets
          </h2>
          <p className="text-body-sm text-pencil">Show these QR codes at the venue gate. Each is valid once.</p>
          <TicketQrList tickets={data.tickets ?? []} />
        </section>
      ) : null}
      <Link href={`/matches/${data.match_id}`} className="w-fit font-semibold text-cobalt-link hover:underline">
        ← Back to the match
      </Link>
    </div>
  );
}
