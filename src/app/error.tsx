"use client";

import Link from "next/link";
import { useEffect } from "react";

/** Something broke while rendering a page: say so plainly and offer a retry. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center px-5 py-16">
      <p className="label-caps">Something went wrong</p>
      <h1 className="mt-4 font-serif text-6xl leading-[0.95] md:text-7xl">
        That didn&apos;t <em className="text-rose-deep">work.</em>
      </h1>
      <p className="mt-6 max-w-md text-lg text-soil-soft">
        Petal couldn&apos;t load this page. Your entries are safe. Try again, and if it keeps
        happening, check your connection.
      </p>
      {error.digest && <p className="label-caps mt-3">Reference {error.digest}</p>}
      <div className="mt-10 flex flex-wrap items-center gap-6">
        <button type="button" onClick={reset} className="btn-primary h-14 px-8 text-base">
          Try again
        </button>
        <Link href="/" className="underline decoration-hairline decoration-2 underline-offset-8 hover:decoration-moss">
          Home
        </Link>
      </div>
    </div>
  );
}
