// Resets and fills the "Petal Demo" shop with ~90 days of realistic data.
// Safe to re-run: the demo shop is deleted (cascading) and recreated.
// Other shops are never touched.
import { eq } from "drizzle-orm";
import {
  deliveries,
  flowerTypes,
  shopMembers,
  shops,
  suppliers,
  wasteEntries,
  type WasteReason,
} from "../src/db/schema";
import { DEMO_SHOP_NAME as SHOP_NAME } from "../src/lib/demo-shop";
import { connect, env, upsertAuthUser } from "./lib";
const DAYS = 90;
const DELIVERY_WEEKDAYS = [2, 5]; // Tuesday, Friday

// Deterministic PRNG so every seed produces the same demo.
let state = 20260930;
function random() {
  state = (state * 1664525 + 1013904223) % 2 ** 32;
  return state / 2 ** 32;
}
const between = (min: number, max: number) => min + random() * (max - min);
const int = (min: number, max: number) => Math.floor(between(min, max + 1));
const pick = <T>(items: T[]) => items[Math.floor(random() * items.length)];
function weighted<T>(items: [T, number][]): T {
  let r = random() * items.reduce((sum, [, w]) => sum + w, 0);
  for (const [item, w] of items) if ((r -= w) <= 0) return item;
  return items[items.length - 1][0];
}

// Fictional suppliers.
const SUPPLIERS = [
  "Meadow Lane Growers",
  "Harbour Flower Market",
  "Greenhouse Direct",
  "Tulipa Wholesale",
];

// [name, unit cost in EUR, typical waste rate, supplier index, bunch size]
const FLOWERS: [string, number, number, number, number][] = [
  ["Rose (red)", 0.85, 0.12, 1, 20],
  ["Rose (white)", 0.85, 0.14, 1, 20],
  ["Tulip", 0.45, 0.28, 3, 10],
  ["Hydrangea", 2.8, 0.32, 2, 5],
  ["Peony", 2.2, 0.3, 3, 10],
  ["Lily (Oriental)", 1.6, 0.18, 2, 10],
  ["Carnation", 0.3, 0.05, 1, 25],
  ["Chrysanthemum", 0.4, 0.05, 1, 20],
  ["Gerbera", 0.55, 0.2, 2, 10],
  ["Alstroemeria", 0.4, 0.08, 0, 10],
  ["Sunflower", 0.9, 0.15, 0, 10],
  ["Eucalyptus", 0.35, 0.06, 0, 10],
  ["Gypsophila", 0.6, 0.1, 1, 10],
  ["Ranunculus", 1.1, 0.26, 3, 10],
  ["Freesia", 0.7, 0.16, 3, 10],
  ["Lisianthus", 1.2, 0.12, 2, 10],
  ["Stock", 0.75, 0.22, 0, 10],
  ["Anemone", 1.0, 0.25, 3, 10],
  ["Delphinium", 1.4, 0.2, 2, 5],
  ["Snapdragon", 0.65, 0.14, 0, 10],
];

const REASONS: [WasteReason, number][] = [
  ["wilted", 50],
  ["unsold", 30],
  ["damaged", 15],
  ["other", 5],
];

// Dates are plain YYYY-MM-DD strings in UTC to avoid timezone drift.
function addDays(date: string, n: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
const weekday = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay();

async function main() {
  const email = env("DEMO_USER_EMAIL");
  const password = env("DEMO_USER_PASSWORD");
  const { db, close } = connect();

  try {
    const userId = await upsertAuthUser(email, password);

    await db.delete(shops).where(eq(shops.name, SHOP_NAME));
    const [shop] = await db.insert(shops).values({ name: SHOP_NAME }).returning();
    await db
      .insert(shopMembers)
      .values({ userId, shopId: shop.id })
      .onConflictDoUpdate({ target: shopMembers.userId, set: { shopId: shop.id } });

    const supplierRows = await db
      .insert(suppliers)
      .values(SUPPLIERS.map((name) => ({ shopId: shop.id, name })))
      .returning();
    const flowerRows = await db
      .insert(flowerTypes)
      .values(FLOWERS.map(([name]) => ({ shopId: shop.id, name })))
      .returning();

    const today = new Date().toISOString().slice(0, 10);
    const start = addDays(today, -DAYS);
    const deliveryRows: (typeof deliveries.$inferInsert)[] = [];
    const wasteRows: (typeof wasteEntries.$inferInsert)[] = [];

    for (let day = start; day <= today; day = addDays(day, 1)) {
      if (!DELIVERY_WEEKDAYS.includes(weekday(day))) continue;

      // Each delivery day brings 8–12 of the 20 types; roses and greenery always.
      const todays = FLOWERS.map((f, i) => ({ f, i })).filter(
        ({ f, i }) => i < 2 || f[0] === "Eucalyptus" || random() < 0.5,
      );

      for (const { f, i } of todays) {
        const [, cost, wasteRate, supplierIdx, bunch] = f;
        const quantity = bunch * int(2, 8);
        deliveryRows.push({
          shopId: shop.id,
          flowerTypeId: flowerRows[i].id,
          // Mostly the usual supplier, occasionally another one.
          supplierId: (random() < 0.85 ? supplierRows[supplierIdx] : pick(supplierRows)).id,
          quantity,
          unitCostCents: Math.round(cost * between(0.9, 1.12) * 100),
          receivedOn: day,
          createdBy: userId,
        });

        // Waste from this delivery, spread over 1–3 entries in the following week.
        let wasted = Math.min(quantity, Math.round(quantity * wasteRate * between(0.5, 1.5)));
        const entries = wasted === 0 ? 0 : int(1, Math.min(3, wasted));
        for (let e = 0; e < entries; e++) {
          const qty = e === entries - 1 ? wasted : int(1, wasted - (entries - e - 1));
          wasted -= qty;
          let on = addDays(day, int(2, 7));
          if (weekday(on) === 0) on = addDays(on, 1); // Closed Sunday: binned Monday.
          if (on > today) continue;
          wasteRows.push({
            shopId: shop.id,
            flowerTypeId: flowerRows[i].id,
            quantity: qty,
            reason: weighted(REASONS),
            wastedOn: on,
            createdBy: userId,
          });
        }
      }
    }

    for (let i = 0; i < deliveryRows.length; i += 500) {
      await db.insert(deliveries).values(deliveryRows.slice(i, i + 500));
    }
    for (let i = 0; i < wasteRows.length; i += 500) {
      await db.insert(wasteEntries).values(wasteRows.slice(i, i + 500));
    }

    console.log(
      `✔ Seeded "${SHOP_NAME}": ${flowerRows.length} flower types, ${supplierRows.length} suppliers, ` +
        `${deliveryRows.length} deliveries, ${wasteRows.length} waste entries.`,
    );
    console.log(`  Sign in as ${email}`);
  } finally {
    await close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
