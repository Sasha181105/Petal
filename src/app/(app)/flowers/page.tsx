import { and, asc, eq } from "drizzle-orm";
import { PageTitle } from "@/components/page-title";
import { db } from "@/db";
import { flowerTypes } from "@/db/schema";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import { requireShop } from "@/lib/shop";
import { AddFlowerForm } from "./add-flower-form";
import { FlowerList } from "./flower-list";

export default async function FlowersPage() {
  const { shop } = await requireShop();
  const flowers = await db
    .select({
      id: flowerTypes.id,
      name: flowerTypes.name,
      photoUrl: flowerTypes.photoUrl,
      unitCostCents: flowerTypes.unitCostCents,
    })
    .from(flowerTypes)
    .where(and(eq(flowerTypes.shopId, shop.id), eq(flowerTypes.archived, false)))
    .orderBy(asc(flowerTypes.name));

  const withPhoto = flowers.filter((f) => f.photoUrl).length;

  return (
    <>
      <PageTitle title="The" accent="flowers." />

      <section className="border-t border-hairline py-6 md:py-8">
        <AddFlowerForm uploadsEnabled={isCloudinaryConfigured()} />
      </section>

      <section className="mt-6">
        <p className="label-caps mb-4">
          {flowers.length} flowers · {withPhoto} with photos
        </p>
        <FlowerList flowers={flowers} />
      </section>
    </>
  );
}
