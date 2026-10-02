import { eq } from "drizzle-orm";
import Link from "next/link";
import { Botanical } from "@/components/botanical";
import { Logo } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";
import { TodayLabel } from "@/components/today-label";
import { db } from "@/db";
import { shopMembers, shops } from "@/db/schema";
import { addDays, todayIn } from "@/lib/dates";
import { change, formatMoney, formatShortDate } from "@/lib/format";
import { periodSummary, scopeOf, type PeriodSummary } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";

type Shop = {
  id: string;
  name: string;
  currency: string;
  deliveriesEnabled: boolean;
  role: "manager" | "staff";
};

const SECTIONS = [
  {
    href: "/waste",
    title: "Log waste",
    text: "Flower, stems, reason. Three taps at the counter.",
  },
  {
    href: "/deliveries",
    title: "Deliveries",
    text: "Optional. What came in, from whom, at what price per stem.",
  },
  {
    href: "/dashboard",
    title: "Dashboard",
    text: "Money lost, the five worst flowers, the trend over time.",
  },
];

async function currentShop(userId: string): Promise<Shop | null> {
  const [row] = await db
    .select({
      id: shops.id,
      name: shops.name,
      currency: shops.currency,
      deliveriesEnabled: shops.deliveriesEnabled,
      role: shopMembers.role,
    })
    .from(shopMembers)
    .innerJoin(shops, eq(shops.id, shopMembers.shopId))
    .where(eq(shopMembers.userId, userId))
    .limit(1);
  return row ?? null;
}

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Signed-in managers see their shop's week; staff and guests see no figures.
  const shop = user ? await currentShop(user.id) : null;
  const isManager = shop?.role === "manager";

  const today = todayIn();
  const from = addDays(today, -6);
  let week: PeriodSummary | null = null;
  let previous: PeriodSummary | null = null;
  if (shop && isManager) {
    [week, previous] = await Promise.all([
      periodSummary(scopeOf(shop), from, today),
      periodSummary(scopeOf(shop), addDays(from, -7), addDays(from, -1)),
    ]);
  }

  const range = `${formatShortDate(from)} – ${formatShortDate(today)}`;

  return (
    <div className="min-h-dvh">
      <div className="mx-auto max-w-7xl px-5 md:px-10">
        {/* Masthead */}
        <header className="flex items-center justify-between border-b border-hairline py-5">
          <Logo />
          <div className="flex items-center gap-6">
            <TodayLabel className="hidden font-mono text-xs uppercase tracking-[0.16em] text-soil-soft md:inline" />
            {user ? (
              <Link href="/waste" className="text-sm font-medium underline-offset-4 hover:underline">
                Open the shop →
              </Link>
            ) : (
              <Link href="/login" className="text-sm font-medium underline-offset-4 hover:underline">
                Sign in
              </Link>
            )}
          </div>
        </header>

        <main>
        {/* Hero */}
        <section className="grid gap-10 pb-20 pt-16 md:grid-cols-12 md:pb-28 md:pt-24">
          <div className="md:col-span-8">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-moss motion-safe:animate-rise">
              {shop ? shop.name : "For florists"} · at the counter
            </p>
            <h1 className="mt-6 font-serif text-[clamp(3.4rem,9vw,8.5rem)] leading-[0.92] tracking-[-0.02em] motion-safe:animate-rise [animation-delay:120ms]">
              Every stem
              <br />
              <em className="text-rose-deep">accounted for.</em>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-soil-soft motion-safe:animate-rise [animation-delay:240ms]">
              Note what goes in the bin as it happens. By Friday you know which flowers are
              costing the shop money, and exactly how much.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 motion-safe:animate-rise [animation-delay:360ms]">
              {user ? (
                <Link
                  href="/waste"
                  className="group inline-flex h-14 items-center gap-3 rounded-full bg-moss px-8 text-base font-medium text-linen transition-colors hover:bg-moss-deep focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-moss"
                >
                  Log waste
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="group inline-flex h-14 items-center gap-3 rounded-full bg-moss px-8 text-base font-medium text-linen transition-colors hover:bg-moss-deep focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-moss"
                >
                  Sign in
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </Link>
              )}
              {(!user || isManager) && (
                <Link
                  // Managers: their numbers. Guests: start a shop of their own.
                  href={user ? "/dashboard" : "/signup"}
                  className="text-base font-medium text-soil underline decoration-hairline decoration-2 underline-offset-8 transition-colors hover:decoration-rose-deep"
                >
                  {user ? "See this week in detail" : "New here? Start your shop"}
                </Link>
              )}
            </div>
          </div>

          <div className="relative hidden md:col-span-4 md:block">
            <Botanical className="absolute -top-10 right-0 h-[560px] w-auto" />
          </div>
        </section>

        {/* This week, in figures */}
        {week && previous && shop && (
          <section className="border-t border-soil pb-20 pt-6 md:pb-28">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-serif text-3xl md:text-4xl">
                The last seven days
              </h2>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-soil-soft">
                {range} · vs the week before
              </p>
            </div>

            {/* Money and waste rate need purchase prices, which only deliveries provide. */}
            {shop.deliveriesEnabled ? (
              <dl className="mt-10 grid grid-cols-2 gap-y-10 md:grid-cols-4">
                <Figure
                  label="Money lost"
                  value={formatMoney(week.lostCents, shop.currency)}
                  tone="text-clay"
                  delta={change(week.lostCents, previous.lostCents)}
                />
                <Figure
                  label="Waste rate"
                  value={week.wasteRate === null ? "—" : `${Math.round(week.wasteRate * 100)}%`}
                  tone="text-rose-deep"
                  note={`of ${week.deliveredStems.toLocaleString("en-IE")} stems delivered`}
                />
                <Figure
                  label="Stems binned"
                  value={week.wastedStems.toLocaleString("en-IE")}
                  tone="text-soil"
                  delta={change(week.wastedStems, previous.wastedStems)}
                />
                <Figure
                  label="Costliest flower"
                  value={week.worstFlower?.name ?? "—"}
                  tone="text-moss italic"
                  note={
                    week.worstFlower
                      ? `${formatMoney(week.worstFlower.lostCents, shop.currency)} lost`
                      : "Nothing wasted"
                  }
                  small
                />
              </dl>
            ) : (
              <dl className="mt-10 grid grid-cols-2 gap-y-10 md:grid-cols-3">
                <Figure
                  label="Stems binned"
                  value={week.wastedStems.toLocaleString("en-IE")}
                  tone="text-clay"
                  delta={change(week.wastedStems, previous.wastedStems)}
                />
                <Figure
                  label="Per day"
                  value={Math.round(week.wastedStems / 7).toLocaleString("en-IE")}
                  tone="text-soil"
                  note="stems on average"
                />
                <Figure
                  label="Most binned"
                  value={week.mostBinned?.name ?? "—"}
                  tone="text-moss italic"
                  note={week.mostBinned ? `${week.mostBinned.stems.toLocaleString("en-IE")} stems` : "Nothing wasted"}
                  small
                />
              </dl>
            )}
          </section>
        )}

        {/* Where to next */}
        <section className="border-t border-soil pb-24 pt-6">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-soil-soft">In the ledger</h2>
          <ol className="mt-6">
            {SECTIONS.filter((s) => s.href !== "/dashboard" || !user || isManager).map((s, i) => (
              <li key={s.href} className="border-b border-hairline">
                <Link
                  href={s.href}
                  className="group grid grid-cols-[3rem_1fr_auto] items-baseline gap-4 py-6 transition-colors hover:bg-sage-wash/60 md:grid-cols-[5rem_18rem_1fr_auto] md:py-8"
                >
                  <span className="font-mono text-sm text-soil-soft">0{i + 1}</span>
                  <span className="font-serif text-3xl md:text-5xl">{s.title}</span>
                  <span className="col-start-2 text-soil-soft md:col-start-auto">{s.text}</span>
                  <span className="row-start-1 pr-2 text-xl text-soil-soft transition-transform group-hover:translate-x-1 group-hover:text-moss md:row-start-auto col-start-3 md:col-start-auto">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        </main>

        <SiteFooter />
      </div>
    </div>
  );
}


function Figure({
  label,
  value,
  tone,
  delta,
  note,
  small,
}: {
  label: string;
  value: string;
  tone: string;
  delta?: number | null;
  note?: string;
  small?: boolean;
}) {
  return (
    <div className="border-l border-hairline pl-5 first:border-l-0 first:pl-0 md:[&:nth-child(3)]:border-l md:[&:nth-child(3)]:pl-5 [&:nth-child(3)]:border-l-0 [&:nth-child(3)]:pl-0">
      <dt className="font-mono text-[11px] uppercase tracking-[0.18em] text-soil-soft">{label}</dt>
      <dd
        className={`mt-3 font-serif leading-none ${tone} ${
          small ? "text-4xl md:text-5xl" : "text-5xl md:text-7xl"
        }`}
      >
        {value}
      </dd>
      {delta !== undefined && (
        <dd className="mt-3 text-sm text-soil-soft">
          {delta === null ? (
            "No data the week before"
          ) : (
            // More waste is worse, so up reads in clay and down in moss.
            <span className={delta > 0 ? "text-clay" : "text-moss"}>
              {delta > 0 ? "↑" : "↓"} {Math.abs(Math.round(delta * 100))}%
              <span className="text-soil-soft"> vs week before</span>
            </span>
          )}
        </dd>
      )}
      {note && <dd className="mt-3 text-sm text-soil-soft">{note}</dd>}
    </div>
  );
}
