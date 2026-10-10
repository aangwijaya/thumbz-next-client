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
  /** Keyset cursor for the next page (contract §4.1); absent on older endpoints. */
  next_cursor?: string | null;
  has_more?: boolean;
}

/** Meta of a keyset (cursor) page: offset fields are null, no total is counted. */
export interface CursorMeta {
  page: number | null;
  pageSize: number;
  total: number | null;
  totalPages: number | null;
  next_cursor: string | null;
  has_more: boolean;
}

export interface CursorEnvelope<T> {
  data: T;
  meta: CursorMeta;
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
  /** Narrow-space label such as "RRQ"; null when not set. */
  short_name?: string | null;
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
  /** Computed by the API from the tournament's matches. */
  current_stage?: MatchStage | null;
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

export type BroadcastLanguage = "en" | "id" | "ms" | "tl";

// Contract §6.1: language variants of a live match, ordered by viewer_count desc.
export interface BroadcastSummary {
  language: BroadcastLanguage;
  stream_url: string;
  viewer_count: number;
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
  broadcasts?: BroadcastSummary[];
  /** How far the stream runs behind real time; live data newer than this stays hidden. */
  stream_delay_seconds?: number;
}

/** One game of a series (contract §19). */
export interface MatchGame {
  game_number: number;
  status: "live" | "completed";
  winner_team_id: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  duration_seconds?: number | null;
}

export interface MatchDetail extends MatchSummary {
  stream_url: string | null;
  /** Games of the series so far, by game_number (contract §19). */
  games?: MatchGame[];
  tournament: { id: string; name: string; slug: string; status: TournamentStatus; region: string };
  team_a: TeamSummary & { region: string };
  team_b: TeamSummary & { region: string };
}

/** An emblem, talent or item with its icon (contract §19). */
export interface GameAsset {
  id: string;
  name: string;
  icon_url: string | null;
}

/** Statistics of one game of the series (contract §19). */
export interface MatchStatistics {
  match_id: string;
  game_number?: number;
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
    damage?: number;
    damage_taken?: number;
    tower_damage?: number;
    hero_picked: string;
    hero_icon_url?: string | null;
    emblem?: GameAsset | null;
    talents?: GameAsset[];
    /** Final build, slot order. */
    items?: GameAsset[];
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
  /** Present when the video is served as a protected (DRM) asset — play it via a playback session. */
  media?: { id: string; protection: MediaProtection } | null;
}

export type MediaProtection = "none" | "clearkey_aes" | "multidrm";

export interface KeySystemConfig {
  license_url: string;
  headers?: Record<string, string>;
  certificate_url?: string;
}

/** Contract §17: a short-lived, per-device playback session. */
export interface PlaybackSession {
  session_id: string;
  token: string;
  expires_at: string;
  heartbeat_seconds: number;
  asset: {
    id: string;
    title: string;
    protection: MediaProtection;
    duration_seconds: number | null;
  };
  sources: {
    dash: { manifest_url: string; key_systems: Record<string, KeySystemConfig> } | null;
    hls: { manifest_url: string } | null;
  };
}

export interface WatchHistoryItem {
  match_id: string;
  watched_at: string;
  duration_seconds: number;
  /** Total playable length reported by the player; null when unknown (contract §6.8). */
  total_seconds?: number | null;
  match: MatchSummary;
}

export interface HomePayload {
  featured_live_match: MatchDetail | null;
  live_now: MatchSummary[];
  /** Upcoming matches carry their venue-ticket availability (no per-match calls). */
  upcoming: Array<MatchSummary & { ticket?: TicketAvailability | null }>;
  featured_tournaments: TournamentSummary[];
  popular_teams: TeamSummary[];
  latest_videos: VideoSummary[];
  continue_watching: WatchHistoryItem[];
}

export type SearchType = "all" | "match" | "team" | "player" | "tournament" | "video";

export type SearchCounts = Record<"matches" | "teams" | "players" | "tournaments" | "videos", number>;

export interface SearchSuggestion {
  type: "team" | "player" | "tournament";
  id: string;
  slug: string;
  label: string;
  sublabel: string | null;
  image_url: string | null;
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
  game_number?: number;
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
  /** Hero picked for this game; null before the draft is known (§19). */
  hero?: string | null;
  hero_icon_url?: string | null;
  player?: { id: string; nickname: string; role: PlayerRole | null } | null;
  game_number?: number;
  recorded_at: string;
}

export interface ItemPurchase {
  player_id: string;
  team_id: string;
  item_id: string;
  item_name: string;
  phase: "phase2" | "phase3";
  slot: number | null;
  /** 1 component · 2 intermediate · 3 final (§19). */
  tier?: number | null;
  icon_url?: string | null;
  game_number?: number;
  purchased_at: string;
}

export interface MatchEvent {
  id: string;
  team_id: string | null;
  player_id: string | null;
  event_type: string;
  title: string;
  details: Record<string, unknown>;
  game_number?: number;
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
    /** Pass as `after` for newer comments. */
    next_cursor: string | null;
    /** Pass as `before` for older comments; null at the start of the chat. */
    prev_cursor?: string | null;
    /** More newer comments are waiting: fetch again right away. */
    has_more?: boolean;
    total: number;
  };
}

export type PaymentMethod = "crypto" | "qris" | "va_bca" | "va_bni" | "va_bri" | "va_mandiri" | "va_permata";

export interface PaymentMethodOption {
  method: PaymentMethod;
  label: string;
  family: "crypto" | "idr";
  currency: "USD" | "IDR";
  /** Price of one ticket in `currency`. */
  unit_amount: number;
  bank: string | null;
  provider: "nowpayments" | "xendit" | "sandbox";
}

export interface TicketAvailability {
  match_id: string;
  venue_name: string;
  venue_city: string | null;
  price_usd: number;
  /** Price for QRIS / bank VA; null = crypto only. */
  price_idr?: number | null;
  quota_total: number;
  quota_remaining: number;
  sales_open_at: string | null;
  sales_close_at: string | null;
  on_sale: boolean;
  /** Methods payable right now (contract §16). */
  payment_methods?: PaymentMethodOption[];
}

export type TicketOrderStatus = "pending" | "paid" | "cancelled" | "expired" | "failed" | "refund_required";

export type PaymentStatus = "pending" | "succeeded" | "failed" | "expired" | "cancelled";

/** One payment attempt (contract §16); legacy orders only have provider/invoice_url/payment_id. */
export interface TicketPayment {
  id?: string;
  provider: string;
  method?: PaymentMethod;
  status?: PaymentStatus;
  currency?: "USD" | "IDR";
  amount?: number;
  kind?: "redirect" | "qr" | "va" | null;
  invoice_url: string | null;
  qr_string?: string | null;
  va_number?: string | null;
  bank?: string | null;
  expires_at?: string;
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
  /** Signed payload to render as the QR code. */
  qr_payload?: string;
  status: string;
  issued_at: string;
  match?: MatchSummary;
}

export interface TicketOrderDetail extends TicketOrder {
  tickets: MatchTicket[];
}
