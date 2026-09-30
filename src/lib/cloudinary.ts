import "server-only";
import { createHash } from "node:crypto";

type Config = { cloudName: string; apiKey: string; apiSecret: string };

/** Cloudinary credentials, or null when photo uploads aren't set up. */
export function cloudinaryConfig(): Config | null {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

export const isCloudinaryConfigured = () => cloudinaryConfig() !== null;

/** Cloudinary request signature: sorted "k=v" pairs joined by &, plus the secret, SHA-1. */
export function sign(params: Record<string, string | number>, apiSecret: string): string {
  const payload = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(payload + apiSecret).digest("hex");
}

/** Folder that holds one shop's photos. Uploads outside it are rejected. */
export const shopFolder = (shopId: string) => `petal/${shopId}`;

/** Best-effort delete; a leftover image costs storage, not correctness. */
export async function destroyImage(publicId: string): Promise<void> {
  const cfg = cloudinaryConfig();
  if (!cfg) return;
  const params = { invalidate: "true", public_id: publicId, timestamp: Math.round(Date.now() / 1000) };
  const body = new URLSearchParams({
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
    api_key: cfg.apiKey,
    signature: sign(params, cfg.apiSecret),
  });
  try {
    await fetch(`https://api.cloudinary.com/v1_1/${cfg.cloudName}/image/destroy`, {
      method: "POST",
      body,
    });
  } catch (err) {
    console.error("Cloudinary destroy failed", publicId, err);
  }
}
