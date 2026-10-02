"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { ZoomablePhoto } from "@/components/zoomable-photo";
import { formatMoney, formatNumber, formatPercent } from "@/lib/format";
import { gentle } from "@/lib/motion";
import type { FlowerStats } from "@/lib/stats";

type Key = "name" | "deliveredStems" | "wastedStems" | "wasteRate" | "lostCents";
type Sort = { key: Key; desc: boolean };
type Column = { key: Key; label: string; numeric: boolean; wide?: boolean; needsDeliveries?: boolean };

const ALL_COLUMNS: Column[] = [
  { key: "name", label: "Flower", numeric: false },
  { key: "deliveredStems", label: "Delivered", numeric: true, wide: true, needsDeliveries: true },
  { key: "wastedStems", label: "Binned", numeric: true, wide: true },
  { key: "wasteRate", label: "Waste rate", numeric: true, needsDeliveries: true },
  { key: "lostCents", label: "Lost", numeric: true, needsDeliveries: true },
];

function compare(a: FlowerStats, b: FlowerStats, key: Key) {
  if (key === "name") return a.name.localeCompare(b.name);
  // Flowers with no deliveries (no rate) sort to the bottom.
  return (a[key] ?? -1) - (b[key] ?? -1);
}

/** `money`: deliveries are on, so there are prices: money and waste rate columns. */
type Props = { flowers: FlowerStats[]; currency: string; money: boolean };

/**
 * Every flower in the period, folded away by default to keep the dashboard
 * short. Doubles as the table view of the charts above.
 */
export function AllFlowers({ flowers, currency, money }: Props) {
  const deliveries = money;
  const [open, setOpen] = useState(false);
  const [sort, setSort] = useState<Sort>({ key: money ? "lostCents" : "wastedStems", desc: true });
  const columns = ALL_COLUMNS.filter((c) => deliveries || !c.needsDeliveries);
  // On phones the wide columns fold into the name cell, but binned must stay
  // visible when it's one of only three columns.
  const isHiddenOnPhone = (c: Column) => c.wide && deliveries;
  const rows = [...flowers].sort((a, b) => compare(a, b, sort.key) * (sort.desc ? -1 : 1));

  function toggle(key: Key) {
    setSort((s) => (s.key === key ? { key, desc: !s.desc } : { key, desc: key !== "name" }));
  }

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="group flex w-full items-baseline justify-between gap-4 border-t border-soil py-5 text-left"
      >
        <span className="font-serif text-3xl md:text-4xl">Every flower</span>
        <span className="text-sm text-soil-soft underline decoration-hairline decoration-2 underline-offset-8 group-hover:text-soil group-hover:decoration-moss">
          {open ? "Hide" : `Show all ${flowers.length}`}
          <motion.span aria-hidden className="ml-1 inline-block" animate={{ rotate: open ? 180 : 0 }} transition={gentle}>
            ↓
          </motion.span>
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={gentle}
            className="overflow-hidden"
          >
            {deliveries ? (
              <p className="max-w-2xl text-sm text-soil-soft">
                Waste rate is stems binned ÷ stems delivered in this period. Over short periods it can
                top 100% when stems from an earlier delivery are binned.
              </p>
            ) : (
              <p className="max-w-2xl text-sm text-soil-soft">
                Stems binned per flower, by count. Money lost needs purchase prices, which come
                from{" "}
                <Link href="/deliveries" className="underline decoration-hairline decoration-2 underline-offset-4 hover:decoration-moss">
                  deliveries
                </Link>
                .
              </p>
            )}

            <table className="mt-4 w-full text-sm">
              <caption className="sr-only">Waste and money lost per flower. Tap a column to sort.</caption>
              <thead>
                <tr className="border-b border-hairline">
                  {columns.map((c) => {
                    const active = sort.key === c.key;
                    return (
                      <th
                        key={c.key}
                        scope="col"
                        aria-sort={active ? (sort.desc ? "descending" : "ascending") : "none"}
                        className={`py-2 font-normal ${c.numeric ? "text-right" : "text-left"} ${
                          isHiddenOnPhone(c) ? "hidden sm:table-cell" : ""
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggle(c.key)}
                          className={`label-caps inline-flex min-h-9 items-center gap-1 hover:text-soil ${active ? "text-soil" : ""}`}
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
                  <motion.tr key={f.id} layout="position" transition={gentle} className="border-b border-hairline">
                    <td className="py-2.5 pr-3">
                      <span className="flex items-center gap-3">
                        <ZoomablePhoto url={f.photoUrl} name={f.name} variant="chip" />
                        <span className="min-w-0">
                          <span className="block truncate font-medium">
                            {f.name}
                            {money && !f.priced && (
                              <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.14em] text-clay">no delivery</span>
                            )}
                          </span>
                          {deliveries && (
                            <span className="block text-xs text-soil-soft sm:hidden">
                              {formatNumber(f.wastedStems)} of {formatNumber(f.deliveredStems)} binned
                            </span>
                          )}
                        </span>
                      </span>
                    </td>
                    {deliveries && (
                      <td className="hidden py-2.5 text-right sm:table-cell">{formatNumber(f.deliveredStems)}</td>
                    )}
                    <td className={`py-2.5 text-right ${deliveries ? "hidden sm:table-cell" : ""}`}>
                      {formatNumber(f.wastedStems)}
                    </td>
                    {deliveries && (
                      <td className="py-2.5 text-right">
                        <span className="inline-flex items-center justify-end gap-2">
                          <span aria-hidden className="hidden h-1.5 w-14 overflow-hidden rounded-full bg-rose-wash md:block">
                            <span
                              className="block h-full rounded-full bg-chart-rate"
                              style={{ width: `${Math.min(f.wasteRate ?? 0, 1) * 100}%` }}
                            />
                          </span>
                          <span className="w-10">{f.wasteRate === null ? "—" : formatPercent(f.wasteRate)}</span>
                        </span>
                      </td>
                    )}
                    {money && (
                      <td className="py-2.5 pl-3 text-right font-medium">{formatMoney(f.lostCents, currency)}</td>
                    )}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
