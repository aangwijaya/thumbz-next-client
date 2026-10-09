import { useQuery } from "@tanstack/react-query";

import { useRealtimeConnected } from "@/lib/realtime/hooks";

import { apiFetch } from "./client";
import type {
  ApiEnvelope,
  CommentsEnvelope,
  CursorEnvelope,
  Favorite,
  FavoriteEntityType,
  GoldSnapshot,
  HomePayload,
  ItemPurchase,
  MatchComment,
  MatchDetail,
  MatchEvent,
  MatchStage,
  MatchStatistics,
  MatchStatus,
  MatchSummary,
  PlayerDetail,
  PlayerRole,
  PlayerSnapshot,
  PlayerStatistics,
  PlayerSummary,
  ScheduleGroup,
  SearchPayload,
  SearchSuggestion,
  StageInfo,
  StandingsPayload,
  TeamDetail,
  TeamStatistics,
  TeamSummary,
  TicketAvailability,
  TicketOrder,
  TicketOrderDetail,
  MatchTicket,
  PaymentMethod,
  PlaybackSession,
  TournamentDetail,
  TournamentStatus,
  TournamentSummary,
  VideoType,
  VideoSummary,
  UserProfile,
  WatchHistoryItem,
} from "./types";

export type SortOrder = "asc" | "desc";

export interface PageParams {
  page?: number;
  pageSize?: number;
}

export interface MatchListParams extends PageParams {
  status?: MatchStatus;
  tournament_id?: string;
  team_id?: string;
  from?: string;
  to?: string;
  featured?: boolean;
  sort?: "scheduled_at" | "viewer_count";
  order?: SortOrder;
}

export interface UpcomingParams extends PageParams {
  from?: string;
  tournament_id?: string;
}

export interface TournamentListParams extends PageParams {
  status?: TournamentStatus;
  region?: string;
  featured?: boolean;
  sort?: "start_date" | "name";
  order?: SortOrder;
}

export interface TeamListParams extends PageParams {
  region?: string;
  tournament_id?: string;
  sort?: "name" | "created_at";
  order?: SortOrder;
}

export interface PlayerListParams extends PageParams {
  team_id?: string;
  role?: PlayerRole;
}

export interface VideoListParams extends PageParams {
  type?: VideoType;
  match_id?: string;
}

export interface ScheduleParams extends PageParams {
  stage?: MatchStage;
  status?: MatchStatus;
  from?: string;
  to?: string;
}

export interface SearchParams extends PageParams {
  q: string;
  type?: "all" | "match" | "team" | "player" | "tournament" | "video";
}

const LIVE_POLL_MS = 30_000;

