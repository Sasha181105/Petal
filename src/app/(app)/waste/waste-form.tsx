"use client";

import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useEffect, useState, useTransition } from "react";
import { FlowerPicker } from "@/components/flower-picker";
import { QuantityStepper } from "@/components/quantity-stepper";
import type { WasteReason } from "@/db/schema";
import { localToday } from "@/lib/dates";
import { tick } from "@/lib/haptics";
import { gentle, quick } from "@/lib/motion";
import type { FlowerOption } from "@/lib/queries";
import { deleteWaste, logWaste } from "./actions";
import { REASONS, reasonLabel } from "./reasons";

const UNDO_SECONDS = 6;

type Saved = { id: string; summary: string };

/** One ledger row of the form: number and label on the left, input on the right. */
function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <motion.section
      layout="position"
      transition={gentle}
      className="grid gap-4 border-t border-hairline py-6 md:grid-cols-[7rem_1fr] md:gap-6 md:py-8"
    >
      <h2 className="flex items-baseline gap-3 md:flex-col md:gap-1">
        <span className="font-mono text-sm text-soil-soft">0{n}</span>
        <span className="label-caps text-soil">{title}</span>
      </h2>
      <div>{children}</div>
    </motion.section>
  );
}

function Check() {
  return (
    <motion.svg
      viewBox="0 0 16 16"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={quick}
      aria-hidden
    >
      <motion.path
        d="M3 8.5 L6.5 12 L13 4.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.25, delay: 0.05 }}
      />
    </motion.svg>
  );
}

export function WasteForm({ flowers }: { flowers: FlowerOption[] }) {
  const [flower, setFlower] = useState<FlowerOption | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState<WasteReason | null>(null);
  // null means "today", resolved on the phone at save time.
  const [date, setDate] = useState<string | null>(null);
  const [error, setError] = useState<{ text: string; at: number } | null>(null);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  // The undo window closes after a few seconds.
  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(null), UNDO_SECONDS * 1000);
    return () => clearTimeout(t);
  }, [saved]);

  // "✓ Saved" shows on the button for a moment.
  useEffect(() => {
    if (!justSaved) return;
    const t = setTimeout(() => setJustSaved(false), 1400);
    return () => clearTimeout(t);
  }, [justSaved]);

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
      if (!result.ok) return setError({ text: result.error, at: Date.now() });
      tick(12);
      setSaved({ id: result.id, summary });
      setJustSaved(true);
      // Keep the flower: several reasons for one flower is common.
      setQuantity(1);
      setReason(null);
    });
  }

  function undo() {
    if (!saved) return;
    const { id } = saved;
    setSaved(null);
    tick();
    startTransition(() => deleteWaste(id));
  }

  const buttonState = pending ? "saving" : justSaved ? "saved" : ready ? "ready" : "idle";
  const buttonLabel = {
    saving: "Saving…",
    saved: "✓ Saved",
    ready: `Save ${summary}`,
    idle: "Choose a flower, stems and reason",
  }[buttonState];

  return (
    <LayoutGroup id="waste-form">
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
                onClick={() => {
                  tick(5);
                  setReason(r.value);
                }}
                aria-pressed={active}
                className={`flex min-h-16 items-center justify-center gap-2 rounded-lg border text-lg font-medium transition-[color,background-color,border-color,transform] duration-200 active:scale-[0.97] ${
                  active ? r.selected : r.idle
                }`}
              >
                <AnimatePresence initial={false}>{active && <Check key="check" />}</AnimatePresence>
                {r.label}
              </button>
            );
          })}
        </div>
      </Step>

      <motion.div
        layout="position"
        transition={gentle}
        className="flex min-h-14 items-center justify-between border-t border-hairline py-2"
      >
        <span className="label-caps">Date</span>
        <AnimatePresence mode="wait" initial={false}>
          {date === null ? (
            <motion.button
              key="today"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={quick}
              type="button"
              onClick={() => setDate(localToday())}
              className="min-h-12 text-sm font-medium underline decoration-hairline decoration-2 underline-offset-8 hover:decoration-moss"
            >
              Today · change
            </motion.button>
          ) : (
            <motion.div
              key="picker"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={quick}
              className="flex items-center gap-3"
            >
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
            </motion.div>
          )}
        </AnimatePresence>
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
              <span className="mb-3 block border-l-2 border-rose-deep bg-rose-wash px-4 py-3">
                {error.text}
              </span>
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
                <button
                  type="button"
                  onClick={undo}
                  className="min-h-12 px-2 font-medium underline decoration-2 underline-offset-8 transition-transform active:scale-95"
                >
                  Undo
                </button>
                {/* Time left to undo. */}
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
          className={`btn-primary relative min-h-16 w-full overflow-hidden text-lg ${
            buttonState === "saved" ? "bg-moss-deep" : ""
          }`}
          // "✓ Saved" is disabled but should stay bright, not faded.
          style={buttonState === "saved" ? { opacity: 1 } : undefined}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              // Animate only when the state changes, not on every +1.
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
          {/* A soft sheen sweeps across while saving. */}
          {pending && (
            <motion.span
              aria-hidden
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-linen/25 to-transparent"
              initial={{ x: "-100%" }}
              animate={{ x: "350%" }}
              transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </button>
      </motion.div>
    </LayoutGroup>
  );
}
