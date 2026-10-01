import "server-only";
import { sql, type SQL } from "drizzle-orm";
import { db } from "@/db";

/**
 * Waste entries in a period, each priced per stem.
 *
 * Money lost prices each wasted stem at that flower's most recent delivery
 * on or before the waste date, falling back to the earliest one after it.
 * Columns: flower_type_id, quantity, wasted_on, unit_cost (cents).
 */
function pricedWaste(shopId: string, from: string, to: string): SQL {
  return sql`
    select w.flower_type_id, w.quantity, w.wasted_on,
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
  `;
}

export type PeriodSummary = {
  wastedStems: number;
  deliveredStems: number;
  lostCents: number;
  /** Wasted ÷ delivered within the period; null when nothing was delivered. */
  wasteRate: number | null;
  worstFlower: { name: string; lostCents: number } | null;
};

/** Waste totals for a shop between two dates (inclusive, YYYY-MM-DD). */
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
    with priced as (${pricedWaste(shopId, from, to)}),
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

export type FlowerStats = {
  id: string;
  name: string;
  photoUrl: string | null;
  deliveredStems: number;
  wastedStems: number;
  lostCents: number;
  /** null when nothing was delivered in the period. */
  wasteRate: number | null;
};

/** Per-flower totals for every flower with deliveries or waste in the period. */
export async function flowerStats(shopId: string, from: string, to: string): Promise<FlowerStats[]> {
  const rows = await db.execute<{
    id: string;
    name: string;
    photo_url: string | null;
    delivered: number;
    wasted: number;
    lost: string;
  }>(sql`
    with priced as (${pricedWaste(shopId, from, to)}),
    w as (
      select flower_type_id, sum(quantity) as stems, sum(quantity * unit_cost) as cents
      from priced group by flower_type_id
    ),
    d as (
      select flower_type_id, sum(quantity) as stems from deliveries
      where shop_id = ${shopId} and received_on between ${from}::date and ${to}::date
      group by flower_type_id
    )
    select f.id, f.name, f.photo_url,
      coalesce(d.stems, 0)::int as delivered,
      coalesce(w.stems, 0)::int as wasted,
      coalesce(w.cents, 0)::bigint as lost
    from flower_types f
    left join w on w.flower_type_id = f.id
    left join d on d.flower_type_id = f.id
    where f.shop_id = ${shopId} and (w.stems is not null or d.stems is not null)
    order by lost desc, f.name
  `);

  return rows.map((r) => {
    const deliveredStems = Number(r.delivered);
    const wastedStems = Number(r.wasted);
    return {
      id: r.id,
      name: r.name,
      photoUrl: r.photo_url,
      deliveredStems,
      wastedStems,
      lostCents: Number(r.lost),
      wasteRate: deliveredStems > 0 ? wastedStems / deliveredStems : null,
    };
  });
}

export type TrendPoint = { start: string; lostCents: number; wastedStems: number };

/** Money lost and stems wasted per day or per week (weeks start on Monday). */
export async function wasteTrend(
  shopId: string,
  from: string,
  to: string,
  unit: "day" | "week",
): Promise<TrendPoint[]> {
  // `unit` is one of two fixed words, never user text, so it's safe to inline.
  const u = sql.raw(`'${unit}'`);
  const rows = await db.execute<{ start: string; cents: string; stems: number }>(sql`
    with priced as (${pricedWaste(shopId, from, to)}),
    buckets as (
      select generate_series(
        date_trunc(${u}, ${from}::date), ${to}::date, ('1 ' || ${u})::interval
      )::date as start
    ),
    agg as (
      select date_trunc(${u}, wasted_on)::date as start,
        sum(quantity * unit_cost) as cents, sum(quantity) as stems
      from priced group by 1
    )
    select to_char(b.start, 'YYYY-MM-DD') as start,
      coalesce(a.cents, 0)::bigint as cents,
      coalesce(a.stems, 0)::int as stems
    from buckets b left join agg a on a.start = b.start
    order by b.start
  `);

  return rows.map((r) => ({
    start: r.start,
    lostCents: Number(r.cents),
    wastedStems: Number(r.stems),
  }));
}
