import { eq, sql } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { flowerTypes } from "@/db/schema";
import { requireManagerPage } from "@/lib/shop";
import { CataloguePicker } from "./catalogue-picker";
import { StartChoice } from "./start-choice";

/** First stop after a manager signs up. Each step ticks itself off. */
export default async function WelcomePage() {
  const { shop } = await requireManagerPage();

  const [counts] = await db.execute<{ flowers: number; members: number; entries: number }>(sql`
    select
      (select count(*) from flower_types where shop_id = ${shop.id})::int as flowers,
      (select count(*) from shop_members where shop_id = ${shop.id})::int as members,
      (select count(*) from waste_entries where shop_id = ${shop.id})::int as entries
  `);

  const fresh = Number(counts.flowers) === 0;
  const have = fresh
    ? []
    : (await db.select({ name: flowerTypes.name }).from(flowerTypes).where(eq(flowerTypes.shopId, shop.id))).map((f) => f.name);

  const steps = [
    {
      href: "/flowers",
      title: "Add your flowers",
      text: "The ones you sell, with a photo if you like, so they're one tap away at the counter.",
      done: Number(counts.flowers) > 0,
      doneText: `${counts.flowers} added`,
    },
    {
      href: "/settings",
      title: "Invite your team",
      text: "Add your florists in Settings → Team. They log waste; you see the reports.",
      done: Number(counts.members) > 1,
      doneText: `${Number(counts.members) - 1} invited`,
    },
    {
      href: "/waste",
      title: "Log the first waste",
      text: "Flower, stems, reason. From then on, every Monday brings last week's report.",
      done: Number(counts.entries) > 0,
      doneText: "Started",
    },
  ];

  return (
    <div className="max-w-4xl">
      <p className="label-caps">{shop.name}</p>
      <h1 className="mt-3 font-serif text-6xl leading-[0.95] tracking-[-0.02em] md:text-8xl">
        Welcome to <em className="text-rose-deep">Petal.</em>
      </h1>
      <p className="mt-6 max-w-xl text-lg text-soil-soft">
        Your shop is ready and you&apos;re its manager. Three small steps and the ledger starts
        filling itself.
      </p>

      {fresh && <StartChoice />}

      <ol className="mt-12 border-t border-soil">
        {steps.map((s, i) => (
          <li key={s.href} className="border-b border-hairline">
            <Link
              href={s.href}
              className="group grid grid-cols-[3rem_1fr_auto] items-baseline gap-4 py-6 transition-colors hover:bg-sage-wash/50 md:py-8"
            >
              <span className="font-mono text-sm text-soil-soft">0{i + 1}</span>
              <span>
                <span className={`block font-serif text-3xl md:text-4xl ${s.done ? "text-soil-soft line-through decoration-moss decoration-2" : ""}`}>
                  {s.title}
                </span>
                <span className="mt-2 block max-w-lg text-soil-soft">{s.text}</span>
              </span>
              <span className="pr-2 text-right">
                {s.done ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-sage-wash px-3 py-1 text-sm text-moss">
                    ✓ {s.doneText}
                  </span>
                ) : (
                  <span className="text-xl text-soil-soft transition-transform group-hover:translate-x-1 group-hover:text-moss">→</span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ol>

      {!fresh && (
        <details className="group mt-10 border-b border-hairline pb-6">
          <summary className="cursor-pointer list-none font-serif text-2xl marker:hidden">
            Add more from Petal&apos;s list{" "}
            <span className="inline-block text-soil-soft transition-transform group-open:rotate-90">→</span>
          </summary>
          <div className="mt-6">
            <CataloguePicker have={have} />
          </div>
        </details>
      )}

      <p className="mt-10 text-sm text-soil-soft">
        Optional, any time: turn on{" "}
        <Link href="/deliveries" className="text-soil underline decoration-hairline decoration-2 underline-offset-4 hover:decoration-moss">
          deliveries
        </Link>{" "}
        to see what share of each delivery gets thrown away.
      </p>
    </div>
  );
}
