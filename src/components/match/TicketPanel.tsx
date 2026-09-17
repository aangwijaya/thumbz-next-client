"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  cancelTicketOrder,
  fetchTicketOrder,
  postMatchOrder,
  queryKeys,
  useMatchTicket,
} from "@/lib/api/endpoints";
import { isApiError } from "@/lib/api/errors";
import type { TicketOrderDetail } from "@/lib/api/types";
import { useSupabaseSession } from "@/lib/supabase/useSession";
import { formatTime } from "@/lib/utils/format";

import { Skeleton } from "../ui/Skeleton";

const POLL_ORDER_MS = 5_000;

interface TicketPanelProps {
  matchId: string;
  className?: string;
}

function usd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function TicketPanel({ matchId, className = "" }: TicketPanelProps) {
  const { session, ready } = useSupabaseSession();
  const queryClient = useQueryClient();
  const availability = useMatchTicket(matchId);

  const [quantity, setQuantity] = useState(1);
  const [order, setOrder] = useState<TicketOrderDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const info = availability.data;

  useEffect(() => {
    if (!order || order.status !== "pending" || !session) return;
    const timer = setInterval(async () => {
      try {
        const updated = await fetchTicketOrder(order.id, session.token);
        setOrder(updated);
        if (updated.status !== "pending") {
          queryClient.invalidateQueries({ queryKey: queryKeys.matchTicket(matchId) });
        }
      } catch {
        // keep polling — transient errors must not lose the order view
      }
    }, POLL_ORDER_MS);
    return () => clearInterval(timer);
  }, [order, session, matchId, queryClient]);

  if (availability.isLoading) {
    return (
      <section className={`rounded-xl border border-page-dark-border bg-page-dark-surface p-4 sm:p-5 ${className}`}>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-4 h-16 w-full" />
      </section>
    );
  }

  if (!info) return null;

  const maxQuantity = Math.min(4, Math.max(info.quota_remaining ?? 0, 0));
  const quotaUsed = (info.quota_total ?? 0) - (info.quota_remaining ?? 0);
  const quotaPct = info.quota_total ? Math.round((quotaUsed / info.quota_total) * 100) : 0;
  const soldOut = (info.quota_remaining ?? 0) <= 0;

  async function handleBuy() {
    if (!session) return;
    setBusy(true);
    setNotice(null);
    try {
      const created = await postMatchOrder(matchId, quantity, session.token);
      setOrder({ ...created, tickets: [] });
      queryClient.invalidateQueries({ queryKey: queryKeys.matchTicket(matchId) });
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        setNotice("Session expired — please sign in again.");
      } else if (isApiError(error) && error.status === 422) {
        setNotice("Tickets are not available (sold out or per-user limit reached).");
        queryClient.invalidateQueries({ queryKey: queryKeys.matchTicket(matchId) });
      } else if (isApiError(error) && error.status === 503) {
        setNotice("Crypto checkout is temporarily unavailable. Please try again later.");
      } else {
        setNotice("Could not create your order. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    if (!session || !order) return;
    setBusy(true);
    try {
      await cancelTicketOrder(order.id, session.token);
      setOrder(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.matchTicket(matchId) });
    } catch {
      setNotice("Could not cancel the order. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function resetOrder() {
    setOrder(null);
    queryClient.invalidateQueries({ queryKey: queryKeys.matchTicket(matchId) });
  }

  return (
    <section
      id="tickets"
      className={`flex flex-col gap-4 rounded-xl border border-page-dark-border bg-page-dark-surface p-4 sm:p-5 ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-secondary">
          Venue tickets
        </h2>
        {info.on_sale ? (
          <span className="font-mono text-[10px] uppercase tracking-widest text-success">
            On sale
          </span>
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-widest text-text-secondary">
            {soldOut ? "Sold out" : "Sales closed"}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-base font-semibold">{info.venue_name ?? "Venue"}</p>
          <p className="mt-0.5 font-mono text-xs uppercase tracking-wider text-text-secondary">
            {[info.venue_city, `${usd(info.price_usd ?? 0)} / ticket`].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="min-w-40">
          <p className="text-right font-mono text-xs tabular-nums text-text-secondary">
            {info.quota_remaining ?? 0} / {info.quota_total ?? 0} left
          </p>
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-page-dark">
            <span
              className="block h-full bg-text-primary/70"
              style={{ width: `${quotaPct}%` }}
            />
          </div>
        </div>
      </div>

      {order ? (
        order.status === "paid" ? (
          <div className="flex flex-col gap-3 border-t border-page-dark-border pt-4">
            <p className="font-mono text-xs uppercase tracking-widest text-success">
              Payment confirmed — {order.quantity} ticket{order.quantity > 1 ? "s" : ""}
            </p>
            <ul className="flex flex-col gap-2">
              {(order.tickets ?? []).map((ticket) => (
                <li
                  key={ticket?.id}
                  className="flex items-center justify-between rounded-lg border border-page-dark-border bg-page-dark px-3 py-2"
                >
                  <span className="font-mono text-sm tracking-wider">{ticket?.code ?? "—"}</span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-text-secondary">
                    {ticket?.status ?? "valid"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : order.status === "pending" ? (
          <div className="flex flex-col gap-3 border-t border-page-dark-border pt-4">
            <p className="text-sm">
              {order.quantity} ticket{order.quantity > 1 ? "s" : ""} ·{" "}
              <span className="font-mono tabular-nums">{usd(order.total_usd ?? 0)}</span>
            </p>
            {order.payment?.invoice_url ? (
              <a
                href={order.payment.invoice_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit items-center gap-2 rounded-full bg-text-primary px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-text-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
              >
                Pay with crypto ↗
              </a>
            ) : null}
            <p className="font-mono text-[11px] uppercase tracking-wider text-text-secondary">
              Waiting for payment… held until {formatTime(order.expires_at ?? "")}
            </p>
            <button
              type="button"
              onClick={handleCancel}
              disabled={busy}
              className="w-fit font-mono text-[11px] uppercase tracking-widest text-text-secondary underline-offset-4 hover:text-error hover:underline disabled:opacity-60"
            >
              Cancel order
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 border-t border-page-dark-border pt-4">
            <p className="text-sm text-text-secondary">
              {order.status === "expired"
                ? "This order expired before payment completed."
                : order.status === "cancelled"
                  ? "This order was cancelled."
                  : "Payment failed for this order."}
            </p>
            <button
              type="button"
              onClick={resetOrder}
              className="w-fit rounded-full border border-page-dark-border px-4 py-2 font-mono text-[11px] uppercase tracking-widest transition-colors hover:border-text-secondary"
            >
              Check availability again
            </button>
          </div>
        )
      ) : info.on_sale ? (
        ready && !session ? (
          <Link
            href={`/login?next=${encodeURIComponent(`/matches/${matchId}`)}`}
            className="inline-flex w-fit items-center rounded-full bg-text-primary px-5 py-2 font-mono text-[11px] font-medium uppercase tracking-widest text-background transition-colors hover:bg-text-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
          >
            Log in to buy tickets
          </Link>
        ) : (
          <div className="flex flex-wrap items-center gap-3 border-t border-page-dark-border pt-4">
            <div className="flex gap-1 rounded-full border border-page-dark-border p-0.5">
              {[1, 2, 3, 4].slice(0, maxQuantity).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setQuantity(value)}
                  className={`size-8 rounded-full font-mono text-xs tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary ${
                    quantity === value
                      ? "bg-text-primary text-background"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleBuy}
              disabled={busy || maxQuantity === 0}
              className="inline-flex items-center gap-2 rounded-full bg-text-primary px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-text-primary/90 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
            >
              {busy ? "Reserving…" : `Buy ${quantity} · ${usd(quantity * (info.price_usd ?? 0))}`}
            </button>
          </div>
        )
      ) : (
        <p className="border-t border-page-dark-border pt-4 text-sm text-text-secondary">
          {soldOut
            ? "All tickets for this match have been sold."
            : "Ticket sales for this match are not open right now."}
        </p>
      )}

      {notice ? <p className="text-xs text-warning">{notice}</p> : null}
    </section>
  );
}
