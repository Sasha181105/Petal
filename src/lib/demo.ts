import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { shops } from "@/db/schema";
import { DEMO_SHOP_NAME } from "./demo-shop";

/**
 * The one-click public demo is on only when demo credentials are set.
 * Leave DEMO_USER_EMAIL / DEMO_USER_PASSWORD unset for a real shop's deployment.
 */
export const isDemoEnabled = () =>
  Boolean(process.env.DEMO_USER_EMAIL && process.env.DEMO_USER_PASSWORD);

/** The seeded demo shop, used for the public home page figures. */
export async function findDemoShop() {
  if (!isDemoEnabled()) return null;
  const [shop] = await db
    .select({ id: shops.id, name: shops.name, currency: shops.currency })
    .from(shops)
    .where(eq(shops.name, DEMO_SHOP_NAME))
    .limit(1);
  return shop ?? null;
}
