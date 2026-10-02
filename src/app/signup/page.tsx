import Link from "next/link";
import { Botanical } from "@/components/botanical";
import { Logo } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";
import { SignupForm } from "./signup-form";

/** Public sign-up for shop managers. Staff join by invitation instead. */
export default function SignupPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-7xl flex-col px-5 md:px-10">
      <header className="flex items-center justify-between border-b border-hairline py-5">
        <Logo />
        <Link href="/login" className="text-sm underline-offset-4 hover:underline">
          Sign in
        </Link>
      </header>

      <main className="grid flex-1 gap-12 py-12 md:grid-cols-12 md:py-20">
        <div className="relative hidden md:col-span-6 md:block">
          <p className="label-caps">For shop managers</p>
          <h1 className="mt-4 font-serif text-[clamp(3rem,6vw,6rem)] leading-[0.95] tracking-[-0.02em]">
            Start your
            <br />
            <em className="text-rose-deep">shop&apos;s ledger.</em>
          </h1>
          <ul className="mt-8 max-w-sm space-y-3 text-soil-soft">
            {[
              "Your florists log what goes in the bin, in seconds.",
              "You see what waste costs, per flower and per week.",
              "Every Monday, last week's report is ready as a PDF.",
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <span aria-hidden className="mt-2.5 h-1.5 w-3 shrink-0 rounded-[100%_0] bg-moss" />
                {t}
              </li>
            ))}
          </ul>
          <Botanical className="mt-10 h-64 w-auto opacity-90" />
        </div>

        <div className="md:col-span-5 md:col-start-8">
          <h1 className="font-serif text-5xl leading-none md:hidden">
            Start your <em className="text-rose-deep">shop.</em>
          </h1>
          <p className="label-caps mt-6 md:mt-0">Create a manager account</p>
          <SignupForm />
          <p className="mt-8 border-t border-hairline pt-6 text-sm text-soil-soft">
            Working in a shop that already uses Petal? Ask your manager for an invitation.{" "}
            <Link href="/login" className="text-soil underline decoration-hairline decoration-2 underline-offset-4 hover:decoration-moss">
              Sign in
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
