import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "./client";
import type {
  ApiEnvelope,
  CommentsEnvelope,
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
  StageInfo,
  StandingsPayload,
  TeamDetail,
  TeamStatistics,
  TeamSummary,
  TicketAvailability,
  TicketOrder,
  TicketOrderDetail,
  TournamentDetail,
  TournamentStatus,
  TournamentSummary,
  VideoType,
  VideoSummary,
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

async function fetchData<T>(path: string): Promise<T> {
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
  search: (params: SearchParams) => ["search", params] as const,
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
  return useQuery({
    queryKey: queryKeys.matchEconomy(id),
    queryFn: () => fetchData<GoldSnapshot[]>(`/matches/${id}/economy`),
    refetchInterval: live ? LIVE_POLL_MS : undefined,
  });
}

export function useMatchLiveStats(id: string, live = false) {
  return useQuery({
    queryKey: queryKeys.matchLiveStats(id),
    queryFn: () => fetchData<PlayerSnapshot[]>(`/matches/${id}/live-stats`),
    refetchInterval: live ? LIVE_POLL_MS : undefined,
  });
}

export function useMatchEquipment(id: string, live = false) {
  return useQuery({
    queryKey: queryKeys.matchEquipment(id),
    queryFn: () => fetchData<ItemPurchase[]>(`/matches/${id}/equipment`),
    refetchInterval: live ? LIVE_POLL_MS : undefined,
  });
}

export function useMatchEvents(id: string, live = false) {
  return useQuery({
    queryKey: queryKeys.matchEvents(id),
    queryFn: () => fetchData<MatchEvent[]>(`/matches/${id}/events`),
    refetchInterval: live ? LIVE_POLL_MS : undefined,
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

export async function fetchMatchComments(
  matchId: string,
  after?: string,
): Promise<CommentsEnvelope> {
  return apiFetch<CommentsEnvelope>(
    withQuery(`/matches/${matchId}/comments`, { after, limit: 30 }),
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
  return useQuery({
    queryKey: queryKeys.matchTicket(matchId),
    queryFn: () => fetchData<TicketAvailability | null>(`/matches/${matchId}/ticket`),
    refetchInterval: LIVE_POLL_MS,
  });
}

export async function postMatchOrder(
  matchId: string,
  quantity: number,
  token: string,
): Promise<TicketOrder> {
  const envelope = await apiFetch<ApiEnvelope<TicketOrder>>(
    `/matches/${matchId}/orders`,
    { method: "POST", body: { quantity }, token },
  );
  return envelope.data;
}

export async function fetchTicketOrder(
  orderId: string,
  token: string,
): Promise<TicketOrderDetail> {
  const envelope = await apiFetch<ApiEnvelope<TicketOrderDetail>>(
    `/me/orders/${orderId}`,
    { token },
  );
  return envelope.data;
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
