"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { flowerTypes } from "@/db/schema";
import { CATALOGUE } from "@/lib/catalogue";
import { requireManager } from "@/lib/shop";
import { createClient } from "@/lib/supabase/server";

export type AddResult = { ok: true; added: number } | { ok: false; error: string };

/** Adds the chosen flowers from Petal's list. Ones the shop already has are skipped. */
export async function addFromCatalogue(names: string[]): Promise<AddResult> {
  const { shop } = await requireManager();
  const wanted = new Set(names);
  const picked = CATALOGUE.filter((f) => wanted.has(f.name));
  if (!picked.length) return { ok: false, error: "Pick at least one flower." };

  const rows = await db
    .insert(flowerTypes)
    .values(picked.map(({ name, photoUrl, photoPublicId }) => ({ shopId: shop.id, name, photoUrl, photoPublicId })))
    // Unique per shop on lower(name): a flower they already have stays as it is.
    .onConflictDoNothing()
    .returning({ id: flowerTypes.id });

  revalidatePath("/welcome");
  revalidatePath("/flowers");
  revalidatePath("/waste");
  return { ok: true, added: rows.length };
}

const STEPS = ["flowers", "team", "waste"] as const;
export type StepKey = (typeof STEPS)[number];

/** Skip (or un-skip) a Welcome step. Kept on the account, so it sticks. */
export async function setStepSkipped(step: StepKey, skipped: boolean): Promise<void> {
  await requireManager();
  if (!STEPS.includes(step)) return;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const current: string[] = Array.isArray(user?.user_metadata?.welcome_skipped) ? user.user_metadata.welcome_skipped : [];
  const next = skipped ? [...new Set([...current, step])] : current.filter((s) => s !== step);
  await supabase.auth.updateUser({ data: { welcome_skipped: next } });
  revalidatePath("/welcome");
}
