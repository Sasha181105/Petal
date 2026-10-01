"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import { quick } from "@/lib/motion";

const MAX = 10_000;

type Props = {
  value: number;
  onChange: (value: number) => void;
  label?: string;
};

const round =
  "grid size-14 shrink-0 place-items-center rounded-full border border-soil/30 text-2xl transition-[border-color,background-color,transform] duration-150 hover:border-soil active:scale-90 active:bg-linen-deep";

/** The number rolls up when it grows and down when it shrinks, like a counter. */
function RollingNumber({ value }: { value: number }) {
  const previous = useRef(value);
  const direction = value >= previous.current ? 1 : -1;
  useEffect(() => {
    previous.current = value;
  }, [value]);

  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center overflow-hidden">
      <AnimatePresence initial={false} mode="popLayout" custom={direction}>
        <motion.span
          key={value}
          custom={direction}
          variants={{
            enter: (d: number) => ({ y: `${d * 70}%`, opacity: 0 }),
            center: { y: "0%", opacity: 1 },
            exit: (d: number) => ({ y: `${d * -70}%`, opacity: 0 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={quick}
          className={`font-serif text-6xl leading-none ${value === 0 ? "text-soil-soft/40" : ""}`}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function QuantityStepper({ value, onChange, label = "Stems" }: Props) {
  const set = (n: number) => onChange(Math.max(0, Math.min(MAX, n)));

  return (
    <div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => set(value - 1)} aria-label="One less" className={round}>
          −
        </button>
        <div className="relative h-16 w-full min-w-0 border-b border-hairline transition-colors focus-within:border-moss">
          <RollingNumber value={value} />
          {/* The real input sits on top with transparent text, so typing still works. */}
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            aria-label={label}
            value={value === 0 ? "" : value}
            onChange={(e) => set(Number(e.target.value.replace(/\D/g, "")) || 0)}
            onFocus={(e) => e.target.select()}
            className="relative size-full bg-transparent text-center font-serif text-6xl leading-none text-transparent caret-soil outline-none selection:bg-sage-wash"
          />
        </div>
        <button type="button" onClick={() => set(value + 1)} aria-label="One more" className={round}>
          +
        </button>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[5, 10, 25].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => set(value + n)}
            className="chip h-12 rounded-full font-mono text-sm"
          >
            +{n}
          </button>
        ))}
      </div>
    </div>
  );
}
