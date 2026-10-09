import { FeatureRow } from "@/components/home/FeatureRow";
import { SchedulePlanner } from "@/components/home/SchedulePlanner";
import type { HomePayload, TicketAvailability } from "@/lib/api/types";
import { formatStartsIn } from "@/lib/utils/format";

interface ScheduleProps {
  matches: HomePayload["upcoming"];
}

export function Schedule({ matches }: ScheduleProps) {
  // Ticket availability arrives embedded in the home payload: only on-sale
  // tickets get a box, and no request is made per match.
  const tickets: Record<string, TicketAvailability> = {};
  for (const match of matches) {
    if (match?.id && match.ticket?.on_sale) tickets[match.id] = match.ticket;
  }

  return (
    <FeatureRow
      id="schedule"
      flip
      eyebrow="Up next"
      title="Plan your match day"
      body="Every upcoming match in your local time. Some playoff matches also sell seats at the venue."
      action={{ href: "/matches", label: "See full schedule" }}
    >
      <SchedulePlanner
        matches={matches}
        tickets={tickets}
        // Only the first match gets a "starts in" hint, and only when it is close.
        startsIn={formatStartsIn(matches[0]?.scheduled_at ?? "")}
      />
    </FeatureRow>
  );
}
