import { FeatureRow } from "@/components/home/FeatureRow";
import { SchedulePlanner } from "@/components/home/SchedulePlanner";
import { apiFetch } from "@/lib/api/client";
import type { ApiEnvelope, MatchSummary, TicketAvailability } from "@/lib/api/types";
import { formatStartsIn } from "@/lib/utils/format";

interface ScheduleProps {
  matches: MatchSummary[];
}

// Venue tickets are optional extras: no answer just means no ticket box.
async function fetchOnSaleTicket(matchId: string): Promise<TicketAvailability | null> {
  try {
    const response = await apiFetch<ApiEnvelope<TicketAvailability | null>>(
      `/matches/${matchId}/ticket`,
      { next: { revalidate: 60 } },
    );
    return response?.data?.on_sale ? response.data : null;
  } catch {
    return null;
  }
}

export async function Schedule({ matches }: ScheduleProps) {
  const found = await Promise.all(
    matches.map(async (match) => [match?.id, await fetchOnSaleTicket(match?.id)] as const),
  );
  const tickets: Record<string, TicketAvailability> = {};
  for (const [id, ticket] of found) {
    if (id && ticket) tickets[id] = ticket;
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