function withQuery(path: string, params?: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

export async function fetchData<T>(path: string): Promise<T> {
  const envelope = await apiFetch<ApiEnvelope<T>>(path);
  return envelope.data;
}

async function fetchList<T>(path: string): Promise<ApiEnvelope<T>> {
  return apiFetch<ApiEnvelope<T>>(path);
}

export const queryKeys = {
  home: () => ["home"] as const,
  liveMatches: () => ["matches", "live"] as const,
  upcomingMatches: (params: UpcomingParams = {}) => ["matches", "upcoming", params] as const,
  featuredMatches: () => ["matches", "featured"] as const,
  matches: (params: MatchListParams = {}) => ["matches", params] as const,
  match: (id: string) => ["matches", id] as const,
  matchStatistics: (id: string) => ["matches", id, "statistics"] as const,
  matchRoster: (id: string) => ["matches", id, "roster"] as const,
  matchHistory: (id: string) => ["matches", id, "history"] as const,
  matchRelated: (id: string) => ["matches", id, "related"] as const,
  matchEconomy: (id: string) => ["matches", id, "economy"] as const,
  matchLiveStats: (id: string) => ["matches", id, "live-stats"] as const,
  matchEquipment: (id: string) => ["matches", id, "equipment"] as const,
  matchEvents: (id: string) => ["matches", id, "events"] as const,
  matchTicket: (id: string) => ["matches", id, "ticket"] as const,
  order: (id: string) => ["me", "orders", id] as const,
  myOrders: (page: number) => ["me", "orders", "list", page] as const,
  myTickets: (page: number) => ["me", "tickets", page] as const,
  me: () => ["me", "profile"] as const,
  myFavorites: () => ["me", "favorites"] as const,
  myHistory: () => ["me", "history"] as const,
  tournaments: (params: TournamentListParams = {}) => ["tournaments", params] as const,
  tournament: (id: string) => ["tournaments", id] as const,
  tournamentSchedule: (id: string, params: ScheduleParams = {}) =>
    ["tournaments", id, "schedule", params] as const,
  tournamentStandings: (id: string) => ["tournaments", id, "standings"] as const,
  tournamentTeams: (id: string) => ["tournaments", id, "teams"] as const,
  tournamentResults: (id: string) => ["tournaments", id, "results"] as const,
  tournamentStages: (id: string) => ["tournaments", id, "stages"] as const,
  teams: (params: TeamListParams = {}) => ["teams", params] as const,
  team: (id: string) => ["teams", id] as const,
  teamMatches: (id: string, params: PageParams & { status?: MatchStatus } = {}) =>
    ["teams", id, "matches", params] as const,
  teamStatistics: (id: string) => ["teams", id, "statistics"] as const,
  teamRoster: (id: string) => ["teams", id, "roster"] as const,
  players: (params: PlayerListParams = {}) => ["players", params] as const,
  player: (id: string) => ["players", id] as const,
  playerMatches: (id: string, params: PageParams & { status?: MatchStatus } = {}) =>
    ["players", id, "matches", params] as const,
  playerStatistics: (id: string) => ["players", id, "statistics"] as const,
  videos: (params: VideoListParams = {}) => ["videos", params] as const,
  videoFeed: (type?: VideoType) => ["videos", "feed", type ?? "all"] as const,
  search: (params: SearchParams) => ["search", params] as const,
  suggest: (q: string) => ["search", "suggest", q.toLowerCase()] as const,
};

export function useHome() {
  return useQuery({
    queryKey: queryKeys.home(),
    queryFn: () => fetchData<HomePayload>("/home"),
  });
}

export function useLiveMatches() {
  return useQuery({
    queryKey: queryKeys.liveMatches(),
    queryFn: () => fetchList<MatchSummary[]>("/matches/live"),
    refetchInterval: LIVE_POLL_MS,
  });
}

export function useUpcomingMatches(params: UpcomingParams = {}) {
  return useQuery({
    queryKey: queryKeys.upcomingMatches(params),
    queryFn: () => fetchList<MatchSummary[]>(withQuery("/matches/upcoming", params)),
  });
}

export function useFeaturedMatches() {
  return useQuery({
    queryKey: queryKeys.featuredMatches(),
    queryFn: () => fetchData<MatchDetail | null>("/matches/featured"),
    refetchInterval: LIVE_POLL_MS,
  });
}

export function useMatches(params: MatchListParams = {}) {
  return useQuery({
    queryKey: queryKeys.matches(params),
    queryFn: () => fetchList<MatchSummary[]>(withQuery("/matches", params)),
  });
}

export function useMatch(id: string) {
  return useQuery({
    queryKey: queryKeys.match(id),
    queryFn: () => fetchData<MatchDetail>(`/matches/${id}`),
  });
}

export function useMatchStatistics(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.matchStatistics(id),
    queryFn: () => fetchData<MatchStatistics>(`/matches/${id}/statistics`),
    enabled,
  });
}

export function useMatchRoster(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.matchRoster(id),
    queryFn: () => fetchData<PlayerSummary[]>(`/matches/${id}/roster`),
    enabled,
  });
}

export function useMatchHistory(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.matchHistory(id),
    queryFn: () => fetchData<MatchSummary[]>(`/matches/${id}/history`),
    enabled,
  });
}

export function useMatchRelated(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.matchRelated(id),
    queryFn: () => fetchData<MatchSummary[]>(`/matches/${id}/related`),
    enabled,
  });
}

export function useMatchEconomy(id: string, live = false) {
  // Pushes replace polling while the realtime channel is up (contract §14).
  const connected = useRealtimeConnected();
  return useQuery({
    queryKey: queryKeys.matchEconomy(id),
    queryFn: () => fetchData<GoldSnapshot[]>(`/matches/${id}/economy`),
    refetchInterval: live && !connected ? LIVE_POLL_MS : undefined,
  });
}

