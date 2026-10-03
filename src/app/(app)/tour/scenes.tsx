"use client";

// Small looping mock-ups of the real screens, drawn with the app's own
// tokens. Decorative: the slide text carries the meaning (aria-hidden).

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { CATALOGUE } from "@/lib/catalogue";
import { square } from "@/lib/cloudinary-url";
import { gentle, glide, quick } from "@/lib/motion";

/** Steps through 0…count-1 every `ms`, looping. */
function usePhase(count: number, ms: number) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setPhase((p) => (p + 1) % count), ms);
    return () => clearInterval(id);
  }, [count, ms]);
  return phase;
}

const photo = (name: string) => CATALOGUE.find((f) => f.name === name)?.photoUrl ?? null;

function Thumb({ name, size = 28 }: { name: string; size?: number }) {
  const url = photo(name);
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={square(url, size * 3)} alt="" style={{ width: size, height: size }} className="shrink-0 rounded object-cover" />
  ) : (
    <span style={{ width: size, height: size }} className="shrink-0 rounded bg-sage-wash" />
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div aria-hidden className="paper relative mx-auto h-full w-full max-w-sm overflow-hidden rounded-xl border border-hairline p-4 shadow-[0_1px_0_var(--color-hairline)]">
      {children}
    </div>
  );
}

/** Waste: pick a flower, stems, reason, save. */
export function LogScene() {
  // 0 idle · 1 flower · 2 stems · 3 reason · 4 saved · 5 rest
  const phase = usePhase(6, 1000);
  const flowers = ["Rose (red)", "Peony", "Tulip"];
  const stems = phase >= 2 ? 5 : 1;
  return (
    <Frame>
      <p className="label-caps">01 Flower</p>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {flowers.map((f, i) => {
          const on = phase >= 1 && phase <= 4 && i === 0;
          return (
            <motion.div
              key={f}
              animate={{ scale: on && phase === 1 ? [1, 0.94, 1] : 1 }}
              transition={gentle}
              className={`flex items-center gap-1.5 rounded-md border px-1.5 py-1 text-[11px] font-medium transition-colors ${
                on ? "border-moss bg-sage-wash" : "border-hairline bg-linen/60"
              }`}
            >
              <Thumb name={f} size={20} />
              <span className="truncate">{f.replace(" (red)", "")}</span>
            </motion.div>
          );
        })}
      </div>

      <p className="label-caps mt-3">02 Stems</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="flex size-7 items-center justify-center rounded-full border border-soil/30 text-sm">−</span>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={stems}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={quick}
            className="font-serif text-3xl leading-none"
          >
            {stems}
          </motion.span>
        </AnimatePresence>
        <motion.span
          animate={{ scale: phase === 2 ? [1, 0.88, 1] : 1 }}
          transition={gentle}
          className="flex size-7 items-center justify-center rounded-full border border-soil/30 text-sm"
        >
          +
        </motion.span>
      </div>

      <p className="label-caps mt-3">03 Reason</p>
      <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px] font-medium">
        {[
          ["Wilted", "border-rose/60 bg-rose-wash/60 text-rose-deep", "border-rose-deep bg-rose-deep text-linen"],
          ["Damaged", "border-clay/40 bg-clay-wash/60 text-clay", ""],
          ["Unsold", "border-sage bg-sage-wash/70 text-moss", ""],
          ["Other", "border-hairline bg-linen-deep/60 text-soil-soft", ""],
        ].map(([label, idle, on], i) => (
          <span
            key={label}
            className={`rounded-md border py-1.5 text-center transition-colors duration-300 ${
              i === 0 && phase >= 3 && phase <= 4 ? on : idle
            }`}
          >
            {label}
          </span>
        ))}
      </div>

      <motion.div
        animate={{ backgroundColor: phase === 4 ? "var(--color-moss-deep)" : "var(--color-moss)" }}
        className="mt-3 overflow-hidden rounded-full py-2 text-center text-xs font-medium text-linen"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={phase === 4 ? "saved" : "save"}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={quick}
            className="block"
          >
            {phase === 4 ? "✓ Saved · Undo" : phase >= 3 ? "Log 5 stems" : "Log waste"}
          </motion.span>
        </AnimatePresence>
      </motion.div>
    </Frame>
  );
}

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const HEIGHTS = [40, 65, 30, 80, 55, 90, 45];

