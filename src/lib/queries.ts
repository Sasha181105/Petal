import "server-only";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { flowerTypes } from "@/db/schema";

export type FlowerOption = { id: string; name: string; photoUrl: string | null };

/** Active flower types, most recently used (delivered or wasted) first. */
export async function listFlowerTypes(shopId: string): Promise<FlowerOption[]> {
  const lastUsed = sql`greatest(
    (select max(w.created_at) from waste_entries w where w.flower_type_id = ${flowerTypes.id}),
    (select max(d.created_at) from deliveries d where d.flower_type_id = ${flowerTypes.id})
  )`;

  return db
    .select({ id: flowerTypes.id, name: flowerTypes.name, photoUrl: flowerTypes.photoUrl })
    .from(flowerTypes)
    .where(and(eq(flowerTypes.shopId, shopId), eq(flowerTypes.archived, false)))
    .orderBy(sql`${lastUsed} desc nulls last`, asc(flowerTypes.name));
}
