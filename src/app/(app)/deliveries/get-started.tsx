"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { tick } from "@/lib/haptics";
import { quick } from "@/lib/motion";
import { setDeliveriesEnabled } from "../settings/actions";

/** Turns the delivery log on; the page then re-renders as the log itself. */
export function GetStartedButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          tick(12);
          await setDeliveriesEnabled(true);
          router.refresh();
        })
      }
      className="btn-primary group relative h-14 overflow-hidden px-8 text-base"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={pending ? "on" : "idle"}
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -16, opacity: 0 }}
          transition={quick}
          className="inline-flex items-center gap-3"
        >
          {pending ? (
            "Turning on…"
          ) : (
            <>
              Get started
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </>
          )}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
