"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { flowerTypes } from "@/db/schema";
import { flowerName } from "@/lib/flower-name";
import type { FlowerOption } from "@/lib/queries";
import { requireShop } from "@/lib/shop";

export type AddFlowerResult =
  | { ok: true; flower: FlowerOption }
  | { ok: false; error: string };

/** Create a flower type, or return the existing one with the same name (any case). */
export async function addFlowerType(rawName: string): Promise<AddFlowerResult> {
  const { shop } = await requireShop();
  const parsed = flowerName.safeParse(rawName);
  if (!parsed.success) return { ok: false, error: "Enter a flower name (max 60 characters)." };

  await db
    .insert(flowerTypes)
    .values({ shopId: shop.id, name: parsed.data })
    .onConflictDoNothing();

  const [flower] = await db
    .select({
      id: flowerTypes.id,
      name: flowerTypes.name,
      photoUrl: flowerTypes.photoUrl,
      archived: flowerTypes.archived,
    })
    .from(flowerTypes)
    .where(
      and(
        eq(flowerTypes.shopId, shop.id),
        sql`lower(${flowerTypes.name}) = lower(${parsed.data})`,
      ),
    );

  // Typing the name of an archived flower brings it back.
  if (flower.archived) {
    await db.update(flowerTypes).set({ archived: false }).where(eq(flowerTypes.id, flower.id));
  }

  revalidatePath("/flowers");
  return { ok: true, flower: { id: flower.id, name: flower.name, photoUrl: flower.photoUrl } };
}
