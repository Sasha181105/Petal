import Link from "next/link";
import { GetStartedButton } from "./get-started";

const GAINS = [
  {
    title: "Waste rate per flower",
    text: "The share of each delivery that ends up in the bin. 12% of roses, 39% of tulips: the number that tells you what to order less of.",
  },
  {
    title: "Money lost at real prices",
    text: "Waste is priced at what you actually paid for that delivery, not a usual price you set once.",
  },
  {
    title: "Delivered vs binned",
    text: "Stems in and stems out, side by side, for any period on the dashboard.",
  },
  {
    title: "A delivery log",
    text: "Flower, stems, price per stem, supplier. Last time's price and supplier fill themselves in, so a delivery takes about 20 seconds.",
  },
];

const STAYS = [
  "Logging waste works exactly as it does now.",
  "Your waste history is kept and appears in every report.",
  "You can turn deliveries off again in Settings. Nothing gets deleted.",
];

/** Shown on the Deliveries tab while the feature is off. */
export function DeliveriesIntro() {
  return (
    <div className="grid gap-16 lg:grid-cols-12 lg:gap-12">
      <div className="lg:col-span-7">
        <p className="max-w-xl text-lg leading-relaxed text-soil-soft">
          Deliveries are an <em className="text-soil">optional</em> part of Petal. Without them, waste
          is priced at each flower&apos;s usual price. With them, you also see how much of each
          delivery gets thrown away.
        </p>

        <h2 className="label-caps mt-12">What changes when you turn it on</h2>
        <ol className="mt-4 border-t border-soil">
          {GAINS.map((g, i) => (
            <li key={g.title} className="grid grid-cols-[3rem_1fr] gap-4 border-b border-hairline py-6">
              <span className="font-mono text-sm text-soil-soft">0{i + 1}</span>
              <div>
                <h3 className="font-serif text-3xl leading-tight">{g.title}</h3>
                <p className="mt-2 max-w-lg text-soil-soft">{g.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <h2 className="label-caps mt-12">What stays the same</h2>
        <ul className="mt-4 space-y-2">
          {STAYS.map((s) => (
            <li key={s} className="flex gap-3">
              <span aria-hidden className="mt-2.5 h-1.5 w-3 shrink-0 rounded-[100%_0] bg-moss" />
              {s}
            </li>
          ))}
        </ul>

        <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-soil pt-8">
          <GetStartedButton />
          <Link
            href="/dashboard"
            className="text-base font-medium underline decoration-hairline decoration-2 underline-offset-8 hover:decoration-rose-deep"
          >
            Not now
          </Link>
        </div>
      </div>

      {/* Preview: what the dashboard gains. Illustrative figures. */}
      <aside className="lg:col-span-5" aria-label="Preview of the dashboard with deliveries on">
        <div className="border border-dashed border-soil/30 p-6 lg:sticky lg:top-8">
          <p className="label-caps">Preview · sample figures</p>
          <div className="mt-6 grid grid-cols-2 border-t border-hairline pt-5">
            <div>
              <p className="label-caps">Waste rate</p>
              <p className="mt-2 font-serif text-6xl leading-none text-rose-deep">12%</p>
              <p className="mt-2 text-sm text-soil-soft">of 5,825 delivered</p>
            </div>
            <div className="border-l border-hairline pl-5">
              <p className="label-caps">Stems delivered</p>
              <p className="mt-2 font-serif text-6xl leading-none">5,825</p>
              <p className="mt-2 text-sm text-soil-soft">last 30 days</p>
            </div>
          </div>
          <ul className="mt-6 space-y-3 border-t border-hairline pt-5 text-sm">
            {[
              ["Tulip", 0.39],
              ["Peony", 0.28],
              ["Rose (red)", 0.12],
            ].map(([name, rate]) => (
              <li key={name as string} className="grid grid-cols-[6rem_1fr_3rem] items-center gap-3">
                <span>{name}</span>
                <span className="h-2 overflow-hidden rounded-r-[4px] bg-rose-wash">
                  <span className="block h-full rounded-r-[4px] bg-chart-rate" style={{ width: `${(rate as number) * 200}%` }} />
                </span>
                <span className="text-right tabular-nums">{Math.round((rate as number) * 100)}%</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
