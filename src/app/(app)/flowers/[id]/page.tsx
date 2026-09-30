import { and, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { FlowerPhoto } from "@/components/flower-photo";
import { PhotoControls } from "@/components/photo-controls";
import { db } from "@/db";
import { flowerTypes } from "@/db/schema";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import { addDays, todayIn } from "@/lib/dates";
import { requireShop } from "@/lib/shop";
import { RenameForm } from "./rename-form";

const DAYS = 30;

export default async function FlowerCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const { shop } = await requireShop();

  const [flower] = await db
    .select({ id: flowerTypes.id, name: flowerTypes.name, photoUrl: flowerTypes.photoUrl })
    .from(flowerTypes)
    .where(and(eq(flowerTypes.id, id), eq(flowerTypes.shopId, shop.id)));
  if (!flower) notFound();

  // Last 30 days for this one flower.
  const from = addDays(todayIn(), -(DAYS - 1));
  const [totals] = await db.execute<{ delivered: number; wasted: number }>(sql`
    select
      coalesce((select sum(quantity) from deliveries
                where shop_id = ${shop.id} and flower_type_id = ${id} and received_on >= ${from}::date), 0)::int
        as delivered,
      coalesce((select sum(quantity) from waste_entries
                where shop_id = ${shop.id} and flower_type_id = ${id} and wasted_on >= ${from}::date), 0)::int
        as wasted
  `);
  const delivered = Number(totals.delivered);
  const wasted = Number(totals.wasted);
  const rate = delivered > 0 ? Math.round((wasted / delivered) * 100) : null;

  return (
    <>
      <Link
        href="/flowers"
        className="label-caps inline-flex min-h-11 items-center gap-2 hover:text-soil"
      >
        ← All flowers
      </Link>

      <div className="mt-4 grid gap-10 md:grid-cols-12 md:gap-12">
        <div className="md:col-span-7">
          <FlowerPhoto url={flower.photoUrl} name={flower.name} variant="card" priority />
        </div>

        <div className="md:col-span-5">
          <RenameForm key={flower.name} flowerId={flower.id} name={flower.name} />

          <dl className="mt-8 grid grid-cols-3 border-b border-hairline pb-8">
            <Stat label="Delivered" value={delivered.toLocaleString("en-IE")} />
            <Stat label="Wasted" value={wasted.toLocaleString("en-IE")} tone="text-clay" />
            <Stat label="Waste rate" value={rate === null ? "—" : `${rate}%`} tone="text-rose-deep" />
          </dl>
          <p className="label-caps mt-3">Stems · last {DAYS} days</p>

          <div className="mt-10">
            <p className="label-caps mb-4">Photo</p>
            <PhotoControls
              flowerId={flower.id}
              hasPhoto={Boolean(flower.photoUrl)}
              enabled={isCloudinaryConfigured()}
            />
          </div>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="border-l border-hairline pl-4 first:border-l-0 first:pl-0">
      <dt className="label-caps">{label}</dt>
      <dd className={`mt-2 font-serif text-5xl leading-none ${tone}`}>{value}</dd>
    </div>
  );
}
