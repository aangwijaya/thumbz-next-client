"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { MethodPicker } from "@/components/checkout/MethodPicker";
import { formatMoney } from "@/components/checkout/money";
import { PaymentInstructions } from "@/components/checkout/PaymentInstructions";
import { TicketQrList } from "@/components/checkout/TicketQrList";
import { useOrder } from "@/components/checkout/useOrder";
import { cancelTicketOrder, postMatchOrder, queryKeys, useMatchTicket } from "@/lib/api/endpoints";
import { isApiError } from "@/lib/api/errors";
import type { PaymentMethod } from "@/lib/api/types";
import { useSupabaseSession } from "@/lib/supabase/useSession";

import { Skeleton } from "../ui/Skeleton";

interface TicketPanelProps {
  matchId: string;
  className?: string;
}

const primary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-deep-ember px-5 text-body-sm font-semibold text-paper transition-colors hover:bg-deep-ember/90 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember";

/** sessionStorage key so a refresh resumes the order being paid. */
const resumeKey = (matchId: string) => `thumbz:order:${matchId}`;

function readResume(matchId: string): string | null {
  try {
    return sessionStorage.getItem(resumeKey(matchId));
  } catch {
    return null;
  }
}

function writeResume(matchId: string, orderId: string | null) {
  try {
    if (orderId) sessionStorage.setItem(resumeKey(matchId), orderId);
    else sessionStorage.removeItem(resumeKey(matchId));
  } catch {
    // storage unavailable: resuming is a convenience
  }
}

