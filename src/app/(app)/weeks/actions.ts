"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { reopenedWeeks } from "@/db/schema";
import { ISO_DATE, todayIn, weekStartOf } from "@/lib/dates";
import { requireManager } from "@/lib/shop";

function validPastMonday(start: string) {
  return ISO_DATE.test(start) && weekStartOf(start) === start && start < weekStartOf(todayIn());
}

function refresh() {
  revalidatePath("/weeks");
  revalidatePath("/waste");
}

/** Manager only: let a past week take entries again, to correct it. */
export async function reopenWeek(start: string): Promise<void> {
  const { shop, userId } = await requireManager();
  if (!validPastMonday(start)) throw new Error("Only a past week can be reopened.");
  await db
    .insert(reopenedWeeks)
    .values({ shopId: shop.id, weekStart: start, reopenedBy: userId })
    .onConflictDoNothing();
  refresh();
}

/** Manager only: lock a reopened week again. */
export async function closeWeek(start: string): Promise<void> {
  const { shop } = await requireManager();
  if (!ISO_DATE.test(start)) return;
  await db
    .delete(reopenedWeeks)
    .where(and(eq(reopenedWeeks.shopId, shop.id), eq(reopenedWeeks.weekStart, start)));
  refresh();
}
