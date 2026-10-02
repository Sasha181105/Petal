"use client";

import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useState } from "react";
import { ZoomablePhoto } from "@/components/zoomable-photo";
import { formatMoney, formatNumber, formatPercent } from "@/lib/format";
import { gentle, glide, quick } from "@/lib/motion";
import type { FlowerStats } from "@/lib/stats";

type Mode = "money" | "rate" | "stems";

/** Below this, a percentage is noise (1 of 2 stems = 50%). */
const MIN_DELIVERED_FOR_RATE = 20;

const MODES: { key: Mode; label: string }[] = [
  { key: "money", label: "By money lost" },
  { key: "rate", label: "By waste rate" },
];

/**
 * `money`: deliveries are on, so flowers rank by money lost (or waste rate).
 * Without deliveries there are no prices: they rank by stems binned.
 */
export function TopFive({
  flowers,
  currency,
  money,
}: {
  flowers: FlowerStats[];
  currency: string;
  money: boolean;
}) {
  const [picked, setMode] = useState<Mode>("money");
  const mode: Mode = money ? picked : "stems";
  const rates = money;

  const ranked =
    mode === "money"
      ? flowers.filter((f) => f.lostCents > 0).sort((a, b) => b.lostCents - a.lostCents)
      : mode === "stems"
        ? flowers.filter((f) => f.wastedStems > 0).sort((a, b) => b.wastedStems - a.wastedStems)
        : flowers
            .filter((f) => f.wasteRate !== null && f.deliveredStems >= MIN_DELIVERED_FOR_RATE)
            .sort((a, b) => b.wasteRate! - a.wasteRate!);
  const top = ranked.slice(0, 5);
  const value = (f: FlowerStats) => (mode === "money" ? f.lostCents : mode === "stems" ? f.wastedStems : f.wasteRate!);
  const max = Math.max(...top.map(value), 1e-9);
  const barColor = mode === "rate" ? "bg-chart-rate" : "bg-chart-money";
  const display = (f: FlowerStats) =>
    mode === "money" ? formatMoney(f.lostCents, currency) : mode === "stems" ? formatNumber(f.wastedStems) : formatPercent(f.wasteRate!);

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h2 className="font-serif text-3xl md:text-4xl">
          The five <em className="text-rose-deep">worst</em>
        </h2>

        {/* Segmented toggle; the dark pill glides to the chosen option. */}
        {rates && (
        <LayoutGroup id="top-five-mode">
          <div role="group" aria-label="Rank flowers" className="flex rounded-full border border-soil/25 p-1">
            {MODES.map((m) => (
              <button
                key={m.key}
                type="button"
                aria-pressed={mode === m.key}
                onClick={() => setMode(m.key)}
                className={`relative min-h-9 rounded-full px-4 text-sm font-medium transition-colors ${
                  mode === m.key ? "text-linen" : "text-soil-soft hover:text-soil"
                }`}
              >
                {mode === m.key && (
                  <motion.span layoutId="top-five-pill" transition={glide} className="absolute inset-0 rounded-full bg-soil" />
                )}
                <span className="relative">{m.label}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>
        )}
      </div>

      {top.length === 0 ? (
        <p className="mt-6 border-t border-hairline py-6 text-soil-soft">
          {mode === "rate"
            ? `No flower had ${MIN_DELIVERED_FOR_RATE}+ stems delivered in this period.`
            : "No waste in this period."}
        </p>
      ) : (
        <ol className="mt-6 border-t border-soil">
          <AnimatePresence initial={false} mode="popLayout">
            {top.map((f, i) => {
              const v = value(f);
              return (
                <motion.li
                  key={f.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: quick }}
                  transition={gentle}
                  className="group border-b border-hairline py-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 font-mono text-sm text-soil-soft">0{i + 1}</span>
                    <ZoomablePhoto url={f.photoUrl} name={f.name} variant="chip" />
                    <span className="min-w-0 flex-1 truncate font-medium">{f.name}</span>
                    <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-soil-soft">
                      {rates
                        ? `${formatNumber(f.wastedStems)} / ${formatNumber(f.deliveredStems)} stems`
                        : "stems binned"}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-3 pl-9">
                    <div className="h-5 flex-1">
                      {/* Bar: ≤24px thick, rounded data-end, square at the baseline. */}
                      <motion.div
                        className={`h-full rounded-r-[4px] ${barColor} transition-opacity group-hover:opacity-80`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(v / max) * 100}%` }}
                        transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1], delay: i * 0.04 }}
                      />
                    </div>
                    {/* Value at the tip, in text ink — never the bar colour. */}
                    <span className="w-16 text-right font-semibold">
                      {display(f)}
                    </span>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ol>
      )}
      {mode === "rate" && top.length > 0 && (
        <p className="label-caps mt-3">Flowers with {MIN_DELIVERED_FOR_RATE}+ stems delivered</p>
      )}
    </div>
  );
}
