"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { FlowerPhoto } from "@/components/flower-photo";
import { freshRow } from "@/lib/motion";
import type { FlowerOption } from "@/lib/queries";

/** Flowers as ledger rows. A newly added flower slides in with a soft highlight. */
type Row = FlowerOption & { unitCostCents: number | null };

export function FlowerList({ flowers }: { flowers: Row[] }) {
  return (
    <ul className="grid border-t border-soil md:grid-cols-2 md:gap-x-12">
      <AnimatePresence initial={false}>
        {flowers.map((f) => (
          <motion.li key={f.id} layout {...freshRow} className="border-b border-hairline">
            <Link
              href={`/flowers/${f.id}`}
              className="group flex items-center gap-4 py-3 transition-colors hover:bg-sage-wash/50"
            >
              <span className="transition-transform duration-300 group-hover:scale-105">
                <FlowerPhoto url={f.photoUrl} name={f.name} variant="thumb" />
              </span>
              <span className="flex-1 font-serif text-2xl md:text-3xl">{f.name}</span>
              {f.unitCostCents === null && (
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-clay">no price</span>
              )}
              {!f.photoUrl && <span className="label-caps hidden sm:inline">no photo</span>}
              <span className="pr-2 text-soil-soft transition-transform group-hover:translate-x-1 group-hover:text-moss">
                →
              </span>
            </Link>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
