"use server";

import { and, eq, isNotNull, ne, sql } from "drizzle-orm";
import { redirect, RedirectType } from "next/navigation";
import { db } from "@/db";
import { flowerTypes, shopMembers, shops } from "@/db/schema";
import { destroyImage } from "@/lib/cloudinary";
import { clearFailures, lockedForMinutes, recordFailure } from "@/lib/login-throttle";
import { requireShop } from "@/lib/shop";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type DeleteState = { error?: string; at?: number };

/**
 * Settings → delete account. Needs the current password.
 *
 * Staff, or a manager while another manager remains: only this account goes.
 * Their past entries stay, without a name.
 *
 * The last manager: the whole shop goes with it (flowers, photos, deliveries,
 * waste, reports) and so do the team's accounts, which can't exist without a
 * shop. They must also type the shop name.
 */
export async function deleteAccount(_prev: DeleteState, formData: FormData): Promise<DeleteState> {
  const { shop, role, userId, email } = await requireShop();
  const password = String(formData.get("password") ?? "");
  if (!password) return { error: "Enter your password to confirm.", at: Date.now() };

  const locked = await lockedForMinutes(email);
  if (locked) return { error: `Too many attempts. Try again in ${locked} minutes.`, at: Date.now() };

  const supabase = await createClient();
  const check = await supabase.auth.signInWithPassword({ email, password });
  if (check.error) {
    await recordFailure(email);
    return { error: "That password isn't right.", at: Date.now() };
  }

  const wholeShop = role === "manager" && (await managersOtherThan(shop.id, userId)) === 0;
  if (wholeShop && String(formData.get("shopName") ?? "").trim() !== shop.name) {
    return { error: `Type the shop name exactly: ${shop.name}`, at: Date.now() };
  }

  const admin = supabaseAdmin();
  try {
    if (wholeShop) {
      const photos = await db
        .select({ id: flowerTypes.photoPublicId })
        .from(flowerTypes)
        .where(and(eq(flowerTypes.shopId, shop.id), isNotNull(flowerTypes.photoPublicId)));
      const team = await db
        .select({ id: shopMembers.userId })
        .from(shopMembers)
        .where(and(eq(shopMembers.shopId, shop.id), ne(shopMembers.userId, userId)));

      // Cascades to members, flowers, suppliers, deliveries, waste and weeks.
      await db.delete(shops).where(eq(shops.id, shop.id));
      await Promise.all(photos.map((p) => destroyImage(p.id!)));
      for (const m of team) {
        const res = await admin.auth.admin.deleteUser(m.id);
        if (res.error) console.error("Couldn't delete team account", m.id, res.error.message);
      }
    }
    const res = await admin.auth.admin.deleteUser(userId);
    if (res.error) throw res.error;
  } catch (err) {
    console.error("Account deletion failed", err);
    return { error: "Couldn't delete the account. Please try again.", at: Date.now() };
  }

  await clearFailures(email);
  // The user no longer exists; just drop the session cookies.
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login?error=deleted", RedirectType.replace);
}

async function managersOtherThan(shopId: string, userId: string) {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(shopMembers)
    .where(and(eq(shopMembers.shopId, shopId), eq(shopMembers.role, "manager"), ne(shopMembers.userId, userId)));
  return row.n;
}
