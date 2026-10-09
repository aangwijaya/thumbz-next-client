"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { LocalTime } from "@/components/ui/LocalTime";
import { fetchMyOrders, queryKeys } from "@/lib/api/endpoints";
import type { TicketOrderStatus } from "@/lib/api/types";
import { useSupabaseSession } from "@/lib/supabase/useSession";

import { formatMoney } from "./money";

const STATUS: Record<TicketOrderStatus, { label: string; tone: string }> = {
  pending: { label: "Awaiting payment", tone: "bg-cream text-deep-ember" },
  paid: { label: "Paid", tone: "bg-mint-wash text-forest" },
  expired: { label: "Expired", tone: "bg-ink/5 text-pencil" },
  cancelled: { label: "Cancelled", tone: "bg-ink/5 text-pencil" },
  failed: { label: "Failed", tone: "bg-ink/5 text-pencil" },
  refund_required: { label: "Refund pending", tone: "bg-sky-wash text-cobalt-link" },
};

export function OrdersList() {
  const { session, ready } = useSupabaseSession();
  const orders = useQuery({
    queryKey: queryKeys.myOrders(1),
    queryFn: () => fetchMyOrders(session!.token),
    enabled: Boolean(session),
  });

  if (!ready || orders.isLoading) {
    return <div className="h-40 rounded-image bg-stone/30 motion-safe:animate-pulse" aria-hidden="true" />;
  }
  if (orders.isError) return <p className="text-body text-pencil">Could not load your orders.</p>;
  const rows = orders.data?.data ?? [];
  if (rows.length === 0) {
    return (
      <p className="text-body text-pencil">
        No orders yet. Venue tickets are sold on match pages, e.g. from the{" "}
        <Link href="/matches?status=scheduled" className="font-semibold text-cobalt-link hover:underline">
          upcoming schedule
        </Link>
        .
      </p>
    );
  }
  return (
    <ul className="flex flex-col divide-y divide-stone rounded-image border border-stone">
      {rows.map((order) => {
        const status = STATUS[order.status] ?? STATUS.failed;
        return (
          <li key={order.id}>
            <Link href={`/me/orders/${order.id}`} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 hover:bg-cream focus-visible:outline-2 focus-visible:outline-deep-ember">
              <span className="flex flex-col">
                <span className="font-graphik font-semibold text-ink">
                  {order.quantity} ticket{order.quantity > 1 ? "s" : ""} ·{" "}
                  {formatMoney(order.payment?.amount ?? order.total_usd, order.payment?.currency ?? "USD")}
                </span>
                <span className="text-body-sm text-pencil">
                  <LocalTime iso={order.created_at} format="datetime" />
                  {order.payment?.method ? ` · ${order.payment.method.replace("va_", "VA ").toUpperCase()}` : ""}
                </span>
              </span>
              <span className={`rounded-md px-2 py-1 text-caption font-semibold ${status.tone}`}>{status.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
