"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { flowerTypes, wasteEntries, wasteReason } from "@/db/schema";
import { ISO_DATE } from "@/lib/dates";
import { requireShop } from "@/lib/shop";
import { isDateOpen } from "@/lib/weeks";

const wasteInput = z.object({
  flowerTypeId: z.string().uuid(),
  quantity: z.number().int().min(1).max(10_000),
  reason: z.enum(wasteReason.enumValues),
  wastedOn: z.string().regex(ISO_DATE),
});

export type WasteInput = z.infer<typeof wasteInput>;
export type LogWasteResult = { ok: true; id: string } | { ok: false; error: string };

const CLOSED_WEEK =
  "That day is in a closed week. Waste can only be logged in the open week; a manager can reopen a past week on the Weeks page.";

export async function logWaste(input: WasteInput): Promise<LogWasteResult> {
  const { shop, userId } = await requireShop();
  const parsed = wasteInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Pick a flower, a quantity and a reason." };

  // Weeks are enforced here, not just in the date picker.
  if (!(await isDateOpen(shop.id, parsed.data.wastedOn))) return { ok: false, error: CLOSED_WEEK };

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

/** Deletes an entry, unless its week is closed (throws, so the UI restores the row). */
export async function deleteWaste(id: string): Promise<void> {
  const { shop } = await requireShop();
  if (!z.string().uuid().safeParse(id).success) return;

  const [entry] = await db
    .select({ wastedOn: wasteEntries.wastedOn })
    .from(wasteEntries)
    .where(and(eq(wasteEntries.id, id), eq(wasteEntries.shopId, shop.id)));
  if (!entry) return;
  if (!(await isDateOpen(shop.id, entry.wastedOn))) throw new Error(CLOSED_WEEK);

  await db.delete(wasteEntries).where(and(eq(wasteEntries.id, id), eq(wasteEntries.shopId, shop.id)));
  revalidatePath("/waste");
}
