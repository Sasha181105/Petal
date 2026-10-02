// Dates are stored as plain YYYY-MM-DD. "Today" is always the phone's local
// date (computed in the browser), never the server's, which runs in UTC.

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function localToday(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Where "today" is for server-rendered summaries. The browser uses the
 * phone's own clock instead (localToday).
 */
export const SHOP_TIME_ZONE = "Europe/Dublin";

export function todayIn(timeZone = SHOP_TIME_ZONE): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Monday of the week containing `date` (weeks run Monday–Sunday). */
export function weekStartOf(date: string): string {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  return addDays(date, -((day + 6) % 7));
}

/** ISO week number (1–53) of the week starting on `monday`. */
export function isoWeekNumber(monday: string): number {
  // The ISO week belongs to the year of its Thursday.
  const thursday = new Date(`${addDays(monday, 3)}T00:00:00Z`);
  const jan1 = Date.UTC(thursday.getUTCFullYear(), 0, 1);
  return Math.floor((thursday.getTime() - jan1) / 86_400_000 / 7) + 1;
}

/** "Today", "Yesterday" or e.g. "Mon 28 Sep". */
export function formatDay(date: string, today: string): string {
  if (date === today) return "Today";
  const t = new Date(`${today}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() - 1);
  if (date === t.toISOString().slice(0, 10)) return "Yesterday";
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}
