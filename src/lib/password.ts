import { z } from "zod";

// Client-safe password rules, shared by every form that sets a password.
export const PASSWORD_MIN = 8;

export const newPassword = z
  .string()
  .min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters.`)
  // bcrypt (used by Supabase Auth) ignores anything past 72 bytes.
  .max(72, "Use at most 72 characters.");

/** A light, honest hint: length and variety, nothing more. */
export function strength(pw: string): { score: 0 | 1 | 2 | 3; label: string } {
  if (pw.length < PASSWORD_MIN) return { score: 0, label: `At least ${PASSWORD_MIN} characters` };
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  if (pw.length >= 14 || (pw.length >= 10 && kinds >= 3)) return { score: 3, label: "Strong" };
  if (pw.length >= 10 || kinds >= 3) return { score: 2, label: "Good" };
  return { score: 1, label: "OK — longer is stronger" };
}
