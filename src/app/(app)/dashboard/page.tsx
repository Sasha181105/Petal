import { PageTitle } from "@/components/page-title";
import { todayIn } from "@/lib/dates";
import { change, formatMoney, formatNumber, formatPercent, formatShortDate } from "@/lib/format";
import { requireShop } from "@/lib/shop";
import { flowerStats, periodSummary, wasteTrend } from "@/lib/stats";
import { DashboardFrame } from "./dashboard-frame";
import { FlowerTable } from "./flower-table";
import { parseRange } from "./range";
import { TopFive } from "./top-five";
import { TrendChart, type TrendRow } from "./trend-chart";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const { shop } = await requireShop();
  const today = todayIn();
  const range = parseRange(await searchParams, today);

  const [now, before, flowers, trend] = await Promise.all([
    periodSummary(shop.id, range.from, range.to),
    periodSummary(shop.id, range.previous.from, range.previous.to),
    flowerStats(shop.id, range.from, range.to),
    wasteTrend(shop.id, range.from, range.to, range.unit),
  ]);

  const trendRows: TrendRow[] = trend.map((p) => ({
    label: formatShortDate(p.start),
    period:
      range.unit === "day"
        ? new Date(`${p.start}T00:00:00Z`).toLocaleDateString("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "short",
            timeZone: "UTC",
          })
        : `Week of ${formatShortDate(p.start)}`,
    lostCents: p.lostCents,
    wastedStems: p.wastedStems,
  }));

  const vs = `vs previous ${range.days} days`;
  const empty = now.wastedStems === 0 && now.deliveredStems === 0;

  return (
    <>
      <PageTitle title="Waste" accent="report." />
      <DashboardFrame range={range} today={today}>
        <p className="label-caps mb-8">
          {formatShortDate(range.from)} – {formatShortDate(range.to)} · {range.days} days
        </p>

        {/* Headline figures */}
        <dl className="grid grid-cols-2 gap-y-10 border-t border-soil pt-6 md:grid-cols-4">
          <Figure
            label="Money lost"
            value={formatMoney(now.lostCents, shop.currency)}
            tone="text-clay"
            size="hero"
            delta={change(now.lostCents, before.lostCents)}
            vs={vs}
          />
          <Figure
            label="Waste rate"
            value={now.wasteRate === null ? "—" : formatPercent(now.wasteRate)}
            tone="text-rose-deep"
            points={
              now.wasteRate !== null && before.wasteRate !== null
                ? Math.round((now.wasteRate - before.wasteRate) * 100)
                : null
            }
            vs={vs}
          />
          <Figure
            label="Stems binned"
            value={formatNumber(now.wastedStems)}
            delta={change(now.wastedStems, before.wastedStems)}
            vs={vs}
          />
          <Figure
            label="Stems delivered"
            value={formatNumber(now.deliveredStems)}
            note={`${formatNumber(before.deliveredStems)} the ${range.days} days before`}
          />
        </dl>

        {empty ? (
          <p className="mt-16 border-t border-hairline py-10 text-lg text-soil-soft">
            Nothing was delivered or binned in this period. Try a longer one.
          </p>
        ) : (
          <>
            <section className="mt-20">
              <TrendChart rows={trendRows} currency={shop.currency} unit={range.unit} />
            </section>

            <div className="mt-20 grid gap-20 lg:grid-cols-12 lg:gap-12">
              <section className="lg:col-span-5">
                <TopFive flowers={flowers} currency={shop.currency} />
              </section>
              <section className="lg:col-span-7">
                <FlowerTable flowers={flowers} currency={shop.currency} />
              </section>
            </div>
          </>
        )}
      </DashboardFrame>
    </>
  );
}

/**
 * One headline figure. More waste is worse, so "up" reads in clay and "down"
 * in moss, always with an arrow and words, never colour alone.
 */
function Figure({
  label,
  value,
  tone = "text-soil",
  size,
  delta,
  points,
  note,
  vs,
}: {
  label: string;
  value: string;
  tone?: string;
  size?: "hero";
  /** Relative change (0.12 = +12%). */
  delta?: number | null;
  /** Change in percentage points (for the rate itself). */
  points?: number | null;
  note?: string;
  vs?: string;
}) {
  const shown = delta !== undefined ? delta : points;
  const text =
    delta !== undefined && delta !== null
      ? `${Math.abs(Math.round(delta * 100))}%`
      : points !== undefined && points !== null
        ? `${Math.abs(points)} pts`
        : null;

  return (
    <div className="border-l border-hairline pl-5 first:border-l-0 first:pl-0 [&:nth-child(3)]:border-l-0 [&:nth-child(3)]:pl-0 md:[&:nth-child(3)]:border-l md:[&:nth-child(3)]:pl-5">
      <dt className="label-caps">{label}</dt>
      <dd className={`mt-3 font-serif leading-none ${tone} ${size === "hero" ? "text-6xl md:text-8xl" : "text-5xl md:text-6xl"}`}>
        {value}
      </dd>
      {shown !== undefined && (
        <dd className="mt-3 text-sm text-soil-soft">
          {shown === null || text === null ? (
            "Nothing to compare yet"
          ) : shown === 0 ? (
            <>No change <span className="text-soil-soft">{vs}</span></>
          ) : (
            <span className={shown > 0 ? "text-clay" : "text-moss"}>
              {shown > 0 ? "↑" : "↓"} {text} <span className="text-soil-soft">{vs}</span>
            </span>
          )}
        </dd>
      )}
      {note && <dd className="mt-3 text-sm text-soil-soft">{note}</dd>}
    </div>
  );
}
