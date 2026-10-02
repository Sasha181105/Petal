"use server";

import { and, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { memberRole, shopMembers } from "@/db/schema";
import { siteOrigin } from "@/lib/origin";
import { newPassword } from "@/lib/password";
import { requireManager } from "@/lib/shop";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type TeamState = { error?: string; done?: string; at?: number };

const inviteForm = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("email"), email: z.string().trim().toLowerCase().email(), role: z.enum(memberRole.enumValues) }),
  z.object({
    mode: z.literal("password"),
    email: z.string().trim().toLowerCase().email(),
    role: z.enum(memberRole.enumValues),
    password: newPassword,
  }),
]);

async function findAuthUser(email: string) {
  const rows = await db.execute<{ id: string; shop_id: string | null }>(sql`
    select u.id, m.shop_id from auth.users u
    left join shop_members m on m.user_id = u.id
    where lower(u.email) = ${email}
    limit 1
  `);
  return rows[0] ?? null;
}

/**
 * Add someone to the shop, either by emailing them an invitation link, or by
 * setting a temporary password the manager hands over in person.
 */
export async function inviteMember(_prev: TeamState, formData: FormData): Promise<TeamState> {
  const { shop } = await requireManager();
  const parsed = inviteForm.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message, at: Date.now() };
  const { email, role, mode } = parsed.data;

  const existing = await findAuthUser(email);
  if (existing?.shop_id === shop.id) return { error: `${email} is already in your team.`, at: Date.now() };
  if (existing?.shop_id) return { error: `${email} already belongs to another shop.`, at: Date.now() };

  const admin = supabaseAdmin();
  const redirectTo = `${await siteOrigin()}/auth/confirm?next=/reset-password`;
  let userId = existing?.id;

  if (mode === "password") {
    const res = userId
      ? await admin.auth.admin.updateUserById(userId, { password: parsed.data.password, email_confirm: true })
      : await admin.auth.admin.createUser({ email, password: parsed.data.password, email_confirm: true });
    if (res.error) return { error: `Couldn't create the account: ${res.error.message}`, at: Date.now() };
    userId = res.data.user!.id;
  } else if (!userId) {
    // shop_name and role show up in the invitation email ({{ .Data.shop_name }}).
    const res = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: { shop_name: shop.name, role },
    });
    if (res.error) return { error: inviteError(res.error.message), at: Date.now() };
    userId = res.data.user.id;
  } else {
    // Known address without a shop (e.g. removed earlier): send a set-password link.
    const supabase = await createClient();
    const res = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (res.error) return { error: inviteError(res.error.message), at: Date.now() };
  }

  await db.insert(shopMembers).values({ userId, shopId: shop.id, role });
  revalidatePath("/settings");
  return {
    done:
      mode === "password"
        ? `${email} can sign in now with the password you set. Ask them to change it in Settings.`
        : `Invitation sent to ${email}. The link works once and expires in 24 hours.`,
    at: Date.now(),
  };
}

function inviteError(message: string) {
  if (/rate limit/i.test(message)) return "Too many emails sent just now. Try again later, or set a password instead.";
  return `Couldn't send the invitation (${message}). You can set a password instead.`;
}

/** Number of managers left if `userId` stopped being one. */
async function otherManagers(shopId: string, userId: string) {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(shopMembers)
    .where(and(eq(shopMembers.shopId, shopId), eq(shopMembers.role, "manager"), ne(shopMembers.userId, userId)));
  return row.n;
}

export async function setMemberRole(userId: string, role: "manager" | "staff"): Promise<TeamState> {
  const { shop } = await requireManager();
  if (!z.string().uuid().safeParse(userId).success || !memberRole.enumValues.includes(role)) {
    return { error: "Something's off with that request.", at: Date.now() };
  }
  if (role === "staff" && (await otherManagers(shop.id, userId)) === 0) {
    return { error: "The shop needs at least one manager.", at: Date.now() };
  }
  await db
    .update(shopMembers)
    .set({ role })
    .where(and(eq(shopMembers.userId, userId), eq(shopMembers.shopId, shop.id)));
  revalidatePath("/settings");
  return { done: "Role updated.", at: Date.now() };
}

/** Takes someone out of the shop. Their account stays, so past entries keep their name. */
export async function removeMember(userId: string): Promise<TeamState> {
  const { shop, userId: me } = await requireManager();
  if (userId === me) return { error: "You can't remove yourself.", at: Date.now() };
  if (!z.string().uuid().safeParse(userId).success) return { error: "Something's off with that request.", at: Date.now() };
  if ((await otherManagers(shop.id, userId)) === 0) {
    return { error: "The shop needs at least one manager.", at: Date.now() };
  }
  await db.delete(shopMembers).where(and(eq(shopMembers.userId, userId), eq(shopMembers.shopId, shop.id)));
  revalidatePath("/settings");
  return { done: "Removed from the shop.", at: Date.now() };
}
