"use server";

import { sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { signupLink } from "@/lib/auth-links";
import { sendEmail } from "@/lib/email/send";
import { confirmSignupEmail } from "@/lib/email/templates";
import { allowEmailTo } from "@/lib/login-throttle";
import { newPassword } from "@/lib/password";
import { CURRENCIES } from "@/lib/shop";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type SignupState = { error?: string; sentTo?: string; at?: number };

const signupForm = z
  .object({
    shopName: z.string().trim().min(1, "Give your shop a name.").max(80, "Keep the shop name under 80 characters."),
    currency: z.enum(CURRENCIES),
    email: z.string().trim().toLowerCase().email("Enter a valid email."),
    password: newPassword,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: "The two passwords don't match." });

/**
 * Manager sign-up. Creates an unconfirmed account and emails a confirmation
 * link from Petal (Resend). The shop itself is created on first sign-in from
 * the details stored on the account (see provisionShop in lib/shop.ts).
 */
export async function signUpManager(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const parsed = signupForm.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message, at: Date.now() };
  const { shopName, currency, email, password } = parsed.data;

  if (!(await allowEmailTo(email))) {
    return { error: "We've just sent a few emails to this address. Check your inbox, or try again in 15 minutes.", at: Date.now() };
  }

  // An earlier sign-up that was never confirmed (nobody proved they own the
  // address, and there's no shop yet) is replaced, so trying again just works.
  const existing = await authUser(email);
  if (existing && (existing.confirmed || existing.in_shop)) {
    return { error: "There's already an account with this email. Sign in instead.", at: Date.now() };
  }
  if (existing) await supabaseAdmin().auth.admin.deleteUser(existing.id);

  let minted: { link: string; userId: string };
  try {
    minted = await signupLink(email, password, { new_shop_name: shopName, new_shop_currency: currency });
  } catch (err) {
    console.error("Sign-up failed", err);
    return { error: "Couldn't create the account. Please try again.", at: Date.now() };
  }

  try {
    await sendEmail(email, confirmSignupEmail({ link: minted.link, email, shopName }));
  } catch (err) {
    console.error("Sign-up email failed", err);
    // Don't leave a half-made account behind.
    await supabaseAdmin().auth.admin.deleteUser(minted.userId);
    return { error: "Couldn't send the confirmation email. Please try again in a minute.", at: Date.now() };
  }
  return { sentTo: email, at: Date.now() };
}

async function authUser(email: string) {
  const rows = await db.execute<{ id: string; confirmed: boolean; in_shop: boolean }>(sql`
    select u.id, u.email_confirmed_at is not null as confirmed,
           exists (select 1 from shop_members m where m.user_id = u.id) as in_shop
    from auth.users u where lower(u.email) = ${email} limit 1
  `);
  return rows[0] ?? null;
}