/** Weeks: days fill in, Sunday night it closes, a new week opens. */
export function WeekScene() {
  const phase = usePhase(10, 650); // 0–6 days, 7–9 closed
  const closed = phase >= 7;
  return (
    <Frame>
      <div className="flex items-center justify-between">
        <span className="font-serif text-xl">Week 40</span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={closed ? "closed" : "open"}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={quick}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] ${
              closed ? "bg-linen-deep text-soil-soft" : "bg-sage-wash text-moss"
            }`}
          >
            <span className={`size-1.5 rounded-full ${closed ? "bg-soil-soft" : "bg-moss"}`} />
            {closed ? "Closed" : "Open"}
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="mt-4 grid h-28 grid-cols-7 items-end gap-2 border-b border-soil/40 pb-1">
        {DAYS.map((d, i) => (
          <motion.span
            key={i}
            initial={false}
            animate={{ height: phase >= i ? `${HEIGHTS[i]}%` : "4%", opacity: phase >= i ? 1 : 0.35 }}
            transition={gentle}
            className={`rounded-t-sm ${closed ? "bg-soil-soft/50" : i === Math.min(phase, 6) ? "bg-rose-deep" : "bg-sage"}`}
          />
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-2 text-center font-mono text-[10px] text-soil-soft">
        {DAYS.map((d, i) => (
          <span key={i} className={!closed && i === Math.min(phase, 6) ? "text-soil" : ""}>{d}</span>
        ))}
      </div>
      <AnimatePresence>
        {closed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={gentle}
            className="mt-4 flex items-center justify-between rounded-md border border-hairline bg-linen/70 px-3 py-2 text-[11px]"
          >
            <span>Week 40 report.pdf</span>
            <span className="text-moss">Ready ↓</span>
          </motion.div>
        )}
      </AnimatePresence>
    </Frame>
  );
}

/** Photos: a chip opens into a big picture. */
export function PhotoScene() {
  const phase = usePhase(4, 1100); // 0 idle · 1 tap · 2–3 open
  const open = phase >= 2;
  const names = ["Peony", "Sunflower", "Hydrangea", "Tulip", "Dahlia", "Anemone"];
  const big = photo("Peony");
  return (
    <Frame>
      {/* Load the big version up front, so it's ready when the chip opens. */}
      {big && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={square(big, 480)} alt="" className="pointer-events-none absolute size-px opacity-0" />
      )}
      <div className="grid grid-cols-2 gap-1.5">
        {names.map((n, i) => (
          <motion.div
            key={n}
            animate={{ scale: phase === 1 && i === 0 ? 0.94 : 1 }}
            transition={gentle}
            className={`flex items-center gap-2 rounded-md border px-1.5 py-1.5 text-[11px] font-medium ${
              phase >= 1 && i === 0 ? "border-moss bg-sage-wash" : "border-hairline bg-linen/60"
            }`}
          >
            {i !== 0 ? (
              <Thumb name={n} size={24} />
            ) : !open ? (
              <motion.span layoutId="tour-photo" transition={glide} className="block">
                <Thumb name={n} size={24} />
              </motion.span>
            ) : (
              <span className="size-6" />
            )}
            {n}
          </motion.div>
        ))}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={quick}
            className="absolute inset-0 flex items-center justify-center bg-soil/50 p-6"
          >
            <motion.div layoutId="tour-photo" transition={glide} className="overflow-hidden rounded-lg shadow-lg">
              {big && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={square(big, 480)} alt="" className="size-40 object-cover" />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Frame>
  );
}

const TOP = [
  ["Hydrangea", 46],
  ["Peony", 38],
  ["Tulip", 29],
  ["Ranunculus", 21],
  ["Rose (white)", 14],
] as const;

/** Dashboard: most-binned flowers grow in. */
export function DashboardScene() {
  const phase = usePhase(5, 900); // 0 empty · 1–4 shown
  const shown = phase >= 1;
  return (
    <Frame>
      <p className="label-caps">Most binned · this week</p>
      <ul className="mt-3 space-y-2.5">
        {TOP.map(([name, n], i) => (
          <li key={name} className="grid grid-cols-[1.5rem_5.5rem_1fr_2rem] items-center gap-2 text-[11px]">
            <span className="font-mono text-soil-soft">0{i + 1}</span>
            <span className="flex items-center gap-1.5 truncate">
              <Thumb name={name} size={18} />
              <span className="truncate">{name}</span>
            </span>
            <span className="h-2 rounded-full bg-linen-deep">
              <motion.span
                className="block h-2 rounded-full bg-chart-rate"
                initial={false}
                animate={{ width: shown ? `${(n / 46) * 100}%` : "0%" }}
                transition={{ ...gentle, delay: shown ? i * 0.08 : 0 }}
              />
            </span>
            <span className="text-right font-mono">{shown ? n : ""}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[11px] text-soil-soft">148 stems · ↓ 12% on last week</p>
    </Frame>
  );
}

/** Team: florists join one by one. */
export function TeamScene() {
  const phase = usePhase(5, 800);
  const people = [
    ["You", "Manager", "bg-moss text-linen"],
    ["Anna", "Staff", "bg-rose-wash text-rose-deep"],
    ["Liam", "Staff", "bg-clay-wash text-clay"],
  ] as const;
  return (
    <Frame>
      <p className="label-caps">Settings · Team</p>
      <ul className="mt-3 divide-y divide-hairline border-y border-hairline">
        {people.map(([name, role, tint], i) => (
          <AnimatePresence key={name} initial={false}>
            {(i === 0 || phase >= i + 1) && (
              <motion.li
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={gentle}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-3 py-2 text-xs">
                  <span className={`flex size-7 items-center justify-center rounded-full font-serif text-sm ${tint}`}>
                    {name[0]}
                  </span>
                  <span className="flex-1">{name}</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-soil-soft">{role}</span>
                </div>
              </motion.li>
            )}
          </AnimatePresence>
        ))}
      </ul>
      <motion.span
        animate={{ scale: phase === 1 || phase === 2 ? [1, 0.94, 1] : 1 }}
        transition={gentle}
        className="mt-4 inline-block rounded-full border border-soil/30 px-3 py-1.5 text-[11px]"
      >
        + Invite a florist
      </motion.span>
    </Frame>
  );
}
