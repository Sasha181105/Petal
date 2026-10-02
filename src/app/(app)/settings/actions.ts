"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { shops } from "@/db/schema";
import { requireShop } from "@/lib/shop";

/**
 * Turn the optional delivery log on or off for the signed-in user's shop.
 * Turning it off hides it; delivery records are kept.
 */
export async function setDeliveriesEnabled(enabled: boolean): Promise<void> {
  const { shop } = await requireShop();
  await db.update(shops).set({ deliveriesEnabled: enabled }).where(eq(shops.id, shop.id));
  // Nav, dashboard and home all change with this setting.
  revalidatePath("/", "layout");
}
