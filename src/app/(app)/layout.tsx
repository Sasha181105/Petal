import { Logo } from "@/components/logo";
import { requireShop } from "@/lib/shop";
import { signOut } from "../login/actions";
import { BottomNav, TopNav } from "./bottom-nav";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { shop } = await requireShop();

  return (
    <div className="mx-auto flex min-h-dvh max-w-7xl flex-col px-5 md:px-10">
      <header className="flex items-center justify-between gap-6 border-b border-hairline py-4 md:py-5">
        <div className="flex items-baseline gap-10">
          <Logo />
          <TopNav />
        </div>
        <div className="flex items-center gap-4">
          <span className="label-caps hidden sm:inline">{shop.name}</span>
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
      {/* Phone: bottom padding keeps content clear of the fixed nav. */}
      <main className="flex-1 pb-32 pt-8 md:pb-20 md:pt-14">{children}</main>
      <BottomNav />
    </div>
  );
}
