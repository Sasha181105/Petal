"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { ZoomablePhoto } from "@/components/zoomable-photo";
import { formatDay, localToday } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { tick } from "@/lib/haptics";
import { freshRow, quick } from "@/lib/motion";
import { deleteDelivery } from "./actions";

export type RecentDeliveryRow = {
  id: string;
  flowerName: string;
  photoUrl: string | null;
  quantity: number;
  unitCostCents: number;
  supplierName: string | null;
  receivedOn: string;
};

export function RecentDeliveries({ rows, currency }: { rows: RecentDeliveryRow[]; currency: string }) {
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(localToday()), []);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const visible = rows.filter((r) => !hidden.has(r.id));

  async function remove(id: string) {
    tick();
    setHidden((h) => new Set(h).add(id));
    try {
      await deleteDelivery(id);
    } catch {
      setHidden((h) => {
        const next = new Set(h);
        next.delete(id);
        return next;
      });
    }
  }

  return (
    <div className="border-t border-soil">
      <ul>
        <AnimatePresence initial={false}>
          {visible.map((row) => (
            <motion.li key={row.id} layout {...freshRow} className="overflow-hidden border-b border-hairline">
              <Row row={row} today={today} currency={currency} onDelete={() => remove(row.id)} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      {visible.length === 0 && <p className="py-6 text-soil-soft">No deliveries logged yet.</p>}
    </div>
  );
}

function Row({
  row,
  today,
  currency,
  onDelete,
}: {
  row: RecentDeliveryRow;
  today: string | null;
  currency: string;
  onDelete: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 4000);
    return () => clearTimeout(t);
  }, [confirming]);

  return (
    <div className="grid min-h-16 grid-cols-[3.5rem_1fr_auto] items-center gap-3 py-3">
      <span className="text-right font-serif text-4xl leading-none">{row.quantity}</span>
      <div className="flex min-w-0 items-center gap-3">
        <ZoomablePhoto url={row.photoUrl} name={row.flowerName} variant="chip" />
        <div className="min-w-0">
          <div className="truncate font-medium">
            {row.flowerName}{" "}
            <span className="text-soil-soft">· {formatMoney(row.quantity * row.unitCostCents, currency, 2)}</span>
          </div>
          <div className="mt-1 truncate font-mono text-[11px] uppercase tracking-[0.14em] text-soil-soft">
            {formatMoney(row.unitCostCents, currency, 2)}/stem
            {row.supplierName && ` · ${row.supplierName}`} ·{" "}
            {today ? formatDay(row.receivedOn, today) : row.receivedOn}
          </div>
        </div>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        {confirming ? (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={quick}
            className="flex items-center gap-1"
          >
            <button
              type="button"
              onClick={onDelete}
              className="min-h-11 rounded-full bg-rose-deep px-4 text-sm font-medium text-linen transition-transform active:scale-95"
            >
              Delete
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="min-h-11 px-3 text-sm text-soil-soft hover:text-soil">
              Keep
            </button>
          </motion.div>
        ) : (
          <motion.button
            key="ask"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={quick}
            type="button"
            aria-label={`Delete delivery of ${row.quantity} × ${row.flowerName}`}
            onClick={() => setConfirming(true)}
            className="min-h-11 px-2 font-mono text-[11px] uppercase tracking-[0.14em] text-soil-soft transition-colors hover:text-rose-deep"
          >
            Delete
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
