import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { FlowerPhoto } from "@/components/flower-photo";
import { PhotoControls } from "@/components/photo-controls";
import { db } from "@/db";
import { flowerTypes } from "@/db/schema";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import { addDays, todayIn } from "@/lib/dates";
import { formatMoney, formatNumber, formatPercent } from "@/lib/format";
import { requireShop } from "@/lib/shop";
import { flowerStats, scopeOf } from "@/lib/stats";
import { RenameForm } from "./rename-form";

const DAYS = 30;

export default async function FlowerCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const { shop, role } = await requireShop();

  const [flower] = await db
    .select({ id: flowerTypes.id, name: flowerTypes.name, photoUrl: flowerTypes.photoUrl })
    .from(flowerTypes)
    .where(and(eq(flowerTypes.id, id), eq(flowerTypes.shopId, shop.id)));
  if (!flower) notFound();

  // Last 30 days for this one flower, counted the same way as the dashboard.
  const today = todayIn();
  const stats = (await flowerStats(scopeOf(shop), addDays(today, -(DAYS - 1)), today)).find(
    (f) => f.id === id,
  );
  const wasted = stats?.wastedStems ?? 0;

  return (
    <>
      <Link href="/flowers" className="label-caps inline-flex min-h-11 items-center gap-2 hover:text-soil">
        ← All flowers
      </Link>

      <div className="mt-4 grid gap-10 md:grid-cols-12 md:gap-12">
        <div className="md:col-span-7">
          <FlowerPhoto url={flower.photoUrl} name={flower.name} variant="card" priority />
        </div>

        <div className="md:col-span-5">
          <RenameForm key={flower.name} flowerId={flower.id} name={flower.name} />

          {/* Waste figures are for managers; money only with deliveries (purchase prices). */}
          {role === "manager" && (
            <>
              <dl className="mt-8 grid grid-cols-3 border-b border-hairline pb-8">
                {shop.deliveriesEnabled ? (
                  <>
                    <Stat label="Binned" value={formatNumber(wasted)} />
                    <Stat
                      label="Waste rate"
                      value={stats?.wasteRate == null ? "—" : formatPercent(stats.wasteRate)}
                      tone="text-rose-deep"
                    />
                    <Stat label="Lost" value={formatMoney(stats?.lostCents ?? 0, shop.currency)} tone="text-clay" />
                  </>
                ) : (
                  <>
                    <Stat label="Binned" value={formatNumber(wasted)} tone="text-clay" />
                    <Stat label="Per week" value={formatNumber(Math.round((wasted / DAYS) * 7))} />
                  </>
                )}
              </dl>
              <p className="label-caps mt-3">
                Stems · last {DAYS} days
                {shop.deliveriesEnabled && ` · ${formatNumber(stats?.deliveredStems ?? 0)} delivered`}
              </p>
            </>
          )}

          <div className="mt-10 border-t border-hairline pt-6">
            <p className="label-caps mb-4">Photo</p>
            <PhotoControls flowerId={flower.id} hasPhoto={Boolean(flower.photoUrl)} enabled={isCloudinaryConfigured()} />
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
