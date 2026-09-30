"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { removeFlowerPhoto } from "@/app/(app)/flowers/actions";
import { uploadFlowerPhoto } from "@/lib/upload-photo";

type Props = { flowerId: string; hasPhoto: boolean; enabled: boolean };

/** Upload / replace / remove a flower's photo, with a progress line. */
export function PhotoControls({ flowerId, hasPhoto, enabled }: Props) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [removing, startRemoving] = useTransition();

  if (!enabled) {
    return (
      <p className="border-l-2 border-hairline pl-4 text-sm text-soil-soft">
        Photo uploads aren&apos;t set up yet. Add the Cloudinary keys to <code>.env.local</code>.
      </p>
    );
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setProgress(0);
    const result = await uploadFlowerPhoto(flowerId, file, setProgress);
    setProgress(null);
    if (input.current) input.current.value = "";
    if (!result.ok) return setError(result.error);
    router.refresh();
  }

  function remove() {
    if (!confirm("Remove this photo?")) return;
    setError(null);
    startRemoving(async () => {
      const result = await removeFlowerPhoto(flowerId);
      if (!result.ok) setError(result.error);
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
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          className="btn-primary h-12"
        >
          {progress !== null
            ? `Uploading… ${Math.round(progress * 100)}%`
            : hasPhoto
              ? "Replace photo"
              : "Add a photo"}
        </button>
        {hasPhoto && (
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="min-h-12 text-sm text-soil-soft underline-offset-4 hover:text-rose-deep hover:underline disabled:opacity-40"
          >
            {removing ? "Removing…" : "Remove photo"}
          </button>
        )}
      </div>

      {progress !== null && (
        <div className="mt-4 h-px w-full bg-hairline" aria-hidden>
          <div
            className="h-px bg-moss transition-[width] duration-200"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      )}
      {error && (
        <p role="alert" className="mt-4 border-l-2 border-rose-deep bg-rose-wash px-4 py-3 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
