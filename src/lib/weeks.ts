import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { reopenedWeeks } from "@/db/schema";
import { addDays, isoWeekNumber, todayIn, weekStartOf } from "./dates";

/**
 * Weeks run Monday–Sunday in the shop's time zone and open/close by themselves:
 * the current week is open, past weeks are closed. A manager can reopen a past
 * week to correct it (a row in reopened_weeks) and close it again.
 */

export type WeekStatus = "open" | "reopened" | "closed";

export type Week = {
  start: string; // Monday, YYYY-MM-DD
  end: string; // Sunday
  number: number; // ISO week number
  status: WeekStatus;
};

export function weekOf(start: string, status: WeekStatus): Week {
  return { start, end: addDays(start, 6), number: isoWeekNumber(start), status };
}

/** The current week plus any reopened past weeks: where waste can be logged. */
export async function openWeeks(shopId: string): Promise<{ today: string; weeks: Week[] }> {
  const today = todayIn();
  const current = weekStartOf(today);
  const rows = await db
    .select({ weekStart: reopenedWeeks.weekStart })
    .from(reopenedWeeks)
    .where(eq(reopenedWeeks.shopId, shopId));
  const reopened = rows
    .map((r) => r.weekStart)
    .filter((s) => s < current)
    .sort()
    .map((s) => weekOf(s, "reopened"));
  return { today, weeks: [...reopened, weekOf(current, "open")] };
}

/** Can waste dated `date` be added or removed right now? */
export async function isDateOpen(shopId: string, date: string): Promise<boolean> {
  const { today, weeks } = await openWeeks(shopId);
  if (date > today) return false;
  const start = weekStartOf(date);
  return weeks.some((w) => w.start === start);
}

/** Status of any week, for lists and reports. */
export async function weekStatuses(shopId: string, starts: string[]): Promise<Map<string, WeekStatus>> {
  const { weeks } = await openWeeks(shopId);
  const open = new Map(weeks.map((w) => [w.start, w.status]));
  return new Map(starts.map((s) => [s, open.get(s) ?? "closed"]));
}
