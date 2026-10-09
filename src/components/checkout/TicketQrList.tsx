import type { MatchTicket } from "@/lib/api/types";

import { QrCode } from "./QrCode";

/** Tickets as scannable QR codes for the venue gate. */
export function TicketQrList({ tickets }: { tickets: MatchTicket[] }) {
  if (tickets.length === 0) return null;
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-4">
      {tickets.map((ticket, index) => (
        <li key={ticket.id} className="flex items-center gap-4 rounded-image border border-stone bg-paper p-4">
          {ticket.qr_payload ? (
            <QrCode value={ticket.qr_payload} label={`Ticket ${index + 1} QR code`} size={128} />
          ) : null}
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-caption font-semibold text-pencil">Ticket {index + 1}</span>
            <b className="whitespace-nowrap font-mono text-body-sm tracking-wider text-ink">{ticket.code}</b>
            <span
              className={`w-fit rounded-md px-2 py-0.5 text-caption font-semibold ${
                ticket.status === "valid" ? "bg-mint-wash text-forest" : "bg-ink/5 text-pencil"
              }`}
            >
              {ticket.status === "valid" ? "Valid" : ticket.status === "used" ? "Used" : "Void"}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
