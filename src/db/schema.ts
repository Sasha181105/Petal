import { sql } from "drizzle-orm";
import {
  boolean,
  char,
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";

// RLS is enabled on every table with no policies: the app talks to Postgres
// directly via Drizzle (server-side only), so Supabase's public REST API
// cannot read or write these tables.

const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const wasteReason = pgEnum("waste_reason", [
  "wilted",
  "damaged",
  "unsold",
  "other",
]);

export const shops = pgTable("shops", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  currency: char("currency", { length: 3 }).notNull().default("EUR"),
  // Optional feature: delivery log. Purchase prices only exist with it, so
  // money figures and waste rate only appear when it's on. Off for new shops.
  deliveriesEnabled: boolean("deliveries_enabled").notNull().default(false),
  createdAt: createdAt(),
}).enableRLS();

// Managers run the shop's settings, team and weeks; staff log and read.
export const memberRole = pgEnum("member_role", ["manager", "staff"]);

export const shopMembers = pgTable(
  "shop_members",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    role: memberRole("role").notNull().default("staff"),
    createdAt: createdAt(),
  },
  (t) => [index("shop_members_shop_idx").on(t.shopId)],
).enableRLS();

/**
 * Weeks run Monday–Sunday and close by themselves. A row here means a
 * manager reopened a past week to correct it; deleting the row closes it again.
 */
export const reopenedWeeks = pgTable(
  "reopened_weeks",
  {
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    weekStart: date("week_start").notNull(),
    reopenedBy: uuid("reopened_by").references(() => authUsers.id, { onDelete: "set null" }),
    reopenedAt: timestamp("reopened_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.shopId, t.weekStart] })],
).enableRLS();

/** Failed sign-ins, to slow down password guessing. Old rows are pruned. */
export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("login_attempts_email_at_idx").on(t.email, t.at)],
).enableRLS();

export const flowerTypes = pgTable(
  "flower_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    archived: boolean("archived").notNull().default(false),
    // Photo hosted on Cloudinary. The public id is kept to delete the old
    // image when a photo is replaced or removed.
    photoUrl: text("photo_url"),
    photoPublicId: text("photo_public_id"),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("flower_types_shop_name_uq").on(t.shopId, sql`lower(${t.name})`),
  ],
).enableRLS();

export const suppliers = pgTable(
  "suppliers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("suppliers_shop_name_uq").on(t.shopId, sql`lower(${t.name})`),
  ],
).enableRLS();

export const deliveries = pgTable(
  "deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    // Default NO ACTION: a flower type with history can't be deleted (archive
    // it instead), but deleting a whole shop still cascades cleanly.
    flowerTypeId: uuid("flower_type_id")
      .notNull()
      .references(() => flowerTypes.id),
    supplierId: uuid("supplier_id").references(() => suppliers.id, {
      onDelete: "set null",
    }),
    quantity: integer("quantity").notNull(),
    unitCostCents: integer("unit_cost_cents").notNull(),
    receivedOn: date("received_on").notNull().defaultNow(),
    createdBy: uuid("created_by").references(() => authUsers.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
  },
  (t) => [
    index("deliveries_shop_date_idx").on(t.shopId, t.receivedOn),
    index("deliveries_shop_flower_idx").on(t.shopId, t.flowerTypeId),
    check("deliveries_quantity_positive", sql`${t.quantity} > 0`),
    check("deliveries_cost_non_negative", sql`${t.unitCostCents} >= 0`),
  ],
).enableRLS();

export const wasteEntries = pgTable(
  "waste_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    flowerTypeId: uuid("flower_type_id")
      .notNull()
      .references(() => flowerTypes.id),
    quantity: integer("quantity").notNull(),
    reason: wasteReason("reason").notNull(),
    wastedOn: date("wasted_on").notNull().defaultNow(),
    createdBy: uuid("created_by").references(() => authUsers.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
  },
  (t) => [
    index("waste_entries_shop_date_idx").on(t.shopId, t.wastedOn),
    index("waste_entries_shop_flower_idx").on(t.shopId, t.flowerTypeId),
    check("waste_entries_quantity_positive", sql`${t.quantity} > 0`),
  ],
).enableRLS();

export type WasteReason = (typeof wasteReason.enumValues)[number];
export type MemberRole = (typeof memberRole.enumValues)[number];
