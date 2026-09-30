import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export type PeriodSummary = {
  wastedStems: number;
  deliveredStems: number;
  lostCents: number;
  /** Wasted ÷ delivered within the period; null when nothing was delivered. */
  wasteRate: number | null;
  worstFlower: { name: string; lostCents: number } | null;
};

/**
 * Waste totals for a shop between two dates (inclusive, YYYY-MM-DD).
 *
 * Money lost prices each wasted stem at that flower's most recent delivery
 * on or before the waste date, falling back to the earliest one after it.
 */
export async function periodSummary(
  shopId: string,
  from: string,
  to: string,
): Promise<PeriodSummary> {
  const rows = await db.execute<{
    wasted_stems: number;
    delivered_stems: number;
    lost_cents: string;
    worst_name: string | null;
    worst_cents: string | null;
  }>(sql`
    with priced as (
      select w.flower_type_id, w.quantity,
        coalesce((
          select d.unit_cost_cents from deliveries d
          where d.shop_id = w.shop_id and d.flower_type_id = w.flower_type_id
          order by (d.received_on <= w.wasted_on) desc,
                   case when d.received_on <= w.wasted_on then d.received_on end desc nulls last,
                   d.received_on asc
          limit 1
        ), 0) as unit_cost
      from waste_entries w
      where w.shop_id = ${shopId} and w.wasted_on between ${from}::date and ${to}::date
    ),
    per_flower as (
      select flower_type_id, sum(quantity * unit_cost) as cents, sum(quantity) as stems
      from priced group by flower_type_id
    )
    select
      coalesce((select sum(stems) from per_flower), 0)::int as wasted_stems,
      coalesce((select sum(quantity) from deliveries
                where shop_id = ${shopId} and received_on between ${from}::date and ${to}::date), 0)::int
        as delivered_stems,
      coalesce((select sum(cents) from per_flower), 0)::bigint as lost_cents,
      (select f.name from per_flower p join flower_types f on f.id = p.flower_type_id
        order by p.cents desc limit 1) as worst_name,
      (select max(cents) from per_flower)::bigint as worst_cents
  `);

  const r = rows[0];
  const wastedStems = Number(r.wasted_stems);
  const deliveredStems = Number(r.delivered_stems);
  return {
    wastedStems,
    deliveredStems,
    lostCents: Number(r.lost_cents),
    wasteRate: deliveredStems > 0 ? wastedStems / deliveredStems : null,
    worstFlower: r.worst_name ? { name: r.worst_name, lostCents: Number(r.worst_cents) } : null,
  };
}
