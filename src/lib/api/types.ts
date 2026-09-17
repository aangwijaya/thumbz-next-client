export type MatchStatus = "scheduled" | "live" | "completed" | "cancelled" | "postponed";

export type TournamentStatus = "upcoming" | "ongoing" | "completed";

export type MatchStage =
  | "group_stage"
  | "regular_season"
  | "playoffs"
  | "semifinal"
  | "third_place"
  | "grand_final";

export type PlayerRole = "gold" | "mid" | "exp" | "jungle" | "roam" | "flex" | "coach";

export type VideoType = "replay" | "highlight" | "vod";

export type FavoriteEntityType = "team" | "player";

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiEnvelope<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface TeamSummary {
  id: string;
  slug: string;
  name: string;
  region?: string;
  logo_url?: string;
  color_primary?: string;
  color_secondary?: string;
  is_active?: boolean;
}

export interface TeamDetail extends TeamSummary {
  description: string | null;
  founded_year: number | null;
  stats: {
    matches_played: number;
    matches_won: number;
    win_rate: number;
    current_form: Array<"W" | "L">;
  };
  live_match: MatchSummary | null;
  next_match: MatchSummary | null;
}

export interface TournamentSummary {
  id: string;
  slug: string;
  name: string;
  status: TournamentStatus;
  region: string;
  start_date: string;
  end_date: string;
  prize_pool: string | null;
  logo_url: string | null;
  featured: boolean;
}

export interface TournamentDetail extends TournamentSummary {
  description: string;
}

export interface PlayerSummary {
  id: string;
  slug: string;
  nickname: string;
  real_name: string | null;
  role: PlayerRole;
  country: string | null;
  team_id: string | null;
  team: TeamSummary | null;
  photo_url: string | null;
  is_active: boolean;
}

export interface PlayerDetail extends PlayerSummary {
  stats: {
    matches_played: number;
    avg_kills: number;
    avg_deaths: number;
    avg_assists: number;
    mvp_count: number;
    win_rate: number;
  };
  tournament_history: Array<{
    tournament: TournamentSummary;
    placement: string | null;
    matches_played: number;
  }>;
}

export interface MatchSummary {
  id: string;
  tournament_id: string | null;
  tournament: { id: string; name: string; slug: string } | null;
  stage: MatchStage | null;
  round: number;
  group_name: string | null;
  best_of: number;
  game_number: number | null;
  team_a: TeamSummary;
  team_b: TeamSummary;
  score_a: number | null;
  score_b: number | null;
  winner_team_id: string | null;
  status: MatchStatus;
  scheduled_at: string;
  started_at: string | null;
  ended_at: string | null;
  thumbnail_url: string | null;
  viewer_count: number;
  featured: boolean;
}

export interface MatchDetail extends MatchSummary {
  stream_url: string | null;
  tournament: { id: string; name: string; slug: string; status: TournamentStatus; region: string };
  team_a: TeamSummary & { region: string };
  team_b: TeamSummary & { region: string };
}

export interface MatchStatistics {
  match_id: string;
  teams: Array<{
    team_id: string;
    team: TeamSummary;
    kills: number;
    deaths: number;
    assists: number;
    gold: number;
    towers_destroyed: number;
    game_duration_seconds: number;
    details: Record<string, unknown>;
  }>;
  players: Array<{
    player_id: string;
    player: PlayerSummary;
    team_id: string;
    kills: number;
    deaths: number;
    assists: number;
    gold: number;
    hero_picked: string;
    mvp: boolean;
    details: Record<string, unknown>;
  }>;
}

export interface TeamStatistics {
  team_id: string;
  matches_played: number | null;
  matches_won: number | null;
  win_rate: number | null;
  avg_kills: number | null;
  avg_deaths: number | null;
  avg_gold: number | null;
  per_tournament: Array<{
    tournament: TournamentSummary;
    matches_played: number;
    wins: number;
  }>;
}

