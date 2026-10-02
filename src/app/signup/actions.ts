"use server";

import { redirect, RedirectType } from "next/navigation";
import { z } from "zod";
import { siteOrigin } from "@/lib/origin";
import { newPassword } from "@/lib/password";
import { CURRENCIES } from "@/lib/shop";
import { createClient } from "@/lib/supabase/server";

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
 * Manager sign-up: creates the account; the shop itself is created on first
 * sign-in from the details stored on the account (see provisionShop), so it
 * also works when Supabase asks people to confirm their email first.
 */
export async function signUpManager(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const parsed = signupForm.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message, at: Date.now() };
  const { shopName, currency, email, password } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { new_shop_name: shopName, new_shop_currency: currency },
      emailRedirectTo: `${await siteOrigin()}/auth/confirm?next=/welcome`,
    },
  });

  if (error) {
    if (/already registered|already exists/i.test(error.message)) {
      return { error: "There's already an account with this email. Sign in instead.", at: Date.now() };
    }
    if (/signups? not allowed|disabled/i.test(error.message)) {
      return { error: "New sign-ups are switched off for now.", at: Date.now() };
    }
    if (error.status === 429) return { error: "Too many attempts. Try again in a few minutes.", at: Date.now() };
    return { error: "Couldn't create the account. Please try again.", at: Date.now() };
  }

  // Email confirmation off: signed in already, straight to the new shop.
  if (data.session) redirect("/welcome", RedirectType.replace);
  // Confirmation on: the shop is created when they follow the email link.
  return { sentTo: email, at: Date.now() };
}
