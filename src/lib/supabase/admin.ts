import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Supabase admin client (service role / secret key). Server only: used to
 * invite and create staff accounts. Never import this from client code.
 */
export function supabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set.");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
