"use client";

import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useEffect, useState, useTransition } from "react";
import { FlowerPicker } from "@/components/flower-picker";
import { FormStep as Step } from "@/components/form-step";
import { QuantityStepper } from "@/components/quantity-stepper";
import { localToday } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { tick } from "@/lib/haptics";
import { gentle, quick } from "@/lib/motion";
import type { FlowerOption } from "@/lib/queries";
import { addSupplier, deleteDelivery, logDelivery } from "./actions";

const UNDO_SECONDS = 6;

export type Supplier = { id: string; name: string };
/** What was paid last time, per flower, to pre-fill the form. */
export type LastPrice = { unitCostCents: number; supplierId: string | null };

type Props = {
  flowers: FlowerOption[];
  suppliers: Supplier[];
  lastPrices: Record<string, LastPrice>;
  currency: string;
};

/** "0.85", "0,85", "€0.85" → 85 cents; null when it isn't a price. */
function parseCents(text: string): number | null {
  const clean = text.replace(/[^\d.,]/g, "").replace(",", ".");
  if (!clean || !/^\d*\.?\d{0,2}$/.test(clean)) return null;
  const n = Math.round(Number(clean) * 100);
  return Number.isFinite(n) ? n : null;
}

const centsToText = (c: number) => (c / 100).toFixed(2);

