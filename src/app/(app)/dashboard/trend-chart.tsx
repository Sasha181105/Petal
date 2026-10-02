"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import { CHART } from "@/lib/chart-colors";
import { formatMoney, formatNumber } from "@/lib/format";
import { gentle } from "@/lib/motion";

export type TrendRow = {
  /** Short axis label, e.g. "28 Sept". */
  label: string;
  /** Full tooltip/table label, e.g. "Mon 28 Sept" or "Week of 21 Sept". */
  period: string;
  lostCents: number;
  wastedStems: number;
};

/** `money`: deliveries are on, so the chart plots money lost; otherwise stems. */
type Props = { rows: TrendRow[]; currency: string; unit: "day" | "week"; money: boolean };

const axisTick = { fill: CHART.axisText, fontSize: 11, fontFamily: "var(--font-plex-mono)" };

function TrendTooltip({
  active,
  payload,
  currency,
  money,
}: TooltipContentProps<number, string> & { currency: string; money: boolean }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as TrendRow;
  return (
    <div className="border border-hairline bg-linen px-3 py-2 text-sm">
      {/* Value leads, label follows. */}
      <div className="flex items-center gap-2">
        <span aria-hidden className="h-0.5 w-3 rounded-full" style={{ background: CHART.money }} />
        <span className="font-semibold text-soil">
          {money ? formatMoney(row.lostCents, currency) : formatNumber(row.wastedStems)}
        </span>
        <span className="text-soil-soft">{money ? "lost" : "stems binned"}</span>
      </div>
      {money && <div className="mt-0.5 text-soil-soft">{formatNumber(row.wastedStems)} stems binned</div>}
      <div className="label-caps mt-1">{row.period}</div>
    </div>
  );
}

/** Waste over time (money, or stems without deliveries): one series, so no legend. */
export function TrendChart({ rows, currency, unit, money }: Props) {
  const [asTable, setAsTable] = useState(false);
  const data = rows.map((r) => ({ ...r, value: money ? r.lostCents / 100 : r.wastedStems }));

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-serif text-3xl md:text-4xl">
          {money ? "Money lost" : "Stems binned"}, {unit === "day" ? "day by day" : "week by week"}
        </h2>
        <button
          type="button"
          onClick={() => setAsTable((t) => !t)}
          aria-pressed={asTable}
          className="min-h-11 shrink-0 text-sm text-soil-soft underline decoration-hairline decoration-2 underline-offset-8 hover:text-soil hover:decoration-moss"
        >
          {asTable ? "Show as chart" : "Show as table"}
        </button>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {asTable ? (
          <motion.div
            key="table"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={gentle}
            className="mt-6 max-h-80 overflow-y-auto border-t border-soil"
          >
            <table className="w-full text-sm">
              <caption className="sr-only">{money ? "Money lost and stems" : "Stems"} binned per {unit}</caption>
              <thead>
                <tr className="label-caps text-left">
                  <th scope="col" className="py-2 font-normal">{unit === "day" ? "Day" : "Week"}</th>
                  {money && <th scope="col" className="py-2 text-right font-normal">Lost</th>}
                  <th scope="col" className="py-2 text-right font-normal">Stems</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {rows.map((r) => (
                  <tr key={r.period} className="border-t border-hairline">
                    <td className="py-2">{r.period}</td>
                    {money && <td className="py-2 text-right">{formatMoney(r.lostCents, currency)}</td>}
                    <td className={`py-2 text-right ${money ? "text-soil-soft" : ""}`}>{formatNumber(r.wastedStems)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        ) : (
          <motion.div
            key="chart"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={gentle}
            // Height includes the x-axis band, so labels never get clipped.
            className="mt-6 h-64 md:h-80"
            role="img"
            aria-label={`${money ? "Money lost" : "Stems binned"} per ${unit}. Use "Show as table" for the values.`}
          >
            <ResponsiveContainer width="100%" height="100%">
              {/* Right margin leaves room for the last date label ("1 Oct"). */}
              <AreaChart data={data} margin={{ top: 8, right: 24, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke={CHART.grid} strokeWidth={1} />
                <XAxis
                  dataKey="label"
                  tick={axisTick}
                  tickLine={false}
                  axisLine={{ stroke: CHART.grid }}
                  minTickGap={28}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={axisTick}
                  tickLine={false}
                  axisLine={false}
                  width={52}
                  allowDecimals={false}
                  tickFormatter={(v: number) => (money ? formatMoney(v * 100, currency) : formatNumber(v))}
                />
                <Tooltip
                  cursor={{ stroke: CHART.ink, strokeWidth: 1 }}
                  content={(p) => (
                    <TrendTooltip {...(p as TooltipContentProps<number, string>)} currency={currency} money={money} />
                  )}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={CHART.money}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  fill={CHART.money}
                  fillOpacity={0.1}
                  dot={false}
                  activeDot={{ r: 5, fill: CHART.money, stroke: CHART.surface, strokeWidth: 2 }}
                  animationDuration={700}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
