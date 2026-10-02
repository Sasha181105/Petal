"use client";

import { AnimatePresence, motion } from "motion/react";
import { gentle } from "@/lib/motion";

/** Error (rose, with a little shake) or confirmation (moss) under a form. */
export function FormNotice({ error, done, at }: { error?: string; done?: string; at?: number }) {
  const text = error ?? done;
  return (
    <AnimatePresence initial={false}>
      {text && (
        <motion.p
          key={at ?? text}
          role={error ? "alert" : "status"}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto", x: error ? [0, -6, 6, -4, 4, 0] : 0 }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ ...gentle, x: { duration: 0.4 } }}
          className="overflow-hidden"
        >
          <span
            className={`block border-l-2 px-4 py-3 text-sm ${
              error ? "border-rose-deep bg-rose-wash" : "border-moss bg-sage-wash text-moss"
            }`}
          >
            {text}
          </span>
        </motion.p>
      )}
    </AnimatePresence>
  );
}
