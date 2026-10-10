const DAY_MS = 86_400_000;

/** "2026-10-11" for a valid YYYY-MM-DD, else null. */
export function dayParam(value: string | undefined): string | null {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) ? value : null;
}

/** Monday to Sunday (UTC days, YYYY-MM-DD) of the week holding `day`. */
export function weekDays(day: string): string[] {
  const date = new Date(`${day}T00:00:00Z`);
  const monday = date.getTime() - ((date.getUTCDay() + 6) % 7) * DAY_MS;
  return Array.from({ length: 7 }, (_, index) => new Date(monday + index * DAY_MS).toISOString().slice(0, 10));
}

export function shiftDay(day: string, days: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

/** ISO bounds of a UTC day, for the API's from/to filters. */
export function dayBounds(day: string): { from: string; to: string } {
  return { from: `${day}T00:00:00.000Z`, to: `${day}T23:59:59.999Z` };
}
