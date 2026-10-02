"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { quick } from "@/lib/motion";
import { formatShortDate } from "@/lib/format";
import { PRESETS, type RangeKey } from "./range";

type Props = {
  range: { key: RangeKey; from: string; to: string };
  today: string;
  children: React.ReactNode;
};

/**
 * The period filter (one row, above everything it scopes) and the content it
 * scopes. While a new period loads, the old figures stay put at half opacity —
 * no skeleton, no jump.
 */
export function DashboardFrame({ range, today, children }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [customOpen, setCustomOpen] = useState(range.key === "custom");
  const [from, setFrom] = useState(range.from);
  const [to, setTo] = useState(range.to);

  function go(query: string) {
    startTransition(() => router.push(`/dashboard?${query}`, { scroll: false }));
  }

  const pill = (active: boolean) =>
    `min-h-11 rounded-full border px-4 text-sm font-medium transition-[color,background-color,border-color,transform] duration-150 active:scale-95 ${
      active
        ? "border-soil bg-soil text-linen"
        : "border-soil/25 text-soil-soft hover:border-soil hover:text-soil"
    }`;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-t border-hairline py-4 print:hidden">
        <span className="label-caps mr-2 w-full sm:w-auto">Period</span>
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            aria-pressed={range.key === p.key}
            onClick={() => {
              setCustomOpen(false);
              go(`range=${p.key}`);
            }}
            className={pill(range.key === p.key)}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          aria-expanded={customOpen}
          onClick={() => setCustomOpen((o) => !o)}
          className={pill(range.key === "custom")}
        >
          {range.key === "custom"
            ? `${formatShortDate(range.from)} – ${formatShortDate(range.to)}`
            : "Custom…"}
        </button>
        <AnimatePresence>
          {pending && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="label-caps ml-2"
              role="status"
            >
              Updating…
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence initial={false}>
        {customOpen && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={quick}
            onSubmit={(e) => {
              e.preventDefault();
              if (from && to && from <= to) go(`range=custom&from=${from}&to=${to}`);
            }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap items-end gap-3 pb-4">
              <label className="block">
                <span className="label-caps">From</span>
                <input
                  type="date"
                  value={from}
                  max={to || today}
                  onChange={(e) => setFrom(e.target.value)}
                  className="field mt-1 block h-11 px-3 text-base"
                />
              </label>
              <label className="block">
                <span className="label-caps">To</span>
                <input
                  type="date"
                  value={to}
                  min={from}
                  max={today}
                  onChange={(e) => setTo(e.target.value)}
                  className="field mt-1 block h-11 px-3 text-base"
                />
              </label>
              <button type="submit" disabled={!from || !to || from > to} className="btn-primary h-11">
                Show
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div
        aria-busy={pending}
        className={`transition-opacity duration-300 ${pending ? "pointer-events-none opacity-45" : ""}`}
      >
        {children}
      </div>
    </>
  );
}
