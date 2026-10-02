import "server-only";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { shopMembers, shops } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

export type ShopContext = {
  userId: string;
  shop: { id: string; name: string; currency: string; deliveriesEnabled: boolean };
};

/**
 * The signed-in user and the shop they belong to. Every query in the app
 * must filter by `shop.id` from here — never by an id sent from the client.
 */
export const requireShop = cache(async (): Promise<ShopContext> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [row] = await db
    .select({
      id: shops.id,
      name: shops.name,
      currency: shops.currency,
      deliveriesEnabled: shops.deliveriesEnabled,
    })
    .from(shopMembers)
    .innerJoin(shops, eq(shops.id, shopMembers.shopId))
    .where(eq(shopMembers.userId, user.id))
    .limit(1);

  if (!row) {
    // Signed in but not attached to a shop (see `npm run user:add`).
    redirect("/login?error=no-shop");
  }

  return { userId: user.id, shop: row };
});
