import Link from "next/link";
import { Botanical } from "@/components/botanical";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-7xl flex-col px-5 md:px-10">
      <header className="border-b border-hairline py-5">
        <Logo />
      </header>
      <main className="flex flex-1 items-center gap-12 py-16">
        <div>
          <p className="label-caps">404</p>
          <h1 className="mt-4 font-serif text-6xl leading-[0.95] md:text-8xl">
            Nothing <em className="text-rose-deep">here.</em>
          </h1>
          <p className="mt-6 max-w-md text-lg text-soil-soft">
            This page doesn&apos;t exist, or it was swept up with the trimmings.
          </p>
          <Link href="/" className="btn-primary mt-10 h-14 px-8 text-base">
            Back to Petal →
          </Link>
        </div>
        <Botanical className="ml-auto hidden h-96 w-auto md:block" />
      </main>
    </div>
  );
}
