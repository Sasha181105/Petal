"use client";

import { useState, useTransition } from "react";
import { renameFlower } from "../actions";

/** The flower's name as a big heading; "Rename" turns it into a field. */
export function RenameForm({ flowerId, name }: { flowerId: string; name: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <div className="flex items-baseline justify-between gap-4 border-b border-soil pb-3">
        <h1 className="font-serif text-6xl italic leading-none md:text-7xl">{name}</h1>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="min-h-11 shrink-0 text-sm text-soil-soft underline decoration-hairline decoration-2 underline-offset-8 hover:text-soil hover:decoration-moss"
        >
          Rename
        </button>
      </div>
    );
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await renameFlower(flowerId, value);
      if (!result.ok) return setError(result.error);
      setEditing(false);
    });
  }

  return (
    <form onSubmit={save} className="border-b border-soil pb-3">
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
      {error && (
        <p role="alert" className="mt-3 text-sm text-rose-deep">
          {error}
        </p>
      )}
    </form>
  );
}
