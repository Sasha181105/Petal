import { and, asc, eq } from "drizzle-orm";
import Link from "next/link";
import { FlowerPhoto } from "@/components/flower-photo";
import { PageTitle } from "@/components/page-title";
import { db } from "@/db";
import { flowerTypes } from "@/db/schema";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import { requireShop } from "@/lib/shop";
import { AddFlowerForm } from "./add-flower-form";

export default async function FlowersPage() {
  const { shop } = await requireShop();
  const flowers = await db
    .select({ id: flowerTypes.id, name: flowerTypes.name, photoUrl: flowerTypes.photoUrl })
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
        <ul className="grid border-t border-soil md:grid-cols-2 md:gap-x-12">
          {flowers.map((f) => (
            <li key={f.id} className="border-b border-hairline">
              <Link
                href={`/flowers/${f.id}`}
                className="group flex items-center gap-4 py-3 transition-colors hover:bg-sage-wash/50"
              >
                <FlowerPhoto url={f.photoUrl} name={f.name} variant="thumb" />
                <span className="flex-1 font-serif text-2xl md:text-3xl">{f.name}</span>
                {!f.photoUrl && (
                  <span className="label-caps hidden sm:inline">no photo</span>
                )}
                <span className="pr-2 text-soil-soft transition-transform group-hover:translate-x-1 group-hover:text-moss">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
