"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { flowerTypes, wasteEntries, wasteReason } from "@/db/schema";
import { ISO_DATE } from "@/lib/dates";
import { requireShop } from "@/lib/shop";

const wasteInput = z.object({
  flowerTypeId: z.string().uuid(),
  quantity: z.number().int().min(1).max(10_000),
  reason: z.enum(wasteReason.enumValues),
  wastedOn: z.string().regex(ISO_DATE),
});

export type WasteInput = z.infer<typeof wasteInput>;
export type LogWasteResult = { ok: true; id: string } | { ok: false; error: string };

export async function logWaste(input: WasteInput): Promise<LogWasteResult> {
  const { shop, userId } = await requireShop();
  const parsed = wasteInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Pick a flower, a quantity and a reason." };

  // The flower id comes from the client, so make sure it's this shop's.
  const [flower] = await db
    .select({ id: flowerTypes.id })
    .from(flowerTypes)
    .where(and(eq(flowerTypes.id, parsed.data.flowerTypeId), eq(flowerTypes.shopId, shop.id)));
  if (!flower) return { ok: false, error: "That flower no longer exists." };

  const [row] = await db
    .insert(wasteEntries)
    .values({ ...parsed.data, shopId: shop.id, createdBy: userId })
    .returning({ id: wasteEntries.id });

  revalidatePath("/waste");
  return { ok: true, id: row.id };
}

export async function deleteWaste(id: string): Promise<void> {
  const { shop } = await requireShop();
  if (!z.string().uuid().safeParse(id).success) return;

  await db
    .delete(wasteEntries)
    .where(and(eq(wasteEntries.id, id), eq(wasteEntries.shopId, shop.id)));

  revalidatePath("/waste");
}
