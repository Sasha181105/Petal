"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { CATALOGUE } from "@/lib/catalogue";
import { square } from "@/lib/cloudinary-url";
import { gentle } from "@/lib/motion";
import { CataloguePicker } from "./catalogue-picker";

const PREVIEW = ["Rose (red)", "Peony", "Tulip", "Sunflower", "Hydrangea"]
  .map((n) => CATALOGUE.find((f) => f.name === n && f.photoUrl))
  .filter((f) => f !== undefined);

/** A new, empty shop: pick from Petal's list, or start blank. */
export function StartChoice() {
  const [picking, setPicking] = useState(false);

  return (
    <section className="mt-12">
      <h2 className="font-serif text-4xl md:text-5xl">
        How would you like to <em className="text-rose-deep">start?</em>
      </h2>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <button
          type="button"
          onClick={() => setPicking(true)}
          aria-expanded={picking}
          className={`flex flex-col rounded-lg border p-5 text-left transition-colors active:scale-[0.99] ${
            picking ? "border-moss bg-sage-wash" : "border-hairline bg-linen/60 hover:border-moss"
          }`}
        >
          <span className="font-serif text-3xl leading-tight">Choose from Petal&apos;s list</span>
          <span className="mt-2 text-soil-soft">
            {CATALOGUE.length} flowers and greens, many with photos. Tick the ones you sell; change anything later.
          </span>
          <span className="mt-5 flex -space-x-2" aria-hidden>
            {PREVIEW.map((f) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={f.name}
                src={square(f.photoUrl!, 96)}
                alt=""
                className="size-11 rounded-full border-2 border-linen object-cover"
              />
            ))}
            <span className="flex size-11 items-center justify-center rounded-full border-2 border-linen bg-linen-deep font-mono text-[11px] text-soil-soft">
              +{CATALOGUE.length - PREVIEW.length}
            </span>
          </span>
        </button>

        <Link
          href="/flowers"
          className="flex flex-col rounded-lg border border-hairline bg-linen/60 p-5 transition-colors hover:border-moss active:scale-[0.99]"
        >
          <span className="font-serif text-3xl leading-tight">Start from a blank page</span>
          <span className="mt-2 text-soil-soft">
            Add exactly the flowers you sell, by name, with your own photos.
          </span>
          <span className="mt-auto pt-5 text-xl text-soil-soft">→</span>
        </Link>
      </div>

      <AnimatePresence initial={false}>
        {picking && (
          <motion.div
            // No height animation: it needs overflow clipping, which would stop
            // the picker's sticky "Add" bar from sticking.
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={gentle}
          >
            <div className="pt-8">
              <CataloguePicker have={[]} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
