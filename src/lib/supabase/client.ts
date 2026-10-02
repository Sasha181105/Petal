import { createBrowserClient } from "@supabase/ssr";

/** Browser Supabase client. Only used to finish email links (/auth/confirm). */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
