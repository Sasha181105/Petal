import Link from "next/link";
import { PageTitle } from "@/components/page-title";
import { todayIn } from "@/lib/dates";
import { change, formatMoney, formatNumber, formatPercent, formatShortDate } from "@/lib/format";
import { requireManagerPage } from "@/lib/shop";
import { flowerStats, periodSummary, scopeOf, wasteTrend } from "@/lib/stats";
import { DashboardFrame } from "./dashboard-frame";
import { AllFlowers } from "./flower-table";
import { parseRange } from "./range";
import { TopFive } from "./top-five";
import { TrendChart, type TrendRow } from "./trend-chart";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  // Analytics are for managers; staff are sent to the waste log.
  const { shop } = await requireManagerPage();
  const scope = scopeOf(shop);
  const today = todayIn();
  const range = parseRange(await searchParams, today);

  const [now, before, flowers, trend] = await Promise.all([
    periodSummary(scope, range.from, range.to),
    periodSummary(scope, range.previous.from, range.previous.to),
    flowerStats(scope, range.from, range.to),
    wasteTrend(scope, range.from, range.to, range.unit),
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
  // Purchase prices only come from deliveries: without them, stems only.
  const money = shop.deliveriesEnabled;
  const empty = now.wastedStems === 0;
  const period = `${formatShortDate(range.from)} – ${formatShortDate(range.to)}`;

  return (
    <>
      <PageTitle title="Waste" accent="report." />
      <Link
        href="/weeks"
        className="-mt-4 mb-6 inline-block text-sm underline decoration-hairline decoration-2 underline-offset-8 hover:decoration-moss md:-mt-6 print:hidden"
      >
        Weekly reports (PDF) →
      </Link>
      <DashboardFrame range={range} today={today}>
        {/* The headline: one big number, one or two quiet ones beside it. */}
        <section className="grid gap-10 border-t border-soil pt-6 md:grid-cols-12">
          {money ? (
            <div className="md:col-span-6">
              <p className="label-caps">Money lost · {period}</p>
              <p className="mt-3 font-serif text-7xl leading-none text-clay md:text-9xl">
                {formatMoney(now.lostCents, shop.currency)}
              </p>
              <Delta value={change(now.lostCents, before.lostCents)} vs={vs} />
            </div>
          ) : (
            <div className="md:col-span-6">
              <p className="label-caps">Stems binned · {period}</p>
              <p className="mt-3 font-serif text-7xl leading-none text-clay md:text-9xl">
                {formatNumber(now.wastedStems)}
              </p>
              <Delta value={change(now.wastedStems, before.wastedStems)} vs={vs} />
            </div>
          )}

          <dl className="grid grid-cols-2 content-end gap-6 md:col-span-6">
            {money ? (
              <>
                <Small
                  label="Stems binned"
                  value={formatNumber(now.wastedStems)}
                  delta={<Delta value={change(now.wastedStems, before.wastedStems)} vs="" compact />}
                />
                <Small
                  label="Waste rate"
                  value={now.wasteRate === null ? "—" : formatPercent(now.wasteRate)}
                  tone="text-rose-deep"
                  delta={<span className="text-sm text-soil-soft">of {formatNumber(now.deliveredStems)} delivered</span>}
                />
              </>
            ) : (
              <>
                <Small
                  label="Most binned"
                  value={now.mostBinned?.name ?? "—"}
                  tone="text-moss italic"
                  delta={
                    now.mostBinned && (
                      <span className="text-sm text-soil-soft">{formatNumber(now.mostBinned.stems)} stems</span>
                    )
                  }
                />
                <Small
                  label="Per day"
                  value={formatNumber(Math.round(now.wastedStems / range.days))}
                  delta={<span className="text-sm text-soil-soft">stems on average</span>}
                />
              </>
            )}
          </dl>
        </section>

        {/* Honest about gaps in the money figure: waste of a flower never delivered has no price. */}
        {money && now.unpricedFlowers > 0 && (
          <p className="mt-8 max-w-3xl border-l-2 border-clay bg-clay-wash px-4 py-3 text-sm">
            {now.unpricedFlowers === 1 ? "1 flower" : `${now.unpricedFlowers} flowers`} binned in this
            period {now.unpricedFlowers === 1 ? "has" : "have"} no delivery logged, so there&apos;s no price
            for {now.unpricedFlowers === 1 ? "it" : "them"} and money lost is lower than it really is.{" "}
            <Link href="/deliveries" className="font-medium underline decoration-2 underline-offset-4">
              Log a delivery
            </Link>
          </p>
        )}

        {empty ? (
          <p className="mt-16 border-t border-hairline py-10 text-lg text-soil-soft">
            Nothing was binned in this period. Try a longer one.
          </p>
        ) : (
          <>
            <section className="mt-20">
              <TrendChart rows={trendRows} currency={shop.currency} unit={range.unit} money={money} />
            </section>

            <section className="mt-20 max-w-3xl">
              <TopFive flowers={flowers} currency={shop.currency} money={money} />
            </section>

            <section className="mt-20">
              <AllFlowers flowers={flowers} currency={shop.currency} money={money} />
            </section>
          </>
        )}

        {!money && (
          <p className="mt-16 border-t border-hairline pt-6 text-sm text-soil-soft">
            Counting stems only. To see money lost and waste rate, Petal needs your purchase
            prices:{" "}
            <Link href="/deliveries" className="text-soil underline decoration-hairline decoration-2 underline-offset-4 hover:decoration-moss">
              deliveries are optional — see what they add
            </Link>
          </p>
        )}
      </DashboardFrame>
    </>
  );
}

/** Change vs the previous period. More waste is worse: up in clay, down in moss, always with an arrow. */
function Delta({ value, vs, compact }: { value: number | null; vs: string; compact?: boolean }) {
  return (
    <p className={`text-sm text-soil-soft ${compact ? "" : "mt-4"}`}>
      {value === null ? (
        "Nothing to compare yet"
      ) : value === 0 ? (
        `No change ${vs}`
      ) : (
        <span className={value > 0 ? "text-clay" : "text-moss"}>
          {value > 0 ? "↑" : "↓"} {Math.abs(Math.round(value * 100))}%{" "}
          <span className="text-soil-soft">{vs || "vs before"}</span>
        </span>
      )}
    </p>
  );
}

function Small({
  label,
  value,
  tone = "text-soil",
  delta,
}: {
  label: string;
  value: string;
  tone?: string;
  delta?: React.ReactNode;
}) {
  return (
    <div className="border-l border-hairline pl-5">
      <dt className="label-caps">{label}</dt>
      <dd className={`mt-2 truncate font-serif text-4xl leading-none md:text-5xl ${tone}`}>{value}</dd>
      {delta && <dd className="mt-2">{delta}</dd>}
    </div>
  );
}
