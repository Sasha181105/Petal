"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { ZoomablePhoto } from "@/components/zoomable-photo";
import { formatMoney, formatNumber, formatPercent } from "@/lib/format";
import { gentle } from "@/lib/motion";
import type { FlowerStats } from "@/lib/stats";

type Key = "name" | "deliveredStems" | "wastedStems" | "wasteRate" | "lostCents";
type Sort = { key: Key; desc: boolean };

const COLUMNS: { key: Key; label: string; numeric: boolean; wide?: boolean }[] = [
  { key: "name", label: "Flower", numeric: false },
  { key: "deliveredStems", label: "Delivered", numeric: true, wide: true },
  { key: "wastedStems", label: "Binned", numeric: true, wide: true },
  { key: "wasteRate", label: "Waste rate", numeric: true },
  { key: "lostCents", label: "Lost", numeric: true },
];

function compare(a: FlowerStats, b: FlowerStats, key: Key) {
  if (key === "name") return a.name.localeCompare(b.name);
  // Flowers with no deliveries (no rate) sort to the bottom.
  return (a[key] ?? -1) - (b[key] ?? -1);
}

/** Every flower in the period. Doubles as the table view of the charts above. */
export function FlowerTable({ flowers, currency }: { flowers: FlowerStats[]; currency: string }) {
  const [sort, setSort] = useState<Sort>({ key: "lostCents", desc: true });
  const rows = [...flowers].sort((a, b) => compare(a, b, sort.key) * (sort.desc ? -1 : 1));

  function toggle(key: Key) {
    setSort((s) => (s.key === key ? { key, desc: !s.desc } : { key, desc: key !== "name" }));
  }

  return (
    <div>
      <h2 className="font-serif text-3xl md:text-4xl">Every flower</h2>
      <p className="mt-2 max-w-2xl text-sm text-soil-soft">
        Waste rate is stems binned ÷ stems delivered in this period. Over short periods it can
        top 100% when stems from an earlier delivery are binned.
      </p>

      <table className="mt-6 w-full border-t border-soil text-sm">
        <caption className="sr-only">Deliveries, waste and money lost per flower. Tap a column to sort.</caption>
        <thead>
          <tr>
            {COLUMNS.map((c) => {
              const active = sort.key === c.key;
              return (
                <th
                  key={c.key}
                  scope="col"
                  aria-sort={active ? (sort.desc ? "descending" : "ascending") : "none"}
                  className={`py-2 font-normal ${c.numeric ? "text-right" : "text-left"} ${
                    c.wide ? "hidden sm:table-cell" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggle(c.key)}
                    className={`label-caps inline-flex min-h-9 items-center gap-1 hover:text-soil ${
                      active ? "text-soil" : ""
                    }`}
                  >
                    {c.label}
                    <span aria-hidden className={`transition-opacity ${active ? "opacity-100" : "opacity-0"}`}>
                      {sort.desc ? "↓" : "↑"}
                    </span>
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {rows.map((f) => (
            <motion.tr key={f.id} layout="position" transition={gentle} className="border-t border-hairline">
              <td className="py-2.5 pr-3">
                <span className="flex items-center gap-3">
                  <ZoomablePhoto url={f.photoUrl} name={f.name} variant="chip" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{f.name}</span>
                    {/* On phones the delivered/binned columns fold into this line. */}
                    <span className="block text-xs text-soil-soft sm:hidden">
                      {formatNumber(f.wastedStems)} of {formatNumber(f.deliveredStems)} binned
                    </span>
                  </span>
                </span>
              </td>
              <td className="hidden py-2.5 text-right sm:table-cell">{formatNumber(f.deliveredStems)}</td>
              <td className="hidden py-2.5 text-right sm:table-cell">{formatNumber(f.wastedStems)}</td>
              <td className="py-2.5 text-right">
                <span className="inline-flex items-center justify-end gap-2">
                  {/* Meter: same-ramp track, fill capped at 100%. */}
                  <span aria-hidden className="hidden h-1.5 w-14 overflow-hidden rounded-full bg-rose-wash md:block">
                    <span
                      className="block h-full rounded-full bg-chart-rate"
                      style={{ width: `${Math.min(f.wasteRate ?? 0, 1) * 100}%` }}
                    />
                  </span>
                  <span className="w-10">{f.wasteRate === null ? "—" : formatPercent(f.wasteRate)}</span>
                </span>
              </td>
              <td className="py-2.5 pl-3 text-right font-medium">{formatMoney(f.lostCents, currency)}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
