import { desc, eq } from "drizzle-orm";
import { PageTitle } from "@/components/page-title";
import { db } from "@/db";
import { flowerTypes, wasteEntries } from "@/db/schema";
import { listFlowerTypes } from "@/lib/queries";
import { requireShop } from "@/lib/shop";
import { RecentWaste } from "./recent-waste";
import { WasteForm } from "./waste-form";

const RECENT_LIMIT = 15;

export default async function WastePage() {
  const { shop } = await requireShop();

  const [flowers, recent] = await Promise.all([
    listFlowerTypes(shop.id),
    db
      .select({
        id: wasteEntries.id,
        flowerName: flowerTypes.name,
        photoUrl: flowerTypes.photoUrl,
        quantity: wasteEntries.quantity,
        reason: wasteEntries.reason,
        wastedOn: wasteEntries.wastedOn,
      })
      .from(wasteEntries)
      .innerJoin(flowerTypes, eq(flowerTypes.id, wasteEntries.flowerTypeId))
      .where(eq(wasteEntries.shopId, shop.id))
      .orderBy(desc(wasteEntries.wastedOn), desc(wasteEntries.createdAt))
      .limit(RECENT_LIMIT),
  ]);

  return (
    <>
      <PageTitle title="Log" accent="waste." />
      {/* Phone: one column. Desktop: form on the left, recent entries on the right. */}
      <div className="md:grid md:grid-cols-12 md:items-start md:gap-12">
        <section className="md:col-span-7">
          <WasteForm flowers={flowers} />
        </section>

        <section className="mt-16 md:sticky md:top-8 md:col-span-5 md:mt-0">
          <h2 className="mb-4 font-serif text-3xl md:text-4xl">Recently logged</h2>
          <RecentWaste rows={recent} />
        </section>
      </div>
    </>
  );
}
