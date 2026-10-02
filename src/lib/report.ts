import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import type { WasteReason } from "@/db/schema";
import { addDays } from "./dates";
import { flowerStats, periodSummary, scopeOf, type FlowerStats, type PeriodSummary } from "./stats";
import { weekOf, type Week } from "./weeks";

export type ReasonCounts = Record<WasteReason, number>;

export type ReportEntry = {
  date: string;
  flower: string;
  quantity: number;
  reason: WasteReason;
  loggedBy: string;
};

export type WeekReport = {
  shop: { name: string; currency: string; deliveriesEnabled: boolean };
  week: Week;
  previousNumber: number;
  now: PeriodSummary;
  before: PeriodSummary;
  flowers: (FlowerStats & { reasons: ReasonCounts })[];
  entries: ReportEntry[];
};

const NO_REASONS: ReasonCounts = { wilted: 0, damaged: 0, unsold: 0, other: 0 };

/** Everything the weekly PDF needs, for one shop and one Monday–Sunday week. */
export async function weekReport(
  shop: { id: string; name: string; currency: string; deliveriesEnabled: boolean },
  start: string,
): Promise<WeekReport> {
  const scope = scopeOf(shop);
  const end = addDays(start, 6);
  const prevStart = addDays(start, -7);

  const [now, before, stats, reasons, entries] = await Promise.all([
    periodSummary(scope, start, end),
    periodSummary(scope, prevStart, addDays(start, -1)),
    flowerStats(scope, start, end),
    db.execute<{ flower_type_id: string; reason: WasteReason; stems: number }>(sql`
      select flower_type_id, reason, sum(quantity)::int as stems
      from waste_entries
      where shop_id = ${shop.id} and wasted_on between ${start}::date and ${end}::date
      group by flower_type_id, reason
    `),
    // Who logged it: the member's email from Supabase Auth.
    db.execute<{ date: string; flower: string; quantity: number; reason: WasteReason; email: string | null }>(sql`
      select to_char(w.wasted_on, 'YYYY-MM-DD') as date, f.name as flower, w.quantity,
        w.reason, u.email
      from waste_entries w
      join flower_types f on f.id = w.flower_type_id
      left join auth.users u on u.id = w.created_by
      where w.shop_id = ${shop.id} and w.wasted_on between ${start}::date and ${end}::date
      order by w.wasted_on, w.created_at
    `),
  ]);

  const byFlower = new Map<string, ReasonCounts>();
  for (const r of reasons) {
    const counts = byFlower.get(r.flower_type_id) ?? { ...NO_REASONS };
    counts[r.reason] = Number(r.stems);
    byFlower.set(r.flower_type_id, counts);
  }

  return {
    shop: { name: shop.name, currency: shop.currency, deliveriesEnabled: shop.deliveriesEnabled },
    week: weekOf(start, "closed"),
    previousNumber: weekOf(prevStart, "closed").number,
    now,
    before,
    flowers: stats
      .filter((f) => f.wastedStems > 0)
      .map((f) => ({ ...f, reasons: byFlower.get(f.id) ?? { ...NO_REASONS } })),
    entries: entries.map((e) => ({
      date: e.date,
      flower: e.flower,
      quantity: Number(e.quantity),
      reason: e.reason,
      loggedBy: e.email ?? "—",
    })),
  };
}
