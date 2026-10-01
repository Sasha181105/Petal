import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { shops } from "@/db/schema";
import { DEMO_SHOP_NAME } from "./demo-shop";

/**
 * The public demo (one-click "Open the demo shop" and sample figures on the
 * home page) is off unless PUBLIC_DEMO=true. The demo credentials alone don't
 * turn it on: the seed script needs them on every machine.
 */
export const isDemoEnabled = () =>
  process.env.PUBLIC_DEMO === "true" &&
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
