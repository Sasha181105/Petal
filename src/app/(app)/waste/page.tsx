import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { PageTitle } from "@/components/page-title";
import { db } from "@/db";
import { flowerTypes, wasteEntries } from "@/db/schema";
import { weekStartOf } from "@/lib/dates";
import { formatShortDate } from "@/lib/format";
import { listFlowerTypes } from "@/lib/queries";
import { requireShop } from "@/lib/shop";
import { openWeeks } from "@/lib/weeks";
import { RecentWaste } from "./recent-waste";
import { WasteForm } from "./waste-form";

const RECENT_LIMIT = 15;

export default async function WastePage() {
  const { shop, role } = await requireShop();

  const [flowers, recent, open] = await Promise.all([
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
    openWeeks(shop.id),
  ]);

  const openStarts = new Set(open.weeks.map((w) => w.start));
  const rows = recent.map((r) => ({ ...r, locked: !openStarts.has(weekStartOf(r.wastedOn)) }));
  const current = open.weeks[open.weeks.length - 1];
  const reopened = open.weeks.filter((w) => w.status === "reopened");

  return (
    <>
      <PageTitle title="Log" accent="waste." />

      {/* Which week entries go into. */}
      <div className="-mt-4 mb-8 flex flex-wrap items-center gap-x-4 gap-y-2 md:-mt-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-sage-wash px-3 py-1 text-sm text-moss">
          <span aria-hidden className="size-2 rounded-full bg-moss" />
          Week {current.number} · {formatShortDate(current.start)} – {formatShortDate(current.end)} · open
        </span>
        {reopened.map((w) => (
          <span key={w.start} className="inline-flex items-center gap-2 rounded-full bg-clay-wash px-3 py-1 text-sm text-clay">
            Week {w.number} reopened
          </span>
        ))}
        <span className="text-sm text-soil-soft">Closes by itself on Sunday at midnight.</span>
        {role === "manager" && (
          <Link href="/weeks" className="text-sm underline decoration-hairline decoration-2 underline-offset-4 hover:decoration-moss">
            All weeks & reports
          </Link>
        )}
      </div>

      {/* Phone: one column. Desktop: form on the left, recent entries on the right. */}
      <div className="md:grid md:grid-cols-12 md:items-start md:gap-12">
        <section className="md:col-span-7">
          <WasteForm flowers={flowers} minDate={open.weeks[0].start} />
        </section>

        <section className="mt-16 md:sticky md:top-8 md:col-span-5 md:mt-0">
          <h2 className="mb-4 font-serif text-3xl md:text-4xl">Recently logged</h2>
          <RecentWaste rows={rows} />
        </section>
      </div>
    </>
  );
}
