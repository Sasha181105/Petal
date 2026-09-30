"use client";

import { useEffect, useState, useTransition } from "react";
import { FlowerPicker } from "@/components/flower-picker";
import { QuantityStepper } from "@/components/quantity-stepper";
import type { WasteReason } from "@/db/schema";
import { localToday } from "@/lib/dates";
import type { FlowerOption } from "@/lib/queries";
import { deleteWaste, logWaste } from "./actions";
import { REASONS, reasonLabel } from "./reasons";

type Saved = { id: string; summary: string };

/** One ledger row of the form: number and label on the left, input on the right. */
function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 border-t border-hairline py-6 md:grid-cols-[7rem_1fr] md:gap-6 md:py-8">
      <h2 className="flex items-baseline gap-3 md:flex-col md:gap-1">
        <span className="font-mono text-sm text-soil-soft">0{n}</span>
        <span className="label-caps text-soil">{title}</span>
      </h2>
      <div>{children}</div>
    </section>
  );
}

export function WasteForm({ flowers }: { flowers: FlowerOption[] }) {
  const [flower, setFlower] = useState<FlowerOption | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState<WasteReason | null>(null);
  // null means "today", resolved on the phone at save time.
  const [date, setDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [pending, startTransition] = useTransition();

  // Hide the "Saved" note after a few seconds.
  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(null), 6000);
    return () => clearTimeout(t);
  }, [saved]);

  const ready = flower && quantity > 0 && reason;
  const summary = ready ? `${quantity} × ${flower.name} — ${reasonLabel(reason).toLowerCase()}` : "";

  function save() {
    if (!ready) return;
    setError(null);
    startTransition(async () => {
      const result = await logWaste({
        flowerTypeId: flower.id,
        quantity,
        reason,
        wastedOn: date ?? localToday(),
      });
      if (!result.ok) return setError(result.error);
      setSaved({ id: result.id, summary });
      // Keep the flower: several reasons for one flower is common.
      setQuantity(1);
      setReason(null);
    });
  }

  function undo() {
    if (!saved) return;
    const { id } = saved;
    setSaved(null);
    startTransition(() => deleteWaste(id));
  }

  return (
    <div>
      <Step n={1} title="Flower">
        <FlowerPicker flowers={flowers} value={flower} onChange={setFlower} />
      </Step>

      <Step n={2} title="Stems">
        <QuantityStepper value={quantity} onChange={setQuantity} />
      </Step>

      <Step n={3} title="Reason">
        <div className="grid grid-cols-2 gap-2">
          {REASONS.map((r) => {
            const active = reason === r.value;
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => setReason(r.value)}
                aria-pressed={active}
                className={`min-h-16 rounded-lg border text-lg font-medium transition-colors duration-150 ${
                  active ? r.selected : r.idle
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </Step>

      <div className="flex min-h-14 items-center justify-between border-t border-hairline py-2">
        <span className="label-caps">Date</span>
        {date === null ? (
          <button
            type="button"
            onClick={() => setDate(localToday())}
            className="min-h-12 text-sm font-medium underline decoration-hairline decoration-2 underline-offset-8 hover:decoration-moss"
          >
            Today · change
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={date}
              max={localToday()}
              onChange={(e) => setDate(e.target.value || null)}
              aria-label="Date"
              className="field h-11 px-3 text-base"
            />
            <button
              type="button"
              onClick={() => setDate(null)}
              className="min-h-11 text-sm text-soil-soft underline-offset-4 hover:text-soil hover:underline"
            >
              Today
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3 border-t border-soil pt-6">
        {error && (
          <p role="alert" className="border-l-2 border-rose-deep bg-rose-wash px-4 py-3">
            {error}
          </p>
        )}

        {saved && (
          <div
            role="status"
            className="flex items-center justify-between gap-4 border-l-2 border-moss bg-sage-wash pl-4 pr-2 text-moss"
          >
            <span className="py-3">Saved {saved.summary}</span>
            <button
              type="button"
              onClick={undo}
              className="min-h-12 px-2 font-medium underline decoration-2 underline-offset-8"
            >
              Undo
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={save}
          disabled={!ready || pending}
          className="btn-primary min-h-16 w-full text-lg"
        >
          {pending ? "Saving…" : ready ? `Save ${summary}` : "Choose a flower, stems and reason"}
        </button>
      </div>
    </div>
  );
}
