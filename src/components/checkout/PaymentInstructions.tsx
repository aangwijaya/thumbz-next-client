"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";

import { useToast } from "@/components/ui/Toast";
import { postOrderPayment, queryKeys, simulatePayment } from "@/lib/api/endpoints";
import { isApiError } from "@/lib/api/errors";
import type { PaymentMethod, PaymentMethodOption, TicketOrderDetail } from "@/lib/api/types";
import { useSupabaseSession } from "@/lib/supabase/useSession";

import { formatMoney } from "./money";
import { QrCode } from "./QrCode";
import { useCountdown } from "./useCountdown";

const button =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-body-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember disabled:opacity-60";

const STATUS_COPY: Record<string, string> = {
  paid: "Payment received — your tickets are below.",
  expired: "The hold expired before payment arrived.",
  cancelled: "This order was cancelled.",
  failed: "Payment failed for this order.",
  refund_required: "Payment arrived after the seats were gone. It will be refunded.",
};

interface PaymentInstructionsProps {
  order: TicketOrderDetail;
  /** Methods offered for this match, to switch to while pending. */
  methods?: PaymentMethodOption[];
}

/** What the buyer must do now: scan QRIS, transfer to a VA, or open the crypto invoice. */
export function PaymentInstructions({ order, methods = [] }: PaymentInstructionsProps) {
  const { session } = useSupabaseSession();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const switchKey = useRef<string | null>(null);
  const payment = order.payment;
  const countdown = useCountdown(order.status === "pending" ? order.expires_at : null);

  if (order.status !== "pending") {
    return (
      <p role="status" className={`text-body ${order.status === "paid" ? "text-forest" : "text-pencil"}`}>
        {STATUS_COPY[order.status] ?? "This order is closed."}
      </p>
    );
  }

  const amount = formatMoney(payment?.amount ?? order.total_usd, payment?.currency ?? "USD");
  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.order(order.id) });

  async function switchTo(method: PaymentMethod) {
    if (!session) return;
    setBusy(true);
    switchKey.current ??= crypto.randomUUID();
    try {
      await postOrderPayment(order.id, method, session.token, switchKey.current);
      switchKey.current = null;
      await refresh();
    } catch (error) {
      toast(isApiError(error) && error.status === 503 ? "That method is unavailable right now." : "Could not switch method. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function simulate() {
    if (!session || !payment?.id) return;
    setBusy(true);
    try {
      await simulatePayment(payment.id, session.token);
      await refresh();
    } catch {
      toast("Simulation failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast("Copied");
    } catch {
      toast("Copy failed — select the number instead.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-graphik text-body-lg font-bold text-ink">
          Pay {amount}
          {payment?.method === "qris" ? " with QRIS" : payment?.bank ? ` to ${payment.bank} VA` : ""}
        </p>
        {countdown.label ? (
          <p className="text-body-sm text-pencil" aria-live="off">
            Seats held for <b className="tabular-nums text-ink">{countdown.label}</b>
          </p>
        ) : null}
      </div>

      {payment?.kind === "qr" && payment.qr_string ? (
        <div className="flex flex-col items-start gap-3 min-[641px]:flex-row min-[641px]:items-center">
          <QrCode value={payment.qr_string} label={`QRIS code to pay ${amount}`} />
          <ol className="list-decimal pl-5 text-body-sm text-charcoal">
            <li>Open any banking or e-wallet app (GoPay, OVO, DANA, m-banking…).</li>
            <li>Choose Scan / QRIS and scan this code.</li>
            <li>Check the amount is {amount} and confirm.</li>
          </ol>
        </div>
      ) : payment?.kind === "va" && payment.va_number ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-stone bg-cream px-4 py-3">
            <span className="text-body-sm text-pencil">{payment.bank} virtual account</span>
            <b className="font-mono text-body-lg tracking-wider text-ink select-all">{payment.va_number}</b>
            <button type="button" onClick={() => void copy(payment.va_number!)} className={`${button} border border-stone bg-paper text-ink hover:bg-cream`}>
              Copy
            </button>
          </div>
          <ol className="list-decimal pl-5 text-body-sm text-charcoal">
            <li>Open {payment.bank} m-banking or internet banking.</li>
            <li>Choose Transfer → Virtual Account and enter the number above.</li>
            <li>Pay exactly {amount}; the order confirms automatically.</li>
          </ol>
        </div>
      ) : payment?.invoice_url ? (
        <a href={payment.invoice_url} target="_blank" rel="noreferrer" className={`${button} w-fit bg-deep-ember text-paper hover:bg-deep-ember/90`}>
          Continue to crypto checkout ↗
        </a>
      ) : null}

      <p role="status" className="flex items-center gap-2 text-body-sm text-pencil">
        <span aria-hidden="true" className="size-2 rounded-full bg-deep-ember motion-safe:animate-pulse" />
        Waiting for payment — this page updates by itself.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        {payment?.provider === "sandbox" ? (
          <button type="button" onClick={() => void simulate()} disabled={busy} className={`${button} bg-ink text-paper hover:bg-charcoal`}>
            Simulate payment (sandbox)
          </button>
        ) : null}
        {methods.length > 1 ? (
          <label className="flex items-center gap-2 text-body-sm text-pencil">
            Pay another way
            <select
              disabled={busy}
              value=""
              onChange={(event) => void switchTo(event.target.value as PaymentMethod)}
              className="min-h-11 rounded-lg border border-stone bg-paper px-2 text-ink"
            >
              <option value="" disabled>
                Choose…
              </option>
              {methods
                .filter((option) => option.method !== payment?.method)
                .map((option) => (
                  <option key={option.method} value={option.method}>
                    {option.label}
                  </option>
                ))}
            </select>
          </label>
        ) : null}
      </div>
    </div>
  );
}
