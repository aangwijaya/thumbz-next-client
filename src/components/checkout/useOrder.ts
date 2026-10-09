"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchTicketOrder, queryKeys } from "@/lib/api/endpoints";
import type { TicketOrderDetail } from "@/lib/api/types";
import { useRealtimeConnected, useRealtimeRoom } from "@/lib/realtime/hooks";
import { useSupabaseSession } from "@/lib/supabase/useSession";

const POLL_MS = 5_000;

/**
 * One order, kept current: the server pushes `order:update` to the buyer's
 * private room the moment a payment lands (or the hold expires); polling
 * every 5 s only while the realtime channel is down.
 */
export function useOrder(orderId: string | null, initial?: TicketOrderDetail) {
  const { session } = useSupabaseSession();
  const queryClient = useQueryClient();
  const connected = useRealtimeConnected();

  const query = useQuery({
    queryKey: queryKeys.order(orderId ?? "none"),
    queryFn: () => fetchTicketOrder(orderId!, session!.token),
    enabled: Boolean(orderId && session),
    initialData: initial,
    refetchInterval: (state) =>
      state.state.data?.status === "pending" && !connected ? POLL_MS : false,
  });

  useRealtimeRoom(session ? `user:${session.userId}` : null, {
    "order:update": (data) => {
      if ((data as { id?: string })?.id === orderId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId!) });
      }
    },
  });

  return query;
}
