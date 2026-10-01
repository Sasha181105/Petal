"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { addFlowerType } from "@/lib/actions/flowers";
import { tick } from "@/lib/haptics";
import { gentle, quick } from "@/lib/motion";
import { uploadFlowerPhoto } from "@/lib/upload-photo";

type Note = { kind: "done" | "error"; text: string; at: number };

/** Name plus an optional photo. The flower is created first, then the photo goes up. */
export function AddFlowerForm({ uploadsEnabled }: { uploadsEnabled: boolean }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [note, setNote] = useState<Note | null>(null);
  const busy = status !== null;

  // Success notes fade away by themselves; errors stay until the next try.
  useEffect(() => {
    if (note?.kind !== "done") return;
    const t = setTimeout(() => setNote(null), 3000);
    return () => clearTimeout(t);
  }, [note]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setNote(null);
    setStatus("Adding…");
    const added = await addFlowerType(name);
    if (!added.ok) {
      setStatus(null);
      return setNote({ kind: "error", text: added.error, at: Date.now() });
    }
    let photoError: string | null = null;
    if (file) {
      const uploaded = await uploadFlowerPhoto(added.flower.id, file, (p) =>
        setStatus(`Uploading… ${Math.round(p * 100)}%`),
      );
      if (!uploaded.ok) photoError = uploaded.error;
    }
    tick(12);
    setStatus(null);
    setNote(
      photoError
        ? { kind: "error", text: `${added.flower.name} was added, but the photo wasn't: ${photoError}`, at: Date.now() }
        : { kind: "done", text: `${added.flower.name} added`, at: Date.now() },
    );
    setName("");
    setFile(null);
    if (fileInput.current) fileInput.current.value = "";
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
      <label className="block">
        <span className="label-caps">New flower</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Ranunculus (orange)"
          required
          maxLength={60}
          className="field mt-2 block h-12 w-full text-lg"
        />
      </label>

      {uploadsEnabled && (
        <label
          className={`flex h-12 cursor-pointer items-center gap-3 rounded-full border border-dashed px-5 text-sm transition-colors hover:border-moss hover:text-soil ${
            file ? "border-moss bg-sage-wash text-moss" : "border-soil/30 text-soil-soft"
          }`}
        >
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <span className="max-w-48 truncate">{file ? `✓ ${file.name}` : "+ Photo (optional)"}</span>
        </label>
      )}

      <button type="submit" disabled={busy || !name.trim()} className="btn-primary relative h-12 overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={status ? "busy" : "idle"}
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -14, opacity: 0 }}
            transition={quick}
          >
            {status ?? "Add flower"}
          </motion.span>
        </AnimatePresence>
      </button>

      <AnimatePresence initial={false}>
        {note && (
          <motion.p
            key={note.at}
            role={note.kind === "error" ? "alert" : "status"}
            initial={{ opacity: 0, height: 0 }}
            animate={{
              opacity: 1,
              height: "auto",
              x: note.kind === "error" ? [0, -6, 6, -4, 4, 0] : 0,
            }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ ...gentle, x: { duration: 0.4 } }}
            className="overflow-hidden md:col-span-3"
          >
            <span
              className={`block border-l-2 px-4 py-3 text-sm ${
                note.kind === "error"
                  ? "border-rose-deep bg-rose-wash"
                  : "border-moss bg-sage-wash text-moss"
              }`}
            >
              {note.kind === "done" ? `✓ ${note.text}` : note.text}
            </span>
          </motion.p>
        )}
      </AnimatePresence>
    </form>
  );
}
