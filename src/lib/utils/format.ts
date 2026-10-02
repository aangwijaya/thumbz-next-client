import type { BroadcastLanguage, MatchStage } from "@/lib/api/types";

export function formatViewerCount(count: number): string {
  if (count >= 1_000_000) return `${trimOneDecimal(count / 1_000_000)}M`;
  if (count >= 1_000) {
    const scaled = trimOneDecimal(count / 1_000);
    return scaled === "1000" ? "1M" : `${scaled}K`;
  }
  return String(Math.round(count));
}

function trimOneDecimal(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

// "Aug 8 – Oct 19": month and day only, in UTC like every other date here.
export function formatDateRange(startIso: string, endIso: string): string {
  const parts = [startIso, endIso].map((iso) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}`;
  });
  return parts.filter(Boolean).join(" – ");
}

export function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return timeFormatter.format(date);
}

export function formatDateTime(iso: string): string {
  const datePart = formatDate(iso);
  const timePart = formatTime(iso);
  if (!datePart || !timePart) return "";
  return `${datePart}, ${timePart}`;
}

export function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "";
  const seconds = Math.floor(totalSeconds);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const mm = hours > 0 ? String(minutes).padStart(2, "0") : String(minutes);
  const ss = String(secs).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${minutes}:${ss}`;
}

export function formatStage(stage: MatchStage): string {
  return stage
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatRelativeTime(iso: string): string {
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - time) / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return formatDate(iso);
}

// "350000 USD" or "350,000 USD" → "$350,000". Anything that is not
// "<amount> <ISO code>" is shown as is.
// "1 hour ago", "Yesterday", "3 days ago"; older than a week falls back to the date.
export function formatAge(iso: string): string {
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return "";
  const minutes = Math.floor(Math.max(0, Date.now() - time) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return formatDate(iso);
}

export function formatPrizePool(value: string | null | undefined): string {
  if (!value) return "";
  const parts = value.trim().match(/^(\d[\d,]*(?:\.\d+)?)\s+([A-Za-z]{3})$/);
  if (!parts) return value;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: parts[2].toUpperCase(),
      maximumFractionDigits: 0,
    }).format(Number(parts[1].replaceAll(",", "")));
  } catch {
    return value;
  }
}

const BROADCAST_LANGUAGES: Record<BroadcastLanguage, string> = {
  en: "English",
  id: "Bahasa Indonesia",
  ms: "Bahasa Melayu",
  tl: "Filipino",
};

export function formatBroadcastLanguage(language: string): string {
  return BROADCAST_LANGUAGES[language as BroadcastLanguage] ?? language.toUpperCase();
}

// "in 2h 14m" (or "now") for a start time within the next 24 hours, otherwise "".
export function formatStartsIn(iso: string): string {
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return "";
  const minutes = Math.round((time - Date.now()) / 60_000);
  if (minutes <= 0) return "now";
  if (minutes < 60) return `in ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours >= 24) return "";
  return `in ${hours}h ${minutes % 60}m`;
}

// A short team label for tight spots such as the scorebug. The API has no
// short names yet, so this takes the first word that is not "Team".
export function shortTeamName(name: string): string {
  const words = name.trim().split(/\s+/).filter((word) => !/^team$/i.test(word));
  return words[0] || name;
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}
