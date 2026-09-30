// Shared setup for CLI scripts. Scripts can't import src/db (it's marked
// server-only for Next.js), so they open their own connection here.
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema";

config({ path: ".env.local" });

export function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} in .env.local (see .env.example)`);
  return value;
}

export function connect() {
  const client = postgres(process.env.DIRECT_URL ?? env("DATABASE_URL"), {
    prepare: false,
    max: 1,
  });
  return { db: drizzle(client, { schema }), close: () => client.end() };
}

export function supabaseAdmin() {
  return createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Create the auth user, or reset its password if it already exists. Returns the user id. */
export async function upsertAuthUser(email: string, password: string): Promise<string> {
  const admin = supabaseAdmin();
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (created.data.user) return created.data.user.id;

  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const existing = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (existing) {
      const { error: updateError } = await admin.auth.admin.updateUserById(existing.id, {
        password,
      });
      if (updateError) throw updateError;
      return existing.id;
    }
    if (data.users.length < 200) break;
  }
  throw created.error ?? new Error(`Could not create user ${email}`);
}