export interface PlayerStatistics {
  player_id: string;
  matches_played: number | null;
  avg_kills: number | null;
  avg_deaths: number | null;
  avg_assists: number | null;
  avg_gold: number | null;
  mvp_count: number | null;
  win_rate: number | null;
  per_hero: Array<{
    hero: string;
    games: number;
    wins: number;
    avg_kills: number;
  }>;
}

export interface VideoSummary {
  id: string;
  match_id: string | null;
  title: string;
  type: VideoType;
  url: string;
  thumbnail_url: string | null;
  duration_seconds: number;
  published_at: string;
}

export interface WatchHistoryItem {
  match_id: string;
  watched_at: string;
  duration_seconds: number;
  match: MatchSummary;
}

export interface HomePayload {
  featured_live_match: MatchDetail | null;
  live_now: MatchSummary[];
  upcoming: MatchSummary[];
  featured_tournaments: TournamentSummary[];
  popular_teams: TeamSummary[];
  latest_videos: VideoSummary[];
  continue_watching: WatchHistoryItem[];
}

export interface SearchPayload {
  query: string;
  matches: MatchSummary[];
  teams: TeamSummary[];
  players: PlayerSummary[];
  tournaments: TournamentSummary[];
  videos: VideoSummary[];
}

export interface ScheduleGroup {
  stage: MatchStage;
  matches: MatchSummary[];
}

export interface StandingsRow {
  rank: number;
  team: TeamSummary;
  played: number;
  wins: number;
  losses: number;
  win_rate: number;
}

export interface StandingsPayload {
  tournament_id: string;
  standings: StandingsRow[];
}

export interface StageInfo {
  stage: MatchStage;
  match_count: number;
  completed_count: number;
  live_count: number;
}

export interface UserProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  role: "user" | "admin";
  created_at: string;
}

export interface Favorite {
  entity_type: FavoriteEntityType;
  entity_id: string;
  created_at: string;
  entity: TeamSummary | PlayerSummary;
}

export interface GoldSnapshot {
  team_id: string;
  gold: number;
  recorded_at: string;
}

export interface PlayerSnapshot {
  player_id: string;
  team_id: string;
  kills: number;
  deaths: number;
  assists: number;
  gold: number;
  damage: number;
  damage_taken: number;
  level: number;
  recorded_at: string;
}

export interface ItemPurchase {
  player_id: string;
  team_id: string;
  item_id: string;
  item_name: string;
  phase: "phase2" | "phase3";
  slot: number | null;
  purchased_at: string;
}

export interface MatchEvent {
  id: string;
  team_id: string | null;
  player_id: string | null;
  event_type: string;
  title: string;
  details: Record<string, unknown>;
  occurred_at: string;
}

export interface MatchComment {
  id: string;
  match_id: string;
  user_id: string;
  author_name: string;
  body: string;
  created_at: string;
}

export interface CommentsEnvelope {
  data: MatchComment[];
  meta: {
    next_cursor: string | null;
    total: number;
  };
}

export interface TicketAvailability {
  match_id: string;
  venue_name: string;
  venue_city: string | null;
  price_usd: number;
  quota_total: number;
  quota_remaining: number;
  sales_open_at: string | null;
  sales_close_at: string | null;
  on_sale: boolean;
}

export type TicketOrderStatus = "pending" | "paid" | "cancelled" | "expired" | "failed";

export interface TicketPayment {
  provider: string;
  invoice_url: string | null;
  payment_id: string | null;
}

export interface TicketOrder {
  id: string;
  match_id: string;
  quantity: number;
  unit_price_usd: number;
  total_usd: number;
  status: TicketOrderStatus;
  expires_at: string | null;
  created_at: string;
  paid_at: string | null;
  payment: TicketPayment | null;
}

export interface MatchTicket {
  id: string;
  match_id: string;
  order_id: string;
  code: string;
  status: string;
  issued_at: string;
}

export interface TicketOrderDetail extends TicketOrder {
  tickets: MatchTicket[];
}
