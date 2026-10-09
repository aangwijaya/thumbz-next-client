const KEY = "thumbz:recent-searches";
const MAX = 6;

/** Recent queries, newest first. Storage can be unavailable (private mode). */
export function recentSearches(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string").slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function rememberSearch(query: string): void {
  try {
    const next = [query, ...recentSearches().filter((item) => item.toLowerCase() !== query.toLowerCase())];
    localStorage.setItem(KEY, JSON.stringify(next.slice(0, MAX)));
  } catch {
    // ignore: recents are a convenience
  }
}

export function clearRecentSearches(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
