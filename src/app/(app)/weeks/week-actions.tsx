"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, useTransition } from "react";
import { tick } from "@/lib/haptics";
import { quick } from "@/lib/motion";
import type { WeekStatus } from "@/lib/weeks";
import { closeWeek, reopenWeek } from "./actions";

type Props = { start: string; number: number; status: WeekStatus; isManager: boolean };

const link =
  "min-h-11 text-sm underline decoration-hairline decoration-2 underline-offset-8 hover:decoration-moss disabled:opacity-40";

/** Download for closed weeks; reopen / close again for managers. */
export function WeekActions({ start, number, status, isManager }: Props) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  if (status === "open") {
    return <span className="text-sm text-soil-soft">In progress · report after Sunday</span>;
  }

  return (
    <span className="flex flex-wrap items-center justify-end gap-x-5 gap-y-1">
      {status === "closed" && (
        <a href={`/weeks/${start}/report`} className="btn-primary h-10 px-4 text-sm" download>
          Download PDF
        </a>
      )}
      {status === "reopened" && <span className="text-sm text-clay">Reopened for corrections</span>}
      {isManager && status === "closed" && (
        <AnimatePresence mode="wait" initial={false}>
          {confirming ? (
            <motion.span
              key="confirm"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={quick}
              className="flex items-center gap-2"
            >
              <span className="text-sm text-soil-soft">Reopen week {number}?</span>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    tick();
                    await reopenWeek(start);
                    setConfirming(false);
                  })
                }
                className="min-h-10 rounded-full bg-clay px-4 text-sm font-medium text-linen active:scale-95"
              >
                Reopen
              </button>
              <button type="button" onClick={() => setConfirming(false)} className="min-h-10 px-2 text-sm text-soil-soft">
                Keep closed
              </button>
            </motion.span>
          ) : (
            <motion.button
              key="ask"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={quick}
              type="button"
              onClick={() => setConfirming(true)}
              className={`${link} text-soil-soft`}
            >
              Reopen
            </motion.button>
          )}
        </AnimatePresence>
      )}
      {isManager && status === "reopened" && (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              tick();
              await closeWeek(start);
            })
          }
          className="btn-secondary h-10 px-4 text-sm"
        >
          {pending ? "Closing…" : "Close again"}
        </button>
      )}
    </span>
  );
}
