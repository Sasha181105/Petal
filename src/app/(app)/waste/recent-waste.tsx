"use client";

import { useEffect, useState, useTransition } from "react";
import type { WasteReason } from "@/db/schema";
import { formatDay, localToday } from "@/lib/dates";
import { deleteWaste } from "./actions";
import { reasonOf } from "./reasons";

export type RecentWasteRow = {
  id: string;
  flowerName: string;
  quantity: number;
  reason: WasteReason;
  wastedOn: string;
};

export function RecentWaste({ rows }: { rows: RecentWasteRow[] }) {
  // Computed after mount so the server (UTC) and phone agree on "today".
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(localToday()), []);

  if (rows.length === 0) {
    return <p className="border-t border-hairline py-6 text-soil-soft">Nothing logged yet.</p>;
  }

  return (
    <ul className="border-t border-soil">
      {rows.map((row) => {
        const reason = reasonOf(row.reason);
        return (
          <li
            key={row.id}
            className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-3 border-b border-hairline py-3"
          >
            <span className="text-right font-serif text-4xl leading-none">{row.quantity}</span>
            <div className="min-w-0">
              <div className="truncate font-medium">{row.flowerName}</div>
              <div className="mt-1 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-soil-soft">
                <span aria-hidden className={`size-2 rounded-full ${reason.dot}`} />
                {reason.label} · {today ? formatDay(row.wastedOn, today) : row.wastedOn}
              </div>
            </div>
            <DeleteButton id={row.id} label={`${row.quantity} × ${row.flowerName}`} />
          </li>
        );
      })}
    </ul>
  );
}

function DeleteButton({ id, label }: { id: string; label: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      aria-label={`Delete ${label}`}
      onClick={() => {
        if (confirm(`Delete ${label}?`)) startTransition(() => deleteWaste(id));
      }}
      className="min-h-11 px-2 font-mono text-[11px] uppercase tracking-[0.14em] text-soil-soft transition-colors hover:text-rose-deep disabled:opacity-40"
    >
      {pending ? "…" : "Delete"}
    </button>
  );
}
