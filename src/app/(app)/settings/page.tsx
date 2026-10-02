import Link from "next/link";
import { PageTitle } from "@/components/page-title";
import { requireShop } from "@/lib/shop";
import { DeliveriesSwitch } from "./feature-switch";

export default async function SettingsPage() {
  const { shop } = await requireShop();

  return (
    <>
      <PageTitle title="Shop" accent="settings." />

      <section className="max-w-3xl">
        <h2 className="label-caps">Features</h2>
        <p className="mt-2 text-soil-soft">
          Petal works with waste logging alone. Turn on extras when the shop is ready for them.
        </p>

        <ul className="mt-6 border-t border-soil">
          {/* Always on: the core of the app. */}
          <li className="grid grid-cols-[1fr_auto] items-center gap-6 border-b border-hairline py-6">
            <div>
              <h3 className="font-serif text-3xl">Waste log</h3>
              <p className="mt-1 text-sm text-soil-soft">
                Flower, stems, reason. The heart of Petal, always on.
              </p>
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
                  ? "On. The dashboard shows waste rate and prices waste at what you actually paid. Turning it off hides the delivery log; nothing is deleted."
                  : "Off. Log what comes in to see waste rate per flower and price waste at what you actually paid."}{" "}
                <Link href="/deliveries" className="text-soil underline decoration-hairline decoration-2 underline-offset-4 hover:decoration-moss">
                  {shop.deliveriesEnabled ? "Open deliveries" : "What changes?"}
                </Link>
              </p>
            </div>
            <DeliveriesSwitch enabled={shop.deliveriesEnabled} />
          </li>
        </ul>

        <h2 className="label-caps mt-16">Shop</h2>
        <dl className="mt-4 grid grid-cols-[8rem_1fr] gap-y-3 border-t border-soil pt-4 text-sm">
          <dt className="text-soil-soft">Name</dt>
          <dd>{shop.name}</dd>
          <dt className="text-soil-soft">Currency</dt>
          <dd>{shop.currency}</dd>
        </dl>
      </section>
    </>
  );
}
