import { PageTitle } from "@/components/page-title";
import { addDays, todayIn, weekStartOf } from "@/lib/dates";
import { formatMoney, formatNumber, formatShortDate } from "@/lib/format";
import { requireManagerPage } from "@/lib/shop";
import { scopeOf, wasteTrend } from "@/lib/stats";
import { weekOf, weekStatuses } from "@/lib/weeks";
import { WeekActions } from "./week-actions";

const WEEKS_SHOWN = 12;

const STATUS = {
  open: { label: "Open", className: "bg-sage-wash text-moss" },
  reopened: { label: "Reopened", className: "bg-clay-wash text-clay" },
  closed: { label: "Closed", className: "bg-linen-deep text-soil-soft" },
} as const;

export default async function WeeksPage() {
  const { shop } = await requireManagerPage();
  const today = todayIn();
  const current = weekStartOf(today);
  const first = addDays(current, -7 * (WEEKS_SHOWN - 1));

  // One query for the totals of every week shown.
  const [totals, statuses] = await Promise.all([
    wasteTrend(scopeOf(shop), first, today, "week"),
    weekStatuses(
      shop.id,
      Array.from({ length: WEEKS_SHOWN }, (_, i) => addDays(current, -7 * i)),
    ),
  ]);
  const byStart = new Map(totals.map((t) => [t.start, t]));
  const weeks = [...statuses.entries()].map(([start, status]) => ({
    ...weekOf(start, status),
    lostCents: byStart.get(start)?.lostCents ?? 0,
    stems: byStart.get(start)?.wastedStems ?? 0,
  }));

  return (
    <>
      <PageTitle title="The" accent="weeks." />
      <p className="-mt-4 mb-10 max-w-2xl text-soil-soft md:-mt-6">
        Each week runs Monday to Sunday and closes by itself at midnight on Sunday. Once it&apos;s
        closed, its report is ready as a PDF.
        {" You can reopen a past week to correct it."}
      </p>

      <ol className="border-t border-soil">
        {weeks.map((w) => (
          <li
            key={w.start}
            className="grid grid-cols-[4.5rem_1fr] items-center gap-x-4 gap-y-3 border-b border-hairline py-5 md:grid-cols-[6rem_1fr_9rem_7rem_auto]"
          >
            <span className="font-serif text-4xl leading-none">
              <span className="font-mono text-xs text-soil-soft">W</span>
              {w.number}
            </span>
            <span>
              <span className="block font-medium">
                {formatShortDate(w.start)} – {formatShortDate(w.end)}
              </span>
              <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ${STATUS[w.status].className}`}>
                {STATUS[w.status].label}
              </span>
            </span>
            {/* Money only with deliveries (purchase prices); otherwise stems lead. */}
            {shop.deliveriesEnabled ? (
              <>
                <span className="col-start-2 md:col-start-auto">
                  <span className="font-serif text-3xl text-clay">{formatMoney(w.lostCents, shop.currency)}</span>
                  <span className="label-caps ml-2">lost</span>
                </span>
                <span className="col-start-2 text-sm text-soil-soft md:col-start-auto">
                  {formatNumber(w.stems)} stems
                </span>
              </>
            ) : (
              <>
                <span className="col-start-2 md:col-start-auto">
                  <span className="font-serif text-3xl text-clay">{formatNumber(w.stems)}</span>
                  <span className="label-caps ml-2">stems</span>
                </span>
                <span className="hidden md:block" />
              </>
            )}
            <span className="col-span-2 md:col-span-1 md:justify-self-end">
              <WeekActions start={w.start} number={w.number} status={w.status} isManager />
            </span>
          </li>
        ))}
      </ol>
    </>
  );
}
