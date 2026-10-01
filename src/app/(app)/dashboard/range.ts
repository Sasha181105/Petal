import { addDays, ISO_DATE } from "@/lib/dates";

export const PRESETS = [
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
  { key: "month", label: "This month" },
] as const;

export type RangeKey = (typeof PRESETS)[number]["key"] | "custom";

export type Range = {
  key: RangeKey;
  from: string;
  to: string;
  days: number;
  /** The same number of days immediately before, for comparison. */
  previous: { from: string; to: string };
  /** Trend buckets: days for a month or less, weeks beyond that. */
  unit: "day" | "week";
};

const DEFAULT: RangeKey = "30d";
const MAX_DAYS = 366;

const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000) + 1;

/** Read ?range=…&from=…&to=… safely; anything invalid falls back to the last 30 days. */
export function parseRange(
  params: { range?: string; from?: string; to?: string },
  today: string,
): Range {
  let key = (params.range as RangeKey) ?? DEFAULT;
  let from: string;
  let to = today;

  switch (key) {
    case "7d":
      from = addDays(today, -6);
      break;
    case "90d":
      from = addDays(today, -89);
      break;
    case "month":
      from = `${today.slice(0, 8)}01`;
      break;
    case "custom": {
      const ok =
        params.from &&
        params.to &&
        ISO_DATE.test(params.from) &&
        ISO_DATE.test(params.to) &&
        params.from <= params.to &&
        params.to <= today &&
        daysBetween(params.from, params.to) <= MAX_DAYS;
      if (ok) {
        from = params.from!;
        to = params.to!;
        break;
      }
      key = DEFAULT;
      from = addDays(today, -29);
      break;
    }
    default:
      key = DEFAULT;
      from = addDays(today, -29);
  }

  const days = daysBetween(from, to);
  return {
    key,
    from,
    to,
    days,
    previous: { from: addDays(from, -days), to: addDays(from, -1) },
    unit: days <= 31 ? "day" : "week",
  };
}
