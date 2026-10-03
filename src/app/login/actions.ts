"use server";

import { redirect, RedirectType } from "next/navigation";
import { z } from "zod";
import { recoveryLink } from "@/lib/auth-links";
import { sendEmail } from "@/lib/email/send";
import { resetPasswordEmail } from "@/lib/email/templates";
import { allowEmailTo, clearFailures, lockedForMinutes, recordFailure } from "@/lib/login-throttle";
import { newPassword } from "@/lib/password";
import { requireShop } from "@/lib/shop";
import { createClient } from "@/lib/supabase/server";

const credentials = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

// `at` makes each failed attempt distinct, so the form can shake again.
export type LoginState = { error?: string; at?: number };
export type FormState = { error?: string; done?: string; at?: number };

const lockedMessage = (minutes: number) =>
  `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}, or reset your password.`;

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Enter your email and password.", at: Date.now() };
  const { email } = parsed.data;

  const locked = await lockedForMinutes(email);
  if (locked) return { error: lockedMessage(locked), at: Date.now() };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    await recordFailure(email);
    return { error: "Wrong email or password.", at: Date.now() };
  }
  await clearFailures(email);

  // Replace, not push: otherwise Back lands on /login, which bounces you
  // straight into the app again and Back seems to do nothing.
  redirect("/waste", RedirectType.replace);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/", RedirectType.replace);
}

/**
 * "Forgot password": Petal emails a one-time link (via Resend) that lands on
 * /auth/confirm and then /reset-password. The reply is the same whether or
 * not the address has an account, so the form can't be used to probe emails.
 */
export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = z.string().trim().toLowerCase().email().safeParse(formData.get("email"));
  if (!email.success) return { error: "Enter the email you sign in with.", at: Date.now() };

  if (!(await allowEmailTo(email.data))) {
    return { error: "We've just sent a few links to this address. Check your inbox, or try again in 15 minutes.", at: Date.now() };
  }

  try {
    const { link } = await recoveryLink(email.data);
    await sendEmail(email.data, resetPasswordEmail({ link, email: email.data }));
  } catch (err) {
    // No such account: stay silent (same reply). Anything else is logged for us.
    if (!/not.*found|no user/i.test(String(err))) console.error("Password reset email failed", err);
  }
  return {
    done: `If ${email.data} has a Petal account, a link to set a new password is on its way. It works once and expires in an hour.`,
    at: Date.now(),
  };
}

const newPasswordForm = z
  .object({ password: newPassword, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { message: "The two passwords don't match." });

/** Set a new password after following an email link (reset or invitation). */
export async function setNewPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = newPasswordForm.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message, at: Date.now() };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "This link has expired. Ask for a new one.", at: Date.now() };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: friendlyPasswordError(error.message), at: Date.now() };
  if (user.email) await clearFailures(user.email);
  redirect("/waste", RedirectType.replace);
}

const changeForm = z
  .object({ current: z.string().min(1, "Enter your current password."), password: newPassword, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { message: "The two new passwords don't match." })
  .refine((v) => v.password !== v.current, { message: "The new password is the same as the current one." });

/** Settings → change password. Checks the current password first. */
export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const { email } = await requireShop();
  const parsed = changeForm.safeParse({
    current: formData.get("current"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message, at: Date.now() };

  const locked = await lockedForMinutes(email);
  if (locked) return { error: lockedMessage(locked), at: Date.now() };

  const supabase = await createClient();
  const check = await supabase.auth.signInWithPassword({ email, password: parsed.data.current });
  if (check.error) {
    await recordFailure(email);
    return { error: "Your current password isn't right.", at: Date.now() };
  }
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: friendlyPasswordError(error.message), at: Date.now() };
  await clearFailures(email);
  return { done: "Password changed.", at: Date.now() };
}

function friendlyPasswordError(message: string) {
  if (/different from the old/i.test(message)) return "Choose a password you haven't used here before.";
  if (/weak|pwned|leaked/i.test(message)) return "That password is too easy to guess. Try a longer one.";
  return "Couldn't save the password. Please try again.";
}
