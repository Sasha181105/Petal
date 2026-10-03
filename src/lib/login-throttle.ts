import "server-only";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { loginAttempts } from "@/db/schema";

// Slows down password guessing per email address. Stored in the database so
// it holds across server instances (in-memory counters wouldn't on Vercel).
const MAX_FAILURES = 5;
const WINDOW_MINUTES = 15;

const normalise = (email: string) => email.trim().toLowerCase();

/** Minutes until this email may try again, or 0 if it's not locked. */
export async function lockedForMinutes(email: string): Promise<number> {
  const since = sql`now() - make_interval(mins => ${WINDOW_MINUTES})`;
  const [row] = await db
    .select({ count: sql<number>`count(*)::int`, oldest: sql<string>`min(${loginAttempts.at})` })
    .from(loginAttempts)
    .where(and(eq(loginAttempts.email, normalise(email)), gte(loginAttempts.at, since)));
  if (!row || row.count < MAX_FAILURES) return 0;
  const unlockAt = new Date(row.oldest).getTime() + WINDOW_MINUTES * 60_000;
  return Math.max(1, Math.ceil((unlockAt - Date.now()) / 60_000));
}

export async function recordFailure(email: string): Promise<void> {
  await db.insert(loginAttempts).values({ email: normalise(email) });
  // Keep the table small.
  await db.delete(loginAttempts).where(lt(loginAttempts.at, sql`now() - interval '1 day'`));
}

// Emails (reset links, sign-up confirmations) are capped per address so the
// forms can't be used to flood someone's inbox. Same table, "mail:" prefix.
const MAX_EMAILS = 3;

/** True if another email may go to this address now; records it if so. */
export async function allowEmailTo(email: string): Promise<boolean> {
  const key = `mail:${normalise(email)}`;
  const since = sql`now() - make_interval(mins => ${WINDOW_MINUTES})`;
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(loginAttempts)
    .where(and(eq(loginAttempts.email, key), gte(loginAttempts.at, since)));
  if ((row?.count ?? 0) >= MAX_EMAILS) return false;
  await db.insert(loginAttempts).values({ email: key });
  return true;
}

export async function clearFailures(email: string): Promise<void> {
  await db.delete(loginAttempts).where(eq(loginAttempts.email, normalise(email)));
}