export function useMatchLiveStats(id: string, live = false) {
  // Pushes replace polling while the realtime channel is up (contract §14).
  const connected = useRealtimeConnected();
  return useQuery({
    queryKey: queryKeys.matchLiveStats(id),
    queryFn: () => fetchData<PlayerSnapshot[]>(`/matches/${id}/live-stats`),
    refetchInterval: live && !connected ? LIVE_POLL_MS : undefined,
  });
}

export function useMatchEquipment(id: string, live = false) {
  // Pushes replace polling while the realtime channel is up (contract §14).
  const connected = useRealtimeConnected();
  return useQuery({
    queryKey: queryKeys.matchEquipment(id),
    queryFn: () => fetchData<ItemPurchase[]>(`/matches/${id}/equipment`),
    refetchInterval: live && !connected ? LIVE_POLL_MS : undefined,
  });
}

export function useMatchEvents(id: string, live = false) {
  // Pushes replace polling while the realtime channel is up (contract §14).
  const connected = useRealtimeConnected();
  return useQuery({
    queryKey: queryKeys.matchEvents(id),
    queryFn: () => fetchData<MatchEvent[]>(`/matches/${id}/events`),
    refetchInterval: live && !connected ? LIVE_POLL_MS : undefined,
  });
}

export function useTournaments(params: TournamentListParams = {}) {
  return useQuery({
    queryKey: queryKeys.tournaments(params),
    queryFn: () => fetchList<TournamentSummary[]>(withQuery("/tournaments", params)),
  });
}

export function useTournament(id: string) {
  return useQuery({
    queryKey: queryKeys.tournament(id),
    queryFn: () => fetchData<TournamentDetail>(`/tournaments/${id}`),
  });
}

export function useTournamentSchedule(id: string, params: ScheduleParams = {}) {
  return useQuery({
    queryKey: queryKeys.tournamentSchedule(id, params),
    queryFn: () => fetchList<ScheduleGroup[]>(withQuery(`/tournaments/${id}/schedule`, params)),
  });
}

export function useTournamentStandings(id: string) {
  return useQuery({
    queryKey: queryKeys.tournamentStandings(id),
    queryFn: () => fetchData<StandingsPayload>(`/tournaments/${id}/standings`),
  });
}

export function useTournamentTeams(id: string) {
  return useQuery({
    queryKey: queryKeys.tournamentTeams(id),
    queryFn: () => fetchData<TeamSummary[]>(`/tournaments/${id}/teams`),
  });
}

export function useTournamentResults(id: string, params: PageParams = {}) {
  return useQuery({
    queryKey: queryKeys.tournamentResults(id),
    queryFn: () => fetchList<MatchSummary[]>(withQuery(`/tournaments/${id}/results`, params)),
  });
}

export function useTournamentStages(id: string) {
  return useQuery({
    queryKey: queryKeys.tournamentStages(id),
    queryFn: () => fetchData<StageInfo[]>(`/tournaments/${id}/stages`),
  });
}

export function useTeams(params: TeamListParams = {}) {
  return useQuery({
    queryKey: queryKeys.teams(params),
    queryFn: () => fetchList<TeamSummary[]>(withQuery("/teams", params)),
  });
}

export function useTeam(id: string) {
  return useQuery({
    queryKey: queryKeys.team(id),
    queryFn: () => fetchData<TeamDetail>(`/teams/${id}`),
  });
}

export function useTeamMatches(id: string, params: PageParams & { status?: MatchStatus } = {}) {
  return useQuery({
    queryKey: queryKeys.teamMatches(id, params),
    queryFn: () => fetchList<MatchSummary[]>(withQuery(`/teams/${id}/matches`, params)),
  });
}

export function useTeamStatistics(id: string) {
  return useQuery({
    queryKey: queryKeys.teamStatistics(id),
    queryFn: () => fetchData<TeamStatistics>(`/teams/${id}/statistics`),
  });
}

export function useTeamRoster(id: string) {
  return useQuery({
    queryKey: queryKeys.teamRoster(id),
    queryFn: () => fetchData<PlayerSummary[]>(`/teams/${id}/roster`),
  });
}

export function usePlayers(params: PlayerListParams = {}) {
  return useQuery({
    queryKey: queryKeys.players(params),
    queryFn: () => fetchList<PlayerSummary[]>(withQuery("/players", params)),
  });
}

