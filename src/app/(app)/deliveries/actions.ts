"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { deliveries, flowerTypes, suppliers } from "@/db/schema";
import { ISO_DATE } from "@/lib/dates";
import { requireShop } from "@/lib/shop";

const deliveryInput = z.object({
  flowerTypeId: z.string().uuid(),
  quantity: z.number().int().min(1).max(100_000),
  unitCostCents: z.number().int().min(0).max(1_000_000),
  supplierId: z.string().uuid().nullable(),
  receivedOn: z.string().regex(ISO_DATE),
});

export type DeliveryInput = z.infer<typeof deliveryInput>;
type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

async function requireDeliveries() {
  const ctx = await requireShop();
  if (!ctx.shop.deliveriesEnabled) throw new Error("Deliveries are turned off for this shop.");
  return ctx;
}

export async function logDelivery(input: DeliveryInput): Promise<Result<{ id: string }>> {
  const { shop, userId } = await requireDeliveries();
  const parsed = deliveryInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Pick a flower, stems and a price." };
  const d = parsed.data;

  // Ids come from the client, so check they belong to this shop.
  const [flower] = await db
    .select({ id: flowerTypes.id })
    .from(flowerTypes)
    .where(and(eq(flowerTypes.id, d.flowerTypeId), eq(flowerTypes.shopId, shop.id)));
  if (!flower) return { ok: false, error: "That flower no longer exists." };
  if (d.supplierId) {
    const [supplier] = await db
      .select({ id: suppliers.id })
      .from(suppliers)
      .where(and(eq(suppliers.id, d.supplierId), eq(suppliers.shopId, shop.id)));
    if (!supplier) return { ok: false, error: "That supplier no longer exists." };
  }

  const [row] = await db
    .insert(deliveries)
    .values({ ...d, shopId: shop.id, createdBy: userId })
    .returning({ id: deliveries.id });

  // The latest price becomes the flower's usual price, so waste stays priced
  // sensibly even if deliveries are switched off later.
  await db
    .update(flowerTypes)
    .set({ unitCostCents: d.unitCostCents })
    .where(eq(flowerTypes.id, flower.id));

  revalidatePath("/deliveries");
  return { ok: true, id: row.id };
}

export async function deleteDelivery(id: string): Promise<void> {
  const { shop } = await requireDeliveries();
  if (!z.string().uuid().safeParse(id).success) return;
  await db.delete(deliveries).where(and(eq(deliveries.id, id), eq(deliveries.shopId, shop.id)));
  revalidatePath("/deliveries");
}

const supplierName = z
  .string()
  .transform((s) => s.trim().replace(/\s+/g, " "))
  .pipe(z.string().min(1).max(60));

/** Create a supplier, or return the existing one with the same name (any case). */
export async function addSupplier(
  rawName: string,
): Promise<Result<{ supplier: { id: string; name: string } }>> {
  const { shop } = await requireDeliveries();
  const parsed = supplierName.safeParse(rawName);
  if (!parsed.success) return { ok: false, error: "Enter a supplier name (max 60 characters)." };

  await db.insert(suppliers).values({ shopId: shop.id, name: parsed.data }).onConflictDoNothing();
  const [supplier] = await db
    .select({ id: suppliers.id, name: suppliers.name })
    .from(suppliers)
    .where(and(eq(suppliers.shopId, shop.id), sql`lower(${suppliers.name}) = lower(${parsed.data})`));
  return { ok: true, supplier };
}
