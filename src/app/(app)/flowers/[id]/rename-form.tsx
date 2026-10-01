"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, useTransition } from "react";
import { tick } from "@/lib/haptics";
import { quick } from "@/lib/motion";
import { renameFlower } from "../actions";

const swap = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: quick,
};

/** The flower's name as a big heading; "Rename" crossfades it into a field. */
export function RenameForm({ flowerId, name }: { flowerId: string; name: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [error, setError] = useState<{ text: string; at: number } | null>(null);
  const [pending, startTransition] = useTransition();

  function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await renameFlower(flowerId, value);
      if (!result.ok) return setError({ text: result.error, at: Date.now() });
      tick();
      setEditing(false);
    });
  }

  return (
    <div className="border-b border-soil pb-3">
      <AnimatePresence mode="wait" initial={false}>
        {!editing ? (
          <motion.div key="view" {...swap} className="flex items-baseline justify-between gap-4">
            <h1 className="font-serif text-6xl italic leading-none md:text-7xl">{name}</h1>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="min-h-11 shrink-0 text-sm text-soil-soft underline decoration-hairline decoration-2 underline-offset-8 hover:text-soil hover:decoration-moss"
            >
              Rename
            </button>
          </motion.div>
        ) : (
          <motion.form key="edit" {...swap} onSubmit={save}>
            <label className="label-caps" htmlFor="flower-name">
              Flower name
            </label>
            <div className="mt-2 flex gap-3">
              <input
                id="flower-name"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                maxLength={60}
                autoFocus
                className="field h-12 w-full text-lg"
              />
              <button type="submit" disabled={pending} className="btn-primary h-12">
                {pending ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setValue(name);
                  setEditing(false);
                  setError(null);
                }}
                className="min-h-12 text-sm text-soil-soft hover:text-soil"
              >
                Cancel
              </button>
            </div>
            <AnimatePresence>
              {error && (
                <motion.p
                  key={error.at}
                  role="alert"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto", x: [0, -6, 6, -4, 4, 0] }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ ...quick, x: { duration: 0.4 } }}
                  className="mt-3 overflow-hidden text-sm text-rose-deep"
                >
                  {error.text}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
