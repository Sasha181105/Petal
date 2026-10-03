import { sql } from "drizzle-orm";
import Link from "next/link";
import { PageTitle } from "@/components/page-title";
import { db } from "@/db";
import type { MemberRole } from "@/db/schema";
import { requireShop } from "@/lib/shop";
import { ChangePasswordForm } from "./change-password";
import { DeleteAccount } from "./delete-account";
import { DeliveriesSwitch } from "./feature-switch";
import { TeamPanel, type Member } from "./team-panel";

export default async function SettingsPage() {
  const { shop, role, userId, email } = await requireShop();
  const isManager = role === "manager";

  const members: Member[] = isManager
    ? (
        await db.execute<{ user_id: string; email: string; role: MemberRole; last_sign_in_at: string | null }>(sql`
          select m.user_id, u.email, m.role, u.last_sign_in_at
          from shop_members m join auth.users u on u.id = m.user_id
          where m.shop_id = ${shop.id}
          order by m.role, u.email
        `)
      ).map((r) => ({ userId: r.user_id, email: r.email, role: r.role, invited: !r.last_sign_in_at }))
    : [];

  return (
    <>
      <PageTitle title="Shop" accent="settings." />

      <div className="grid max-w-5xl gap-16">
        {/* Everyone */}
        <section>
          <h2 className="label-caps">Your account</h2>
          <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-soil pt-4">
            <span className="font-serif text-3xl">{email}</span>
            <span className="rounded-full bg-linen-deep px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-soil-soft">
              {role}
            </span>
          </div>
          <h3 className="mt-8 font-serif text-2xl">Change password</h3>
          <div className="mt-4">
            <ChangePasswordForm />
          </div>
        </section>

        {isManager ? (
          <>
            <section>
              <h2 className="label-caps">Features</h2>
              <p className="mt-2 text-soil-soft">
                Petal works with waste logging alone. Turn on extras when the shop is ready for them.
              </p>
              <ul className="mt-6 border-t border-soil">
                <li className="grid grid-cols-[1fr_auto] items-center gap-6 border-b border-hairline py-6">
                  <div>
                    <h3 className="font-serif text-3xl">Waste log</h3>
                    <p className="mt-1 text-sm text-soil-soft">Flower, stems, reason. The heart of Petal, always on.</p>
                  </div>
                  <span className="label-caps">Always on</span>
                </li>
                <li className="grid grid-cols-[1fr_auto] items-center gap-6 border-b border-hairline py-6">
                  <div>
                    <h3 className="font-serif text-3xl">
                      Deliveries <em className="text-soil-soft">optional</em>
                    </h3>
                    <p className="mt-1 max-w-xl text-sm text-soil-soft">
                      {shop.deliveriesEnabled
                        ? "On. Reports show money lost (at the prices you paid) and waste rate. Turning it off hides the delivery log and all money figures; nothing is deleted."
                        : "Off. Reports count stems only. Log what comes in, with prices, to see money lost and waste rate."}{" "}
                      <Link href="/deliveries" className="text-soil underline decoration-hairline decoration-2 underline-offset-4 hover:decoration-moss">
                        {shop.deliveriesEnabled ? "Open deliveries" : "What changes?"}
                      </Link>
                    </p>
                  </div>
                  <DeliveriesSwitch enabled={shop.deliveriesEnabled} />
                </li>
              </ul>
            </section>

            <section>
              <h2 className="label-caps">Team</h2>
              <p className="mt-2 text-soil-soft">
                Staff log waste and deliveries and see reports. Managers can also change settings,
                manage the team and reopen past weeks.
              </p>
              <div className="mt-6">
                <TeamPanel members={members} me={userId} />
              </div>
            </section>
          </>
        ) : (
          <p className="border-l-2 border-hairline pl-4 text-sm text-soil-soft">
            Features and the team are managed by the shop&apos;s manager.
          </p>
        )}

        <section>
          <h2 className="label-caps">Shop</h2>
          <dl className="mt-4 grid grid-cols-[8rem_1fr] gap-y-3 border-t border-soil pt-4 text-sm">
            <dt className="text-soil-soft">Name</dt>
            <dd>{shop.name}</dd>
            <dt className="text-soil-soft">Currency</dt>
            <dd>{shop.currency}</dd>
          </dl>
        </section>

        <section>
          <h2 className="label-caps text-rose-deep">Delete account</h2>
          <div className="mt-4 border-t border-rose-deep/40 pt-4">
            <DeleteAccount
              wholeShop={isManager && !members.some((m) => m.role === "manager" && m.userId !== userId)}
              shopName={shop.name}
              teamSize={members.filter((m) => m.userId !== userId).length}
            />
          </div>
        </section>
      </div>
    </>
  );
}
