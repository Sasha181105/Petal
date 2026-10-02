import Link from "next/link";
import { Botanical } from "@/components/botanical";
import { Logo } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";
import { isDemoEnabled } from "@/lib/demo";
import { signInDemo } from "./actions";
import { LoginForm } from "./login-form";

const ERRORS: Record<string, string> = {
  "no-shop": "This account isn't linked to a shop yet. Ask the shop owner to add you.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex min-h-dvh max-w-7xl flex-col px-5 md:px-10">
      <header className="border-b border-hairline py-5">
        <Logo />
      </header>

      <main className="grid flex-1 items-center gap-12 py-12 md:grid-cols-12 md:py-20">
        <div className="relative hidden md:col-span-6 md:block">
          <h1 className="font-serif text-[clamp(3rem,6vw,6rem)] leading-[0.95] tracking-[-0.02em] motion-safe:animate-rise">
            Good to see you
            <br />
            <em className="text-rose-deep">back.</em>
          </h1>
          <p className="mt-6 max-w-sm text-lg leading-relaxed text-soil-soft">
            Sign in to note today&apos;s waste and see what this week has cost the shop.
          </p>
          <Botanical className="mt-10 h-72 w-auto opacity-90" />
        </div>

        <div className="md:col-span-5 md:col-start-8">
          <h1 className="font-serif text-5xl leading-none md:hidden">
            Welcome <em className="text-rose-deep">back.</em>
          </h1>
          <p className="label-caps mt-6 md:mt-0">Sign in to your shop</p>

          {error && ERRORS[error] && (
            <p className="mt-6 border-l-2 border-clay bg-clay-wash px-4 py-3 text-sm">
              {ERRORS[error]}
            </p>
          )}
          <LoginForm />
          <p className="mt-6 text-sm text-soil-soft">
            Running a shop that isn&apos;t on Petal yet?{" "}
            <Link
              href="/signup"
              className="font-medium text-soil underline decoration-hairline decoration-2 underline-offset-4 hover:decoration-moss"
            >
              Create a manager account
            </Link>
          </p>

          {isDemoEnabled() && (
            <form action={signInDemo} className="mt-8 border-t border-hairline pt-6">
              <p className="text-soil-soft">Just looking around?</p>
              <button
                type="submit"
                className="mt-1 font-medium underline decoration-hairline decoration-2 underline-offset-8 transition-colors hover:decoration-rose-deep"
              >
                Open the demo shop →
              </button>
            </form>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
