"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, useTransition } from "react";
import { formatMoney } from "@/lib/format";
import { tick } from "@/lib/haptics";
import { quick } from "@/lib/motion";
import { setFlowerPrice } from "../actions";

const swap = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: quick,
};

/** "0.85", "0,85", "€0.85" → 85; "" → null (no price); undefined when invalid. */
function parse(text: string): number | null | undefined {
  const clean = text.replace(/[^\d.,]/g, "").replace(",", ".");
  if (!clean) return null;
  if (!/^\d*\.?\d{0,2}$/.test(clean)) return undefined;
  return Math.round(Number(clean) * 100);
}

type Props = { flowerId: string; cents: number | null; currency: string; deliveries: boolean };

/** The flower's usual price per stem, shown as a figure; "Edit" swaps in a field. */
export function PriceForm({ flowerId, cents, currency, deliveries }: Props) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(cents === null ? "" : (cents / 100).toFixed(2));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save(e: React.FormEvent) {
    e.preventDefault();
    const value = parse(text);
    if (value === undefined) return setError("Enter a price like 0.85");
    setError(null);
    startTransition(async () => {
      const result = await setFlowerPrice(flowerId, value);
      if (!result.ok) return setError(result.error);
      tick();
      setEditing(false);
    });
  }

  return (
    <div>
      <p className="label-caps mb-3">Usual price per stem</p>
      <AnimatePresence mode="wait" initial={false}>
        {!editing ? (
          <motion.div key="view" {...swap} className="flex items-baseline justify-between gap-4">
            {cents === null ? (
              <span className="font-serif text-4xl italic text-clay">Not set</span>
            ) : (
              <span className="font-serif text-5xl leading-none">{formatMoney(cents, currency, 2)}</span>
            )}
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="min-h-11 text-sm text-soil-soft underline decoration-hairline decoration-2 underline-offset-8 hover:text-soil hover:decoration-moss"
            >
              {cents === null ? "Set price" : "Edit"}
            </button>
          </motion.div>
        ) : (
          <motion.form key="edit" {...swap} onSubmit={save} className="flex items-center gap-3">
            <span className="font-serif text-3xl text-soil-soft">€</span>
            <input
              autoFocus
              inputMode="decimal"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="0.00"
              aria-label="Usual price per stem"
              className="field h-12 w-32 text-lg"
            />
            <button type="submit" disabled={pending} className="btn-primary h-12">
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setError(null);
              }}
              className="min-h-12 text-sm text-soil-soft hover:text-soil"
            >
              Cancel
            </button>
          </motion.form>
        )}
      </AnimatePresence>
      {error && (
        <p role="alert" className="mt-2 text-sm text-rose-deep">
          {error}
        </p>
      )}
      <p className="mt-3 max-w-sm text-sm text-soil-soft">
        {deliveries
          ? "Used for waste until this flower has a delivery. Each delivery updates it."
          : "Used to price this flower's waste on the dashboard."}
      </p>
    </div>
  );
}
