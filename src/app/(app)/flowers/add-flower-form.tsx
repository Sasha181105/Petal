"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { addFlowerType } from "@/lib/actions/flowers";
import { uploadFlowerPhoto } from "@/lib/upload-photo";

/** Name plus an optional photo. The flower is created first, then the photo goes up. */
export function AddFlowerForm({ uploadsEnabled }: { uploadsEnabled: boolean }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = status !== null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("Adding…");
    const added = await addFlowerType(name);
    if (!added.ok) {
      setStatus(null);
      return setError(added.error);
    }
    if (file) {
      const uploaded = await uploadFlowerPhoto(added.flower.id, file, (p) =>
        setStatus(`Uploading photo… ${Math.round(p * 100)}%`),
      );
      if (!uploaded.ok) setError(`${added.flower.name} was added, but the photo wasn't: ${uploaded.error}`);
    }
    setStatus(null);
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
        <label className="flex h-12 cursor-pointer items-center gap-3 rounded-full border border-dashed border-soil/30 px-5 text-sm text-soil-soft transition-colors hover:border-moss hover:text-soil">
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <span className="max-w-48 truncate">{file ? file.name : "+ Photo (optional)"}</span>
        </label>
      )}

      <button type="submit" disabled={busy || !name.trim()} className="btn-primary h-12">
        {status ?? "Add flower"}
      </button>

      {error && (
        <p role="alert" className="border-l-2 border-rose-deep bg-rose-wash px-4 py-3 text-sm md:col-span-3">
          {error}
        </p>
      )}
    </form>
  );
}
