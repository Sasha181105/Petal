// Usage: npm run user:add -- <email> <password> ["Shop name"]
// Without a shop name, the user joins the only existing shop.
// With a shop name, that shop is used (and created if it doesn't exist).
import { eq } from "drizzle-orm";
import { shopMembers, shops } from "../src/db/schema";
import { connect, upsertAuthUser } from "./lib";

async function main() {
  const [email, password, shopName] = process.argv.slice(2);
  if (!email || !password) {
    console.error('Usage: npm run user:add -- <email> <password> ["Shop name"]');
    process.exit(1);
  }

  const { db, close } = connect();
  try {
    let shop: { id: string; name: string } | undefined;
    if (shopName) {
      [shop] = await db.select().from(shops).where(eq(shops.name, shopName));
      shop ??= (await db.insert(shops).values({ name: shopName }).returning())[0];
    } else {
      const all = await db.select().from(shops);
      if (all.length !== 1) {
        throw new Error(`Found ${all.length} shops; pass a shop name as the third argument.`);
      }
      shop = all[0];
    }

    const userId = await upsertAuthUser(email, password);
    await db
      .insert(shopMembers)
      .values({ userId, shopId: shop.id })
      .onConflictDoUpdate({ target: shopMembers.userId, set: { shopId: shop.id } });

    console.log(`✔ ${email} can now sign in to "${shop.name}".`);
  } finally {
    await close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