export function TicketPanel({ matchId, className = "" }: TicketPanelProps) {
  const { session, ready } = useSupabaseSession();
  const queryClient = useQueryClient();
  const availability = useMatchTicket(matchId);
  const info = availability.data;
  const methods = info?.payment_methods ?? [];

  const [quantity, setQuantity] = useState(1);
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  // One key per purchase attempt: retries of the same click replay, never duplicate.
  const attemptKey = useRef<string | null>(null);

  useEffect(() => setOrderId(readResume(matchId)), [matchId]);
  const order = useOrder(orderId).data;
  const selected = method ?? methods[0]?.method ?? null;

  if (availability.isLoading) {
    return (
      <section className={`rounded-xl border border-stone bg-paper p-4 shadow-subtle sm:p-5 ${className}`}>
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
  const option = methods.find((item) => item.method === selected);

  async function handleBuy() {
    if (!session || !selected) return;
    setBusy(true);
    setNotice(null);
    attemptKey.current ??= crypto.randomUUID();
    try {
      const created = await postMatchOrder(
        matchId,
        { quantity, payment_method: selected },
        session.token,
        attemptKey.current,
      );
      attemptKey.current = null;
      queryClient.setQueryData(queryKeys.order(created.id), { ...created, tickets: [] });
      setOrderId(created.id);
      writeResume(matchId, created.id);
      void queryClient.invalidateQueries({ queryKey: queryKeys.matchTicket(matchId) });
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        setNotice("Session expired — please sign in again.");
      } else if (isApiError(error) && error.status === 422) {
        attemptKey.current = null;
        setNotice(error.message || "Tickets are not available (sold out or per-user limit reached).");
        void queryClient.invalidateQueries({ queryKey: queryKeys.matchTicket(matchId) });
      } else if (isApiError(error) && error.status === 503) {
        setNotice("This payment method is temporarily unavailable. Try another one.");
      } else {
        setNotice("Could not create your order. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    if (!session || !orderId) return;
    setBusy(true);
    try {
      await cancelTicketOrder(orderId, session.token);
      reset();
    } catch {
      setNotice("Could not cancel the order. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setOrderId(null);
    writeResume(matchId, null);
    void queryClient.invalidateQueries({ queryKey: queryKeys.matchTicket(matchId) });
  }

  return (
    <section
      id="tickets"
      aria-labelledby="tickets-title"
      className={`flex flex-col gap-4 rounded-xl border border-stone bg-paper p-4 shadow-subtle sm:p-5 ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="tickets-title" className="font-graphik text-body-lg font-bold text-ink">
          Venue tickets
        </h2>
        <span className={`text-caption font-semibold ${info.on_sale ? "text-forest" : "text-pencil"}`}>
          {info.on_sale ? "On sale" : soldOut ? "Sold out" : "Sales closed"}
        </span>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-body font-semibold">{info.venue_name ?? "Venue"}</p>
          <p className="mt-0.5 text-body-sm text-pencil">
            {[
              info.venue_city,
              info.price_idr ? `${formatMoney(info.price_idr, "IDR")} / ticket` : null,
              `${formatMoney(info.price_usd, "USD")} in crypto`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="min-w-40">
          <p className="text-right text-caption tabular-nums text-pencil">
            {info.quota_remaining ?? 0} / {info.quota_total ?? 0} left
          </p>
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-cream" aria-hidden="true">
            <span className="block h-full bg-ink/70" style={{ width: `${quotaPct}%` }} />
          </div>
        </div>
      </div>

      {order ? (
        <div className="flex flex-col gap-4 border-t border-stone pt-4">
          <PaymentInstructions order={order} methods={methods} />
          {order.status === "paid" ? <TicketQrList tickets={order.tickets ?? []} /> : null}
          <div className="flex flex-wrap items-center gap-4 text-body-sm">
            <Link href={`/me/orders/${order.id}`} className="font-semibold text-cobalt-link hover:underline">
              Order details
            </Link>
            {order.status === "pending" ? (
              <button type="button" onClick={() => void handleCancel()} disabled={busy} className="text-pencil hover:text-deep-ember hover:underline disabled:opacity-60">
                Cancel order
              </button>
            ) : (
              <button type="button" onClick={reset} className="text-pencil hover:text-ink hover:underline">
                Buy more tickets
              </button>
            )}
          </div>
        </div>
      ) : info.on_sale ? (
        ready && !session ? (
          <Link href={`/login?next=${encodeURIComponent(`/matches/${matchId}#tickets`)}`} className={`${primary} w-fit`}>
            Log in to buy tickets
          </Link>
        ) : methods.length === 0 ? (
          <p className="border-t border-stone pt-4 text-body-sm text-pencil">
            Checkout is temporarily unavailable. Please check back soon.
          </p>
        ) : (
          <div className="flex flex-col gap-4 border-t border-stone pt-4">
            <div className="flex items-center gap-3">
              <span className="text-caption font-semibold text-pencil">Tickets</span>
              <div role="radiogroup" aria-label="Number of tickets" className="flex gap-1 rounded-lg border border-stone p-0.5">
                {[1, 2, 3, 4].slice(0, maxQuantity).map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={quantity === value}
                    onClick={() => setQuantity(value)}
                    className={`size-10 rounded-md text-body-sm font-semibold tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember ${
                      quantity === value ? "bg-ink text-paper" : "text-pencil hover:text-ink"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
            <MethodPicker options={methods} value={selected} onChange={setMethod} quantity={quantity} />
            <button type="button" onClick={() => void handleBuy()} disabled={busy || maxQuantity === 0 || !option} className={`${primary} w-fit`}>
              {busy
                ? "Reserving…"
                : `Reserve ${quantity} · ${formatMoney((option?.unit_amount ?? 0) * quantity, option?.currency)}`}
            </button>
            <p className="text-caption text-pencil">Seats are held for 30 minutes while you pay.</p>
          </div>
        )
      ) : (
        <p className="border-t border-stone pt-4 text-body-sm text-pencil">
          {soldOut ? "All tickets for this match have been sold." : "Ticket sales for this match are not open right now."}
        </p>
      )}

      {notice ? (
        <p role="alert" className="text-body-sm text-deep-ember">
          {notice}
        </p>
      ) : null}
    </section>
  );
}
