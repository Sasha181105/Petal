"use server";

import { createClient } from "@/lib/supabase/server";

/** Remember that this person has seen the tour (finished or skipped). */
export async function finishTour(): Promise<void> {
  const supabase = await createClient();
  // Merged into the account's user_metadata; other keys are kept.
  await supabase.auth.updateUser({ data: { tour_done: true } });
}
