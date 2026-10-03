"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { FlowerPhoto } from "@/components/flower-photo";
import { FormNotice } from "@/components/form-notice";
import { CATALOGUE, CATALOGUE_GROUPS } from "@/lib/catalogue";
import { gentle } from "@/lib/motion";
import { addFromCatalogue } from "./actions";

const key = (name: string) => name.toLowerCase();

/**
 * Petal's flower list as tickable tiles. Flowers with a photo start ticked;
 * ones the shop already has show as added.
 */
export function CataloguePicker({ have }: { have: string[] }) {
  const owned = useMemo(() => new Set(have.map(key)), [have]);
  const available = CATALOGUE.filter((f) => !owned.has(key(f.name)));
  const [picked, setPicked] = useState<Set<string>>(
    () => new Set(available.filter((f) => f.photoUrl).map((f) => f.name)),
  );
  const [query, setQuery] = useState("");
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<{ error?: string; done?: string; at?: number }>({});

  const toggle = (name: string) =>
    setPicked((p) => {
      const next = new Set(p);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  const setGroup = (names: string[], on: boolean) =>
    setPicked((p) => {
      const next = new Set(p);
      for (const n of names) {
        if (on) next.add(n);
        else next.delete(n);
      }
      return next;
    });

  const q = query.trim().toLowerCase();
  const shown = CATALOGUE.filter((f) => !q || f.name.toLowerCase().includes(q));

  function submit() {
    start(async () => {
      const res = await addFromCatalogue([...picked]);
      if (!res.ok) setNotice({ error: res.error, at: Date.now() });
      else {
        setPicked(new Set());
        setNotice({
          done: res.added
            ? `${res.added} flower${res.added === 1 ? "" : "s"} added. Rename, archive or add photos in Flowers.`
            : "You already had all of those.",
          at: Date.now(),
        });
      }
    });
  }

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`Search ${CATALOGUE.length} flowers…`}
        aria-label="Search Petal's flower list"
        className="field h-12 w-full max-w-md"
      />

      {CATALOGUE_GROUPS.map((group) => {
        const items = shown.filter((f) => f.group === group);
        if (!items.length) return null;
        const choosable = items.filter((f) => !owned.has(key(f.name))).map((f) => f.name);
        const allOn = choosable.length > 0 && choosable.every((n) => picked.has(n));
        return (
          <section key={group} className="mt-8">
            <div className="flex items-baseline justify-between gap-4 border-b border-hairline pb-2">
              <h3 className="label-caps">
                {group} <span className="text-soil-soft/70">· {items.length}</span>
              </h3>
              {choosable.length > 0 && (
                <button
                  type="button"
                  onClick={() => setGroup(choosable, !allOn)}
                  className="font-mono text-[11px] uppercase tracking-[0.14em] text-soil-soft hover:text-moss"
                >
                  {allOn ? "Untick all" : "Tick all"}
                </button>
              )}
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((f) => {
                const has = owned.has(key(f.name));
                const on = has || picked.has(f.name);
                return (
                  <li key={f.name}>
                    <button
                      type="button"
                      disabled={has}
                      aria-pressed={on}
                      onClick={() => toggle(f.name)}
                      className={`flex min-h-14 w-full items-center gap-2 rounded-lg border py-2 pl-2 pr-1.5 text-left transition-colors active:scale-[0.98] disabled:cursor-default disabled:opacity-60 ${
                        on ? "border-moss bg-sage-wash" : "border-hairline bg-linen/60 hover:border-soil/40"
                      }`}
                    >
                      {/* The tick sits on the photo's corner, leaving the width for the name. */}
                      <span className="relative shrink-0">
                        <FlowerPhoto url={f.photoUrl} name={f.name} variant="chip" />
                        <span
                          aria-hidden
                          className={`absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full border text-[9px] leading-none ${
                            on ? "border-moss bg-moss text-linen" : "border-soil/30 bg-linen"
                          }`}
                        >
                          {on && "✓"}
                        </span>
                      </span>
                      <span className="min-w-0 flex-1 hyphens-auto break-words text-[13px] font-medium leading-tight min-[380px]:text-sm">{f.name}</span>
                    </button>
                    {has && <span className="sr-only">Already in your shop</span>}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
      {shown.length === 0 && (
        <p className="mt-6 text-soil-soft">
          Not on the list. You can add “{query.trim()}” yourself in{" "}
          <Link href="/flowers" className="text-soil underline decoration-hairline decoration-2 underline-offset-4 hover:decoration-moss">
            Flowers
          </Link>
          .
        </p>
      )}

      {/* Sticky so the button stays in reach while scrolling the list; on a
          phone it sits just above the fixed bottom nav. */}
      <div className="sticky bottom-[calc(65px+env(safe-area-inset-bottom))] z-10 md:bottom-0 -mx-1 mt-8 bg-linen/95 px-1 py-4 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-4">
          <button type="button" onClick={submit} disabled={pending || picked.size === 0} className="btn-primary h-12">
            {pending ? "Adding…" : picked.size ? `Add ${picked.size} flower${picked.size === 1 ? "" : "s"}` : "Tick some flowers"}
          </button>
          <AnimatePresence>
            {picked.size > 0 && (
              <motion.button
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={gentle}
                onClick={() => setPicked(new Set())}
                className="btn-ghost h-12"
              >
                Clear
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        <div className="mt-3 max-w-md">
          <FormNotice {...notice} />
        </div>
      </div>
    </div>
  );
}
