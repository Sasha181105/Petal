// Shared motion language: calm, short, no bounce.
import type { Transition } from "motion/react";

/** Soft ease-out used everywhere. */
export const EASE = [0.2, 0.7, 0.2, 1] as const;

export const quick: Transition = { duration: 0.2, ease: EASE };
export const gentle: Transition = { duration: 0.35, ease: EASE };
/** For shared-element moves (flower chip → selected flower, nav indicators). */
export const glide: Transition = { type: "spring", stiffness: 420, damping: 38, mass: 0.9 };

/** Brief sage wash on rows that just appeared. */
export const freshRow = {
  initial: { opacity: 0, y: -8, backgroundColor: "rgba(229, 232, 218, 1)" },
  animate: {
    opacity: 1,
    y: 0,
    backgroundColor: "rgba(229, 232, 218, 0)",
    transition: { ...gentle, backgroundColor: { duration: 1.6, ease: "easeOut" } },
  },
  exit: { opacity: 0, height: 0, transition: quick },
} as const;
