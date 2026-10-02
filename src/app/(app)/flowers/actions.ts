"use server";

import { and, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { flowerTypes } from "@/db/schema";
import { cloudinaryConfig, destroyImage, shopFolder, sign } from "@/lib/cloudinary";
import { flowerName } from "@/lib/flower-name";
import { requireShop } from "@/lib/shop";

type Result = { ok: true } | { ok: false; error: string };

export type UploadTicket =
  | {
      ok: true;
      uploadUrl: string;
      fields: Record<string, string>;
    }
  | { ok: false; error: string };

// Big photos are shrunk on arrival so storage stays small.
const INCOMING_TRANSFORMATION = "c_limit,w_2000,h_2000";

async function ownFlower(shopId: string, flowerId: string) {
  if (!z.string().uuid().safeParse(flowerId).success) return null;
  const [flower] = await db
    .select({ id: flowerTypes.id, photoPublicId: flowerTypes.photoPublicId })
    .from(flowerTypes)
    .where(and(eq(flowerTypes.id, flowerId), eq(flowerTypes.shopId, shopId)));
  return flower ?? null;
}

function revalidateFlower(flowerId: string) {
  revalidatePath("/flowers");
  revalidatePath(`/flowers/${flowerId}`);
  revalidatePath("/waste");
}

/**
 * Signed parameters for uploading one photo straight from the browser to
 * Cloudinary. The API secret never leaves the server.
 */
export async function getUploadTicket(flowerId: string): Promise<UploadTicket> {
  const { shop } = await requireShop();
  const cfg = cloudinaryConfig();
  if (!cfg) return { ok: false, error: "Photo uploads aren't set up yet." };
  if (!(await ownFlower(shop.id, flowerId))) return { ok: false, error: "Flower not found." };

  const timestamp = Math.round(Date.now() / 1000);
  const params = {
    folder: shopFolder(shop.id),
    public_id: `${flowerId}-${timestamp}`,
    timestamp,
    transformation: INCOMING_TRANSFORMATION,
  };

  return {
    ok: true,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cfg.cloudName}/image/upload`,
    fields: {
      ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
      api_key: cfg.apiKey,
      signature: sign(params, cfg.apiSecret),
    },
  };
}

/** Store the uploaded photo on the flower, replacing (and deleting) any old one. */
export async function setFlowerPhoto(
  flowerId: string,
  upload: { publicId: string; url: string },
): Promise<Result> {
  const { shop } = await requireShop();
  const cfg = cloudinaryConfig();
  if (!cfg) return { ok: false, error: "Photo uploads aren't set up yet." };
  const flower = await ownFlower(shop.id, flowerId);
  if (!flower) return { ok: false, error: "Flower not found." };

  // Only accept images this shop uploaded for this flower, served by our cloud.
  const expectedId = new RegExp(`^${shopFolder(shop.id)}/${flowerId}-\\d+$`);
  const expectedUrl = `https://res.cloudinary.com/${cfg.cloudName}/image/upload/`;
  if (
    !expectedId.test(upload.publicId) ||
    !upload.url.startsWith(expectedUrl) ||
    !upload.url.includes(upload.publicId)
  ) {
    return { ok: false, error: "That upload doesn't belong to this flower." };
  }

  await db
    .update(flowerTypes)
    .set({ photoUrl: upload.url, photoPublicId: upload.publicId })
    .where(eq(flowerTypes.id, flower.id));

  if (flower.photoPublicId && flower.photoPublicId !== upload.publicId) {
    await destroyImage(flower.photoPublicId);
  }
  revalidateFlower(flower.id);
  return { ok: true };
}

export async function removeFlowerPhoto(flowerId: string): Promise<Result> {
  const { shop } = await requireShop();
  const flower = await ownFlower(shop.id, flowerId);
  if (!flower) return { ok: false, error: "Flower not found." };

  await db
    .update(flowerTypes)
    .set({ photoUrl: null, photoPublicId: null })
    .where(eq(flowerTypes.id, flower.id));
  if (flower.photoPublicId) await destroyImage(flower.photoPublicId);

  revalidateFlower(flower.id);
  return { ok: true };
}

/** Usual price per stem, in cents; null clears it. */
export async function setFlowerPrice(flowerId: string, cents: number | null): Promise<Result> {
  const { shop } = await requireShop();
  const flower = await ownFlower(shop.id, flowerId);
  if (!flower) return { ok: false, error: "Flower not found." };
  if (cents !== null && !z.number().int().min(0).max(1_000_000).safeParse(cents).success) {
    return { ok: false, error: "Enter a price like 0.85" };
  }

  await db.update(flowerTypes).set({ unitCostCents: cents }).where(eq(flowerTypes.id, flower.id));
  revalidateFlower(flower.id);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function renameFlower(flowerId: string, rawName: string): Promise<Result> {
  const { shop } = await requireShop();
  const flower = await ownFlower(shop.id, flowerId);
  if (!flower) return { ok: false, error: "Flower not found." };

  const parsed = flowerName.safeParse(rawName);
  if (!parsed.success) return { ok: false, error: "Enter a name (max 60 characters)." };

  const [clash] = await db
    .select({ id: flowerTypes.id })
    .from(flowerTypes)
    .where(
      and(
        eq(flowerTypes.shopId, shop.id),
        ne(flowerTypes.id, flower.id),
        sql`lower(${flowerTypes.name}) = lower(${parsed.data})`,
      ),
    );
  if (clash) return { ok: false, error: `There's already a flower called “${parsed.data}”.` };

  await db.update(flowerTypes).set({ name: parsed.data }).where(eq(flowerTypes.id, flower.id));
  revalidateFlower(flower.id);
  return { ok: true };
}
