"use client";

import { useState, useTransition } from "react";
import { addFlowerType } from "@/lib/actions/flowers";
import type { FlowerOption } from "@/lib/queries";
import { FlowerPhoto } from "./flower-photo";

const RECENT_COUNT = 8;

type Props = {
  flowers: FlowerOption[];
  value: FlowerOption | null;
  onChange: (flower: FlowerOption | null) => void;
};

/**
 * Pick a flower in one tap from the most recent ones, or search all of them.
 * Typing a name that doesn't exist offers to add it.
 */
export function FlowerPicker({ flowers, value, onChange }: Props) {
  const [options, setOptions] = useState(flowers);
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, startAdding] = useTransition();

  if (value) {
    return (
      <div className="flex items-center justify-between gap-4 border-b border-moss pb-2">
        <span className="flex min-w-0 items-center gap-4">
          <FlowerPhoto url={value.photoUrl} name={value.name} variant="thumb" />
          <span className="truncate font-serif text-4xl italic leading-tight md:text-5xl">
            {value.name}
          </span>
        </span>
        <button type="button" onClick={() => onChange(null)} className="min-h-12 shrink-0 px-1 text-sm font-medium text-soil-soft underline decoration-hairline decoration-2 underline-offset-8 hover:text-soil hover:decoration-moss">
          Change
        </button>
      </div>
    );
  }

  const q = query.trim().toLowerCase();
  const matches = q ? options.filter((f) => f.name.toLowerCase().includes(q)) : options;
  const visible = q || showAll ? matches : matches.slice(0, RECENT_COUNT);
  const exactMatch = options.some((f) => f.name.toLowerCase() === q);

  function select(flower: FlowerOption) {
    setQuery("");
    setShowAll(false);
    setError(null);
    onChange(flower);
  }

  function add() {
    startAdding(async () => {
      const result = await addFlowerType(query);
      if (!result.ok) return setError(result.error);
      setOptions((prev) =>
        prev.some((f) => f.id === result.flower.id) ? prev : [result.flower, ...prev],
      );
      select(result.flower);
    });
  }

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          // Keyboard: Enter picks the first match, or adds the typed name.
          if (e.key !== "Enter" || !q) return;
          e.preventDefault();
          if (matches.length > 0) select(matches[0]);
          else if (!adding) add();
        }}
        placeholder="Search flowers…"
        aria-label="Search flowers"
        autoComplete="off"
        className="field h-12 w-full text-lg"
      />

      <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-3">
        {visible.map((flower) => (
          <button
            key={flower.id}
            type="button"
            onClick={() => select(flower)}
            className="chip flex min-h-14 items-center gap-3 px-3 text-left text-base"
          >
            <FlowerPhoto url={flower.photoUrl} name={flower.name} variant="chip" />
            <span className="min-w-0 truncate">{flower.name}</span>
          </button>
        ))}

        {q && !exactMatch && (
          <button
            type="button"
            onClick={add}
            disabled={adding}
            className="col-span-full min-h-14 rounded-lg border border-dashed border-rose-deep px-4 text-left text-base font-medium text-rose-deep transition-colors hover:bg-rose-wash disabled:opacity-60"
          >
            {adding ? "Adding…" : `+ Add “${query.trim()}”`}
          </button>
        )}
      </div>

      {!q && !showAll && options.length > RECENT_COUNT && (
        <button type="button" onClick={() => setShowAll(true)} className="mt-3 min-h-12 text-sm font-medium text-soil-soft underline decoration-hairline decoration-2 underline-offset-8 hover:text-soil hover:decoration-moss">
          Show all {options.length} flowers ↓
        </button>
      )}

      {!q && options.length === 0 && (
        <p className="mt-3 text-soil-soft">No flowers yet. Type a name above to add one.</p>
      )}

      {error && (
        <p role="alert" className="mt-2 text-sm text-rose-deep">
          {error}
        </p>
      )}
    </div>
  );
}
