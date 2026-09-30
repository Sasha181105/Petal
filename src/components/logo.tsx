import Link from "next/link";

/** Serif italic wordmark with a small mono tagline. */
export function Logo({ href = "/", tagline = true }: { href?: string; tagline?: boolean }) {
  return (
    <Link href={href} className="flex items-baseline gap-2" aria-label="Petal home">
      <span className="font-serif text-3xl italic leading-none">Petal</span>
      {tagline && (
        <span className="hidden font-mono text-[11px] uppercase tracking-[0.2em] text-soil-soft sm:inline">
          waste ledger
        </span>
      )}
    </Link>
  );
}
