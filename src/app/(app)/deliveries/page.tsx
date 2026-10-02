import { asc, desc, eq, sql } from "drizzle-orm";
import { PageTitle } from "@/components/page-title";
import { db } from "@/db";
import { deliveries, flowerTypes, suppliers } from "@/db/schema";
import { listFlowerTypes } from "@/lib/queries";
import { requireShop } from "@/lib/shop";
import { DeliveryForm, type LastPrice } from "./delivery-form";
import { DeliveriesIntro } from "./intro";
import { RecentDeliveries } from "./recent-deliveries";

const RECENT_LIMIT = 15;

export default async function DeliveriesPage() {
  const { shop } = await requireShop();

  if (!shop.deliveriesEnabled) {
    return (
      <>
        <PageTitle title="Deliveries" accent="optional." />
        <DeliveriesIntro />
      </>
    );
  }

  const [flowers, supplierRows, latest, recent, usual] = await Promise.all([
    listFlowerTypes(shop.id),
    db
      .select({ id: suppliers.id, name: suppliers.name })
      .from(suppliers)
      .where(eq(suppliers.shopId, shop.id))
      .orderBy(asc(suppliers.name)),
    // Latest delivery per flower, to pre-fill price and supplier.
    db.execute<{ flower_type_id: string; unit_cost_cents: number; supplier_id: string | null }>(sql`
      select distinct on (flower_type_id) flower_type_id, unit_cost_cents, supplier_id
      from deliveries where shop_id = ${shop.id}
      order by flower_type_id, received_on desc, created_at desc
    `),
    db
      .select({
        id: deliveries.id,
        flowerName: flowerTypes.name,
        photoUrl: flowerTypes.photoUrl,
        quantity: deliveries.quantity,
        unitCostCents: deliveries.unitCostCents,
        supplierName: suppliers.name,
        receivedOn: deliveries.receivedOn,
      })
      .from(deliveries)
      .innerJoin(flowerTypes, eq(flowerTypes.id, deliveries.flowerTypeId))
      .leftJoin(suppliers, eq(suppliers.id, deliveries.supplierId))
      .where(eq(deliveries.shopId, shop.id))
      .orderBy(desc(deliveries.receivedOn), desc(deliveries.createdAt))
      .limit(RECENT_LIMIT),
    db
      .select({ id: flowerTypes.id, cents: flowerTypes.unitCostCents })
      .from(flowerTypes)
      .where(eq(flowerTypes.shopId, shop.id)),
  ]);

  const lastPrices: Record<string, LastPrice> = Object.fromEntries(
    latest.map((r) => [r.flower_type_id, { unitCostCents: Number(r.unit_cost_cents), supplierId: r.supplier_id }]),
  );
  const usualPrices = Object.fromEntries(usual.map((r) => [r.id, r.cents]));

  return (
    <>
      <PageTitle title="Deliveries" accent="in." />
      {recent.length === 0 && (
        <p className="mb-8 max-w-2xl border-l-2 border-moss bg-sage-wash px-4 py-3 text-moss">
          Deliveries are on. Log what came in today: pick the flower, the stems and the price per
          stem. Next time the price and supplier fill themselves in.
        </p>
      )}
      <div className="md:grid md:grid-cols-12 md:items-start md:gap-12">
        <section className="md:col-span-7">
          <DeliveryForm
            flowers={flowers}
            suppliers={supplierRows}
            lastPrices={lastPrices}
            usualPrices={usualPrices}
            currency={shop.currency}
          />
        </section>
        <section className="mt-16 md:sticky md:top-8 md:col-span-5 md:mt-0">
          <h2 className="mb-4 font-serif text-3xl md:text-4xl">Recently received</h2>
          <RecentDeliveries rows={recent} currency={shop.currency} />
        </section>
      </div>
    </>
  );
}
