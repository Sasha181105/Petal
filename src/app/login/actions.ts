"use server";

import { redirect, RedirectType } from "next/navigation";
import { z } from "zod";
import { isDemoEnabled } from "@/lib/demo";
import { createClient } from "@/lib/supabase/server";

const credentials = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

// `at` makes each failed attempt distinct, so the form can shake again.
export type LoginState = { error?: string; at?: number };

export async function signIn(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Enter your email and password.", at: Date.now() };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Wrong email or password.", at: Date.now() };

  // Replace, not push: otherwise Back lands on /login, which bounces you
  // straight into the app again and Back seems to do nothing.
  redirect("/waste", RedirectType.replace);
}

/** One-click sign-in to the shared demo shop (see isDemoEnabled). */
export async function signInDemo() {
  // The button is hidden when the demo is off; this guards the action itself too.
  if (!isDemoEnabled()) redirect("/login");
  const email = process.env.DEMO_USER_EMAIL!;
  const password = process.env.DEMO_USER_PASSWORD!;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  redirect(error ? "/login" : "/waste", RedirectType.replace);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/", RedirectType.replace);
}
