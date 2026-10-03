import "server-only";
import { siteOrigin } from "./origin";
import { supabaseAdmin } from "./supabase/admin";

/**
 * One-time links for emails Petal sends itself (via Resend). Supabase only
 * mints the token (admin generateLink sends nothing); the link points straight
 * at our /auth/confirm with a token_hash, so it works in any browser or device.
 */

type Minted = { link: string; userId: string };

async function confirmUrl(tokenHash: string, type: "signup" | "invite" | "recovery", next: string) {
  const url = new URL("/auth/confirm", await siteOrigin());
  url.searchParams.set("token_hash", tokenHash);
  url.searchParams.set("type", type);
  url.searchParams.set("next", next);
  return url.toString();
}

/** New manager: creates the (unconfirmed) account and returns its confirmation link. */
export async function signupLink(
  email: string,
  password: string,
  data: Record<string, string>,
): Promise<Minted> {
  const { data: res, error } = await supabaseAdmin().auth.admin.generateLink({
    type: "signup",
    email,
    password,
    options: { data },
  });
  if (error) throw error;
  return { link: await confirmUrl(res.properties.hashed_token, "signup", "/welcome"), userId: res.user.id };
}

/** New staff member: creates the account and returns a link to choose a password. */
export async function inviteLink(email: string, data: Record<string, string>): Promise<Minted> {
  const { data: res, error } = await supabaseAdmin().auth.admin.generateLink({
    type: "invite",
    email,
    options: { data },
  });
  if (error) throw error;
  return {
    link: await confirmUrl(res.properties.hashed_token, "invite", "/reset-password?welcome=1"),
    userId: res.user.id,
  };
}

/** Existing account: a link to set a new password. `welcome` for re-added staff. */
export async function recoveryLink(email: string, welcome = false): Promise<Minted> {
  const { data: res, error } = await supabaseAdmin().auth.admin.generateLink({ type: "recovery", email });
  if (error) throw error;
  return {
    link: await confirmUrl(res.properties.hashed_token, "recovery", welcome ? "/reset-password?welcome=1" : "/reset-password"),
    userId: res.user.id,
  };
}
