// Shared number and date formatting (client-safe).

export function formatMoney(cents: number, currency: string, decimals = 0) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(cents / 100);
}

export const formatNumber = (n: number) => n.toLocaleString("en-IE");

export const formatPercent = (ratio: number) => `${Math.round(ratio * 100)}%`;

/** "28 Sept" */
export function formatShortDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** Relative change, or null when there's nothing to compare against. */
export const change = (now: number, before: number) => (before > 0 ? (now - before) / before : null);
