"use client";

import { AnimatePresence, motion, type PanInfo } from "motion/react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { EASE, gentle } from "@/lib/motion";
import { finishTour } from "./actions";
import { DashboardScene, LogScene, PhotoScene, TeamScene, WeekScene } from "./scenes";

/** Anything can reopen the tour (Settings → "Take the tour again"). */
export const TOUR_EVENT = "petal:tour";

type Slide = { key: string; label: string; title: React.ReactNode; text: string; Scene: () => React.ReactNode };

function slidesFor(isManager: boolean): Slide[] {
  const common: Slide[] = [
    {
      key: "log",
      label: "Waste log",
      title: (
        <>
          Three taps, <em className="text-rose-deep">done.</em>
        </>
      ),
      text: "Pick the flower, set the stems, choose why it's going. Logged something wrong? Undo is right there for a few seconds.",
      Scene: LogScene,
    },
    {
      key: "week",
      label: "Weeks",
      title: (
        <>
          Weeks close <em className="text-rose-deep">themselves.</em>
        </>
      ),
      text: isManager
        ? "Monday to Sunday. At midnight on Sunday the week closes and its PDF report is ready. You can reopen a past week to fix it."
        : "Monday to Sunday. You log into the open week; at midnight on Sunday it closes. Missed something? Your manager can reopen it.",
      Scene: WeekScene,
    },
    {
      key: "photos",
      label: "Photos",
      title: (
        <>
          Know it at a <em className="text-rose-deep">glance.</em>
        </>
      ),
      text: "Every flower can have a photo, so nobody mixes up the lisianthus and the roses. Tap a photo to see it big. Add or change them in Flowers.",
      Scene: PhotoScene,
    },
  ];
  if (!isManager) return common;
  return [
    ...common,
    {
      key: "dashboard",
      label: "Dashboard",
      title: (
        <>
          See what&apos;s <em className="text-rose-deep">binned.</em>
        </>
      ),
      text: "The dashboard shows which flowers you lose most and how it changes week to week. Turn on Deliveries in Settings to see it in money too.",
      Scene: DashboardScene,
    },
    {
      key: "team",
      label: "Team",
      title: (
        <>
          Bring your <em className="text-rose-deep">florists.</em>
        </>
      ),
      text: "Invite them in Settings → Team, by email or with a password you hand over. They log waste; reports and settings stay with you.",
      Scene: TeamScene,
    },
  ];
}

const SWIPE = 60;

export function Tour({ isManager, firstRun }: { isManager: boolean; firstRun: boolean }) {
  const [open, setOpen] = useState(firstRun);
  const [[index, dir], setPage] = useState<[number, number]>([0, 1]);
  const slides = slidesFor(isManager);
  const last = index === slides.length - 1;
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const saved = useRef(!firstRun);

  const go = useCallback(
    (to: number) => setPage(([i]) => [Math.max(0, Math.min(slides.length - 1, to)), to > i ? 1 : -1]),
    [slides.length],
  );

  const close = useCallback(() => {
    setOpen(false);
    if (!saved.current) {
      saved.current = true;
      void finishTour();
    }
  }, []);

  // Reopen from anywhere.
  useEffect(() => {
    const reopen = () => {
      setPage([0, 1]);
      setOpen(true);
    };
    window.addEventListener(TOUR_EVENT, reopen);
    return () => window.removeEventListener(TOUR_EVENT, reopen);
  }, []);

  // Keyboard, focus and no page scroll behind the dialog.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Focus the dialog itself (not a button), so screen readers start at the
    // top and no focus ring flashes on open.
    dialogRef.current?.focus({ preventScroll: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, index, go, close]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE || info.velocity.x < -400) go(index + 1);
    else if (info.offset.x > SWIPE || info.velocity.x > 400) go(index - 1);
  };

  const slide = slides[index];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="tour"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={gentle}
          className="fixed inset-0 z-50 flex items-end justify-center bg-soil/45 backdrop-blur-[2px] md:items-center md:p-8 print:hidden"
          onClick={(e) => e.target === e.currentTarget && close()}
        >
          <motion.div
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="paper flex max-h-dvh w-full flex-col overflow-hidden outline-none rounded-t-2xl border-t border-soil pb-[env(safe-area-inset-bottom)] md:max-w-xl md:rounded-2xl md:border"
          >
            {/* Progress + skip */}
            <div className="flex items-center gap-4 px-5 pt-5 md:px-8 md:pt-7">
              <div className="flex flex-1 gap-1.5">
                {slides.map((s, i) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => go(i)}
                    aria-label={`${i + 1}. ${s.label}`}
                    aria-current={i === index ? "step" : undefined}
                    className="h-6 flex-1 py-2.5"
                  >
                    <span className="block h-1 overflow-hidden rounded-full bg-hairline">
                      <motion.span
                        className="block h-full rounded-full bg-moss"
                        initial={false}
                        animate={{ width: i <= index ? "100%" : "0%" }}
                        transition={gentle}
                      />
                    </span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={close}
                className="min-h-11 font-mono text-[11px] uppercase tracking-[0.14em] text-soil-soft hover:text-soil"
              >
                Skip
              </button>
            </div>

            <div className="relative min-h-0 flex-1 overflow-y-auto">
              <AnimatePresence mode="popLayout" initial={false} custom={dir}>
                <motion.div
                  key={slide.key}
                  custom={dir}
                  variants={{
                    enter: (d: number) => ({ x: d * 48, opacity: 0 }),
                    center: { x: 0, opacity: 1 },
                    exit: (d: number) => ({ x: d * -48, opacity: 0 }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.38, ease: EASE }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.25}
                  onDragEnd={onDragEnd}
                  className="touch-pan-y px-5 pt-5 md:px-8"
                >
                  <div className="h-[18.5rem] select-none">
                    <slide.Scene />
                  </div>
                  <p className="label-caps mt-6">
                    {String(index + 1).padStart(2, "0")} · {slide.label}
                  </p>
                  <h2 id={titleId} className="mt-2 font-serif text-4xl leading-[1.02] tracking-[-0.01em] md:text-5xl">
                    {slide.title}
                  </h2>
                  <p className="mt-3 max-w-md text-soil-soft">{slide.text}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-between gap-3 px-5 py-5 md:px-8 md:py-7">
              <button
                type="button"
                onClick={() => go(index - 1)}
                disabled={index === 0}
                className="btn-ghost h-12 disabled:invisible"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => (last ? close() : go(index + 1))}
                className="btn-primary h-12 min-w-36"
              >
                {last ? (isManager ? "Set up my shop" : "Start logging") : "Next →"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Button that opens the tour again. */
export function ReplayTourButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(TOUR_EVENT))}
      className="btn-secondary h-12"
    >
      Take the tour again
    </button>
  );
}