export function usePlayer(id: string) {
  return useQuery({
    queryKey: queryKeys.player(id),
    queryFn: () => fetchData<PlayerDetail>(`/players/${id}`),
  });
}

export function usePlayerMatches(
  id: string,
  params: PageParams & { status?: MatchStatus } = {},
) {
  return useQuery({
    queryKey: queryKeys.playerMatches(id, params),
    queryFn: () => fetchList<MatchSummary[]>(withQuery(`/players/${id}/matches`, params)),
  });
}

export function usePlayerStatistics(id: string) {
  return useQuery({
    queryKey: queryKeys.playerStatistics(id),
    queryFn: () => fetchData<PlayerStatistics>(`/players/${id}/statistics`),
  });
}

export function useVideos(params: VideoListParams = {}) {
  return useQuery({
    queryKey: queryKeys.videos(params),
    queryFn: () => fetchList<VideoSummary[]>(withQuery("/videos", params)),
  });
}

export function useSearch(params: SearchParams) {
  return useQuery({
    queryKey: queryKeys.search(params),
    queryFn: () => fetchList<SearchPayload>(withQuery("/search", params)),
  });
}

/** Typeahead suggestions for the header search (contract §6.7). */
export async function fetchSuggestions(q: string, signal?: AbortSignal): Promise<SearchSuggestion[]> {
  const envelope = await apiFetch<ApiEnvelope<SearchSuggestion[]>>(
    withQuery("/search/suggest", { q, limit: 8 }),
    { signal },
  );
  return envelope?.data ?? [];
}

/** One keyset page of the replay feed (contract §4.1). */
export function fetchVideoPage(
  params: { type?: VideoType; cursor?: string | null; pageSize?: number },
  signal?: AbortSignal,
): Promise<CursorEnvelope<VideoSummary[]>> {
  return apiFetch<CursorEnvelope<VideoSummary[]>>(
    withQuery("/videos", {
      type: params.type,
      cursor: params.cursor ?? undefined,
      pageSize: params.pageSize ?? 12,
    }),
    { signal },
  );
}

/** Comments page: `after` for newer (delta polling), `before` for older (scroll-back). */
export async function fetchMatchComments(
  matchId: string,
  cursor: { after?: string; before?: string } = {},
): Promise<CommentsEnvelope> {
  return apiFetch<CommentsEnvelope>(
    withQuery(`/matches/${matchId}/comments`, { ...cursor, limit: 30 }),
  );
}

export async function postMatchComment(
  matchId: string,
  body: string,
  token: string,
): Promise<MatchComment> {
  const envelope = await apiFetch<ApiEnvelope<MatchComment>>(
    `/matches/${matchId}/comments`,
    { method: "POST", body: { body }, token },
  );
  return envelope.data;
}

export async function deleteMatchComment(
  commentId: string,
  token: string,
): Promise<void> {
  await apiFetch<undefined>(`/me/comments/${commentId}`, {
    method: "DELETE",
    token,
  });
}

export function useMatchTicket(matchId: string) {
  const connected = useRealtimeConnected();
  return useQuery({
    queryKey: queryKeys.matchTicket(matchId),
    queryFn: () => fetchData<TicketAvailability | null>(`/matches/${matchId}/ticket`),
    // tickets:changed pushes invalidate this while connected.
    refetchInterval: connected ? false : LIVE_POLL_MS,
  });
}

/**
 * Reserves tickets and opens the first payment attempt. `idempotencyKey` is
 * reused when the same click is retried, so a flaky network can never create
 * two orders (contract §16).
 */
export async function postMatchOrder(
  matchId: string,
  body: { quantity: number; payment_method: PaymentMethod },
  token: string,
  idempotencyKey: string,
): Promise<TicketOrder> {
  const envelope = await apiFetch<ApiEnvelope<TicketOrder>>(`/matches/${matchId}/orders`, {
    method: "POST",
    body,
    token,
    headers: { "Idempotency-Key": idempotencyKey },
  });
  return envelope.data;
}

/** Pays a pending order with another method (supersedes earlier attempts). */
export async function postOrderPayment(
  orderId: string,
  method: PaymentMethod,
  token: string,
  idempotencyKey: string,
): Promise<TicketOrder> {
  const envelope = await apiFetch<ApiEnvelope<TicketOrder>>(`/me/orders/${orderId}/payments`, {
    method: "POST",
    body: { method },
    token,
    headers: { "Idempotency-Key": idempotencyKey },
  });
  return envelope.data;
}

