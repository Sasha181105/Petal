"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { removeFlowerPhoto } from "@/app/(app)/flowers/actions";
import { tick } from "@/lib/haptics";
import { gentle, quick } from "@/lib/motion";
import { uploadFlowerPhoto } from "@/lib/upload-photo";

type Props = { flowerId: string; hasPhoto: boolean; enabled: boolean };
type Note = { kind: "done" | "error"; text: string; at: number };

/** Upload / replace / remove a flower's photo, with a progress line. */
export function PhotoControls({ flowerId, hasPhoto, enabled }: Props) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [note, setNote] = useState<Note | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removing, startRemoving] = useTransition();

  useEffect(() => {
    if (note?.kind !== "done") return;
    const t = setTimeout(() => setNote(null), 2500);
    return () => clearTimeout(t);
  }, [note]);

  if (!enabled) {
    return (
      <p className="border-l-2 border-hairline pl-4 text-sm text-soil-soft">
        Photo uploads aren&apos;t set up yet. Add the Cloudinary keys to <code>.env.local</code>.
      </p>
    );
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setNote(null);
    setProgress(0);
    const result = await uploadFlowerPhoto(flowerId, file, setProgress);
    setProgress(null);
    if (input.current) input.current.value = "";
    if (!result.ok) return setNote({ kind: "error", text: result.error, at: Date.now() });
    tick(12);
    setNote({ kind: "done", text: "Photo saved", at: Date.now() });
    router.refresh();
  }

  function remove() {
    setConfirmRemove(false);
    setNote(null);
    startRemoving(async () => {
      const result = await removeFlowerPhoto(flowerId);
      if (!result.ok) return setNote({ kind: "error", text: result.error, at: Date.now() });
      tick();
      setNote({ kind: "done", text: "Photo removed", at: Date.now() });
      router.refresh();
    });
  }

  const busy = progress !== null || removing;

  return (
    <div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <div className="flex min-h-12 flex-wrap items-center gap-x-6 gap-y-3">
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          className="btn-primary h-12 min-w-44"
        >
          {progress !== null
            ? `Uploading… ${Math.round(progress * 100)}%`
            : hasPhoto
              ? "Replace photo"
              : "Add a photo"}
        </button>

        {hasPhoto && (
          <AnimatePresence mode="wait" initial={false}>
            {confirmRemove ? (
              <motion.span
                key="confirm"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={quick}
                className="flex items-center gap-2"
              >
                <span className="text-sm text-soil-soft">Remove it?</span>
                <button
                  type="button"
                  onClick={remove}
                  className="min-h-11 rounded-full bg-rose-deep px-4 text-sm font-medium text-linen transition-transform active:scale-95"
                >
                  Remove
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmRemove(false)}
                  className="min-h-11 px-2 text-sm text-soil-soft hover:text-soil"
                >
                  Keep
                </button>
              </motion.span>
            ) : (
              <motion.button
                key="ask"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={quick}
                type="button"
                onClick={() => setConfirmRemove(true)}
                disabled={busy}
                className="min-h-12 text-sm text-soil-soft underline-offset-4 hover:text-rose-deep hover:underline disabled:opacity-40"
              >
                {removing ? "Removing…" : "Remove photo"}
              </motion.button>
            )}
          </AnimatePresence>
        )}
      </div>

      <AnimatePresence>
        {progress !== null && (
          <motion.div
            key="progress"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { delay: 0.2 } }}
            className="mt-4 h-0.5 w-full overflow-hidden rounded-full bg-hairline"
            aria-hidden
          >
            <motion.div
              className="h-full origin-left rounded-full bg-moss"
              animate={{ scaleX: progress }}
              transition={{ type: "spring", stiffness: 120, damping: 24 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

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
            className="overflow-hidden"
          >
            <span
              className={`mt-4 block border-l-2 px-4 py-3 text-sm ${
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
    </div>
  );
}
