"use client";

import { motion } from "motion/react";
import { gentle } from "@/lib/motion";

/** One ledger row of a form: number and label on the left, input on the right. */
export function FormStep({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
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