export function DeliveryForm({ flowers, suppliers: initialSuppliers, lastPrices, currency }: Props) {
  const [flower, setFlower] = useState<FlowerOption | null>(null);
  const [quantity, setQuantity] = useState(10);
  const [price, setPrice] = useState("");
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [newSupplier, setNewSupplier] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [error, setError] = useState<{ text: string; at: number } | null>(null);
  const [saved, setSaved] = useState<{ id: string; summary: string } | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  // Choosing a flower pre-fills last time's price and supplier.
  function chooseFlower(f: FlowerOption | null) {
    setFlower(f);
    if (!f) return;
    const last = lastPrices[f.id];
    const cents = last?.unitCostCents ?? null;
    setPrice(cents === null ? "" : centsToText(cents));
    if (last?.supplierId) setSupplierId(last.supplierId);
  }

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(null), UNDO_SECONDS * 1000);
    return () => clearTimeout(t);
  }, [saved]);
  useEffect(() => {
    if (!justSaved) return;
    const t = setTimeout(() => setJustSaved(false), 1400);
    return () => clearTimeout(t);
  }, [justSaved]);

  const cents = parseCents(price);
  const ready = flower && quantity > 0 && cents !== null;
  const summary = ready ? `${quantity} × ${flower.name} at ${formatMoney(cents, currency, 2)}` : "";
  const last = flower ? lastPrices[flower.id] : undefined;

  function save() {
    if (!ready) return;
    setError(null);
    startTransition(async () => {
      const result = await logDelivery({
        flowerTypeId: flower.id,
        quantity,
        unitCostCents: cents,
        supplierId,
        receivedOn: date ?? localToday(),
      });
      if (!result.ok) return setError({ text: result.error, at: Date.now() });
      tick(12);
      setSaved({ id: result.id, summary });
      setJustSaved(true);
      // Next delivery is usually a different flower from the same supplier.
      setFlower(null);
      setQuantity(10);
      setPrice("");
    });
  }

  function undo() {
    if (!saved) return;
    const { id } = saved;
    setSaved(null);
    tick();
    startTransition(() => deleteDelivery(id));
  }

  function createSupplier() {
    if (!newSupplier?.trim()) return;
    startTransition(async () => {
      const result = await addSupplier(newSupplier);
      if (!result.ok) return setError({ text: result.error, at: Date.now() });
      setSuppliers((s) => (s.some((x) => x.id === result.supplier.id) ? s : [...s, result.supplier]));
      setSupplierId(result.supplier.id);
      setNewSupplier(null);
    });
  }

  const buttonState = pending ? "saving" : justSaved ? "saved" : ready ? "ready" : "idle";
  const buttonLabel = {
    saving: "Saving…",
    saved: "✓ Saved",
    ready: `Save ${summary}`,
    idle: "Choose a flower, stems and price",
  }[buttonState];

  return (
    <LayoutGroup id="delivery-form">
      <Step n={1} title="Flower">
        <FlowerPicker flowers={flowers} value={flower} onChange={chooseFlower} />
      </Step>

      <Step n={2} title="Stems">
        <QuantityStepper value={quantity} onChange={setQuantity} />
      </Step>

      <Step n={3} title="Price / stem">
        <div className="flex items-center gap-3 border-b border-hairline pb-1 focus-within:border-moss">
          <span className="font-serif text-4xl text-soil-soft">€</span>
          <input
            type="text"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            onFocus={(e) => e.target.select()}
            placeholder="0.00"
            aria-label="Price per stem"
            className="h-14 w-full min-w-0 bg-transparent font-serif text-5xl outline-none placeholder:text-soil-soft/40"
          />
        </div>
        <AnimatePresence initial={false}>
          {last && (
            <motion.p
              key={flower?.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={quick}
              className="label-caps mt-2 overflow-hidden"
            >
              Last time {formatMoney(last.unitCostCents, currency, 2)}
              {last.supplierId && ` · ${suppliers.find((s) => s.id === last.supplierId)?.name ?? ""}`}
            </motion.p>
          )}
        </AnimatePresence>
        {price && cents === null && (
          <p className="mt-2 text-sm text-rose-deep">Enter a price like 0.85</p>
        )}
      </Step>

      <Step n={4} title="Supplier">
        <div className="flex flex-wrap gap-2">
          {suppliers.map((s) => {
            const active = supplierId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={active}
                onClick={() => setSupplierId(active ? null : s.id)}
                className={`min-h-11 rounded-full border px-4 text-sm font-medium transition-[color,background-color,border-color,transform] duration-150 active:scale-95 ${
                  active ? "border-soil bg-soil text-linen" : "border-soil/25 text-soil hover:border-soil"
                }`}
              >
                {s.name}
              </button>
            );
          })}
          {newSupplier === null ? (
            <button
              type="button"
              onClick={() => setNewSupplier("")}
              className="min-h-11 rounded-full border border-dashed border-soil/30 px-4 text-sm text-soil-soft hover:border-moss hover:text-soil"
            >
              + New supplier
            </button>
          ) : (
            <span className="flex items-center gap-2">
              <input
                autoFocus
                value={newSupplier}
                onChange={(e) => setNewSupplier(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    createSupplier();
                  }
                  if (e.key === "Escape") setNewSupplier(null);
                }}
                placeholder="Supplier name"
                maxLength={60}
                className="field h-11 w-48 text-base"
              />
              <button type="button" onClick={createSupplier} className="btn-secondary h-11 px-4 text-sm">
                Add
              </button>
            </span>
          )}
        </div>
        <p className="label-caps mt-3">Optional</p>
      </Step>

      <motion.div
        layout="position"
        transition={gentle}
        className="flex min-h-14 items-center justify-between border-t border-hairline py-2"
      >
        <span className="label-caps">Received</span>
        {date === null ? (
          <button
            type="button"
            onClick={() => setDate(localToday())}
            className="min-h-12 text-sm font-medium underline decoration-hairline decoration-2 underline-offset-8 hover:decoration-moss"
          >
            Today · change
          </button>
        ) : (
          <span className="flex items-center gap-3">
            <input
              type="date"
              value={date}
              max={localToday()}
              onChange={(e) => setDate(e.target.value || null)}
              aria-label="Date received"
              className="field h-11 px-3 text-base"
            />
            <button type="button" onClick={() => setDate(null)} className="min-h-11 text-sm text-soil-soft hover:text-soil">
              Today
            </button>
          </span>
        )}
      </motion.div>

      <motion.div layout="position" transition={gentle} className="border-t border-soil pt-6">
        <AnimatePresence initial={false}>
          {error && (
            <motion.p
              key={error.at}
              role="alert"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto", x: [0, -6, 6, -4, 4, 0] }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ ...gentle, x: { duration: 0.4 } }}
              className="overflow-hidden"
            >
              <span className="mb-3 block border-l-2 border-rose-deep bg-rose-wash px-4 py-3">{error.text}</span>
            </motion.p>
          )}
          {saved && (
            <motion.div
              key={saved.id}
              role="status"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={gentle}
              className="overflow-hidden"
            >
              <div className="relative mb-3 flex items-center justify-between gap-4 border-l-2 border-moss bg-sage-wash pl-4 pr-2 text-moss">
                <span className="py-3">Saved {saved.summary}</span>
                <button type="button" onClick={undo} className="min-h-12 px-2 font-medium underline decoration-2 underline-offset-8">
                  Undo
                </button>
                <motion.span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-moss/50"
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: UNDO_SECONDS, ease: "linear" }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={save}
          disabled={!ready || pending}
          aria-live="polite"
          className={`btn-primary relative min-h-16 w-full overflow-hidden text-lg ${buttonState === "saved" ? "bg-moss-deep" : ""}`}
          style={buttonState === "saved" ? { opacity: 1 } : undefined}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={buttonState}
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -18, opacity: 0 }}
              transition={quick}
              className="block"
            >
              {buttonLabel}
            </motion.span>
          </AnimatePresence>
        </button>
      </motion.div>
    </LayoutGroup>
  );
}
