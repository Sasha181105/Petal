import "server-only";
import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { shopMembers, shops, type MemberRole } from "@/db/schema";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ShopContext = {
  userId: string;
  email: string;
  role: MemberRole;
  /** Has seen the first-run tour (stored on the account, so once per person). */
  tourDone: boolean;
  shop: { id: string; name: string; currency: string; deliveriesEnabled: boolean };
};

export const CURRENCIES = ["EUR", "GBP", "USD"] as const;

async function membership(userId: string) {
  const [row] = await db
    .select({
      id: shops.id,
      name: shops.name,
      currency: shops.currency,
      deliveriesEnabled: shops.deliveriesEnabled,
      role: shopMembers.role,
    })
    .from(shopMembers)
    .innerJoin(shops, eq(shops.id, shopMembers.shopId))
    .where(eq(shopMembers.userId, userId))
    .limit(1);
  return row ?? null;
}

/**
 * A manager who signed up (see /signup) carries the new shop's name in their
 * account until it exists. Create it on their first visit, exactly once.
 * Invited staff never have `new_shop_name`, so this can't make them a shop.
 */
async function provisionShop(user: { id: string; user_metadata: Record<string, unknown> }) {
  const name = user.user_metadata?.new_shop_name;
  if (typeof name !== "string" || !name.trim()) return null;
  const currency = CURRENCIES.find((c) => c === user.user_metadata?.new_shop_currency) ?? "EUR";

  await db.transaction(async (tx) => {
    // One provisioning per user, even if two requests race.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${user.id}))`);
    const [existing] = await tx
      .select({ shopId: shopMembers.shopId })
      .from(shopMembers)
      .where(eq(shopMembers.userId, user.id));
    if (existing) return;
    const [shop] = await tx.insert(shops).values({ name: name.trim(), currency }).returning({ id: shops.id });
    await tx.insert(shopMembers).values({ userId: user.id, shopId: shop.id, role: "manager" });
  });

  // Done with it: clear it so it can never be used again.
  await supabaseAdmin().auth.admin.updateUserById(user.id, {
    user_metadata: { new_shop_name: null, new_shop_currency: null },
  });
  return membership(user.id);
}

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

  const row = (await membership(user.id)) ?? (await provisionShop(user));
  if (!row) {
    // Signed in but not attached to a shop (e.g. removed from the team).
    redirect("/login?error=no-shop");
  }

  const { role, ...shop } = row;
  return { userId: user.id, email: user.email ?? "", role, tourDone: user.user_metadata?.tour_done === true, shop };
});

/** Like requireShop, but only for managers. Use in every manager-only action. */
export async function requireManager(): Promise<ShopContext> {
  const ctx = await requireShop();
  if (ctx.role !== "manager") throw new Error("Only a manager can do that.");
  return ctx;
}

/** For manager-only pages: staff are sent back to the waste log. */
export async function requireManagerPage(): Promise<ShopContext> {
  const ctx = await requireShop();
  if (ctx.role !== "manager") redirect("/waste");
  return ctx;
}
