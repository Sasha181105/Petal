import Link from "next/link";
import { Logo } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";
import { requireShop } from "@/lib/shop";
import { signOut } from "../login/actions";
import { BottomNav, TopNav } from "./bottom-nav";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { shop, role } = await requireShop();

  return (
    <div className="mx-auto flex min-h-dvh max-w-7xl flex-col px-5 md:px-10">
      <header className="flex items-center justify-between gap-6 border-b border-hairline py-4 md:py-5">
        <div className="flex items-baseline gap-10">
          <Logo />
          <TopNav deliveriesEnabled={shop.deliveriesEnabled} isManager={role === "manager"} />
        </div>
        <div className="flex items-center gap-4 print:hidden">
          <span className="label-caps hidden sm:inline">{shop.name}</span>
          <Link
            href="/settings"
            className="min-h-11 content-center text-sm text-soil-soft underline-offset-4 hover:text-soil hover:underline"
          >
            Settings
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="min-h-11 text-sm text-soil-soft underline-offset-4 hover:text-soil hover:underline"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 pb-16 pt-8 md:pb-20 md:pt-14">{children}</main>
      {/* Phone: bottom margin keeps the footer clear of the fixed nav. */}
      <SiteFooter className="mb-20 md:mb-0" />
      <BottomNav deliveriesEnabled={shop.deliveriesEnabled} isManager={role === "manager"} />
    </div>
  );
}
