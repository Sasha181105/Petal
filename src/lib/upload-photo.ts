// Browser-side photo upload: shrink, send to Cloudinary, save on the flower.
import { getUploadTicket, setFlowerPhoto } from "@/app/(app)/flowers/actions";

const MAX_EDGE = 2000;
const MAX_BYTES = 10 * 1024 * 1024; // Cloudinary free-plan limit per image

/** Downscale big phone photos before upload. Falls back to the original file. */
async function shrink(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 2 * 1024 * 1024) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    return blob ?? file;
  } catch {
    return file;
  }
}

function post(url: string, form: FormData, onProgress: (f: number) => void) {
  return new Promise<{ public_id: string; secure_url: string }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText));
      else reject(new Error("Upload failed. Please try again."));
    };
    xhr.onerror = () => reject(new Error("No connection. Please try again."));
    xhr.send(form);
  });
}

export async function uploadFlowerPhoto(
  flowerId: string,
  file: File,
  onProgress: (fraction: number) => void = () => {},
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!file.type.startsWith("image/")) return { ok: false, error: "Choose an image file." };

  const blob = await shrink(file);
  if (blob.size > MAX_BYTES) return { ok: false, error: "That photo is too large (max 10 MB)." };

  const ticket = await getUploadTicket(flowerId);
  if (!ticket.ok) return ticket;

  const form = new FormData();
  for (const [k, v] of Object.entries(ticket.fields)) form.append(k, v);
  form.append("file", blob);

  try {
    const res = await post(ticket.uploadUrl, form, onProgress);
    return await setFlowerPhoto(flowerId, { publicId: res.public_id, url: res.secure_url });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Upload failed." };
  }
}