/** Opens a protected playback session (contract §17); 409 = device limit reached. */
export async function createPlaybackSession(assetId: string, token: string): Promise<PlaybackSession> {
  const envelope = await apiFetch<ApiEnvelope<PlaybackSession>>("/playback/sessions", {
    method: "POST",
    body: { asset_id: assetId },
    token,
  });
  return envelope.data;
}

/** Keeps the session counted as active and returns a rotated playback token. */
export async function heartbeatPlaybackSession(
  sessionId: string,
  token: string,
): Promise<{ token: string; expires_at: string }> {
  const envelope = await apiFetch<ApiEnvelope<{ token: string; expires_at: string }>>(
    `/playback/sessions/${sessionId}/heartbeat`,
    { method: "POST", token },
  );
  return envelope.data;
}

/**
 * Frees the device slot. `keepalive` lets the request outlive a closing tab
 * (sendBeacon cannot carry the Authorization header).
 */
export function endPlaybackSession(sessionId: string, token: string): void {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) return;
  void fetch(`${base}/playback/sessions/${sessionId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    keepalive: true,
  }).catch(() => undefined);
}

export async function fetchMe(token: string): Promise<UserProfile> {
  return (await apiFetch<ApiEnvelope<UserProfile>>("/me", { token, cache: "no-store" })).data;
}

export async function fetchMyFavorites(token: string): Promise<Favorite[]> {
  return (await apiFetch<ApiEnvelope<Favorite[]>>("/me/favorites", { token, cache: "no-store" }))?.data ?? [];
}

/** One offset page of the watch history, newest first (contract §4.1, §6.8: no cursor here). */
export function fetchMyHistoryPage(
  token: string,
  page: number,
  signal?: AbortSignal,
): Promise<ApiEnvelope<WatchHistoryItem[]>> {
  return apiFetch<ApiEnvelope<WatchHistoryItem[]>>(withQuery("/me/history", { page, pageSize: 20 }), {
    token,
    cache: "no-store",
    signal,
  });
}

export async function deleteHistoryItem(matchId: string, token: string): Promise<void> {
  await apiFetch<undefined>(`/me/history/${matchId}`, { method: "DELETE", token });
}

/** Sandbox gateway only: completes a demo payment. */
export async function simulatePayment(paymentId: string, token: string): Promise<void> {
  await apiFetch<unknown>(`/me/payments/${paymentId}/simulate`, { method: "POST", token });
}

export async function fetchMyOrders(token: string, page = 1): Promise<ApiEnvelope<TicketOrder[]>> {
  return apiFetch<ApiEnvelope<TicketOrder[]>>(withQuery("/me/orders", { page, pageSize: 20 }), {
    token,
  });
}

export async function fetchMyTickets(token: string, page = 1): Promise<ApiEnvelope<MatchTicket[]>> {
  return apiFetch<ApiEnvelope<MatchTicket[]>>(withQuery("/me/tickets", { page, pageSize: 50 }), {
    token,
  });
}

export async function fetchTicketOrder(
  orderId: string,
  token: string,
): Promise<TicketOrderDetail> {
  // Tickets travel next to `data` in this response (contract §6).
  const envelope = await apiFetch<{ data: TicketOrder; tickets?: MatchTicket[] }>(
    `/me/orders/${orderId}`,
    { token },
  );
  return { ...envelope.data, tickets: envelope.tickets ?? [] };
}

export async function cancelTicketOrder(
  orderId: string,
  token: string,
): Promise<void> {
  await apiFetch<undefined>(`/me/orders/${orderId}/cancel`, {
    method: "POST",
    token,
  });
}

export async function addFavorite(
  entityType: FavoriteEntityType,
  entityId: string,
  token: string,
): Promise<void> {
  await apiFetch<unknown>(`/me/favorites/${entityType}/${entityId}`, {
    method: "PUT",
    token,
  });
}

export async function removeFavorite(
  entityType: FavoriteEntityType,
  entityId: string,
  token: string,
): Promise<void> {
  await apiFetch<undefined>(`/me/favorites/${entityType}/${entityId}`, {
    method: "DELETE",
    token,
  });
}
