"use server";

import { z } from "zod";
import { signupLink } from "@/lib/auth-links";
import { sendEmail } from "@/lib/email/send";
import { confirmSignupEmail } from "@/lib/email/templates";
import { allowEmailTo } from "@/lib/login-throttle";
import { newPassword } from "@/lib/password";
import { CURRENCIES } from "@/lib/shop";

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

  let link: string;
  try {
    ({ link } = await signupLink(email, password, { new_shop_name: shopName, new_shop_currency: currency }));
  } catch (err) {
    if (/already (been )?registered|already exists|email_exists/i.test(String(err))) {
      return { error: "There's already an account with this email. Sign in instead.", at: Date.now() };
    }
    console.error("Sign-up failed", err);
    return { error: "Couldn't create the account. Please try again.", at: Date.now() };
  }

  try {
    await sendEmail(email, confirmSignupEmail({ link, email, shopName }));
  } catch (err) {
    console.error("Sign-up email failed", err);
    return { error: "The account was created, but the confirmation email didn't go out. Try again in a minute.", at: Date.now() };
  }
  return { sentTo: email, at: Date.now() };
}
